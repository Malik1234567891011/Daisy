import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Deliberately permissive gate on profile photos. It only catches the two
 * cases that make a match awkward or unsafe — no person in frame at all, and
 * explicit content. Everything else (sunglasses, hats, side profiles, group
 * shots, filters, bad light, blurry, distant) is a real photo of a real
 * person and gets through.
 */

const MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 15000;

const verdictSchema = z.object({
  facePresent: z
    .boolean()
    .describe("true if any human face is visible, however partial or unclear"),
  explicit: z.boolean().describe("true only for nudity or sexual content"),
  reason: z.string().describe("at most 8 words, for server logs"),
});

/** What the model saw, before any policy is applied to it. */
export type PhotoInspection = z.infer<typeof verdictSchema>;

const PROMPT = `You are screening a photo someone uploaded as their dating profile picture.

Answer two questions.

1. facePresent — is there at least one human face in this image?
   Say true for: any real person's face, even partially visible, in profile,
   far away, blurry, dark, wearing sunglasses/hat/mask/makeup, heavily
   filtered, in a group, or in an old or low quality photo.
   Say false ONLY when there is plainly no human face: an animal, an object,
   a landscape, food, a screenshot, a plain logo, a page of text, or a blank
   or unreadable image.

2. explicit — does the image contain nudity or sexual content?
   Say true only for genuinely explicit content. Swimwear, gym photos,
   shirtless beach shots and normal revealing clothing are all false.

When you are unsure, answer facePresent true and explicit false. A wrongly
rejected photo is a much worse outcome than a wrongly accepted one.`;

export type PhotoVerdict =
  | { ok: true; inspection: PhotoInspection | null }
  | {
      ok: false;
      code: "no_face" | "explicit";
      message: string;
      inspection: PhotoInspection;
    };

/**
 * Asks the model what is in the photo. Returns null when the question could
 * not be asked at all — no API key, a timeout, an outage at Google. Callers
 * decide what an unknown means: the upload gate lets the photo through, the
 * admin scan leaves the row marked unchecked.
 */
export async function inspectPhoto(
  image: Buffer,
  mediaType: string,
): Promise<PhotoInspection | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("photoCheck: GEMINI_API_KEY missing, skipping face check");
    return null;
  }

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { output } = await generateText({
      model: google(MODEL),
      output: Output.object({ schema: verdictSchema }),
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "file", mediaType, data: image },
          ],
        },
      ],
    });

    return output;
  } catch (error) {
    console.error("photoCheck: check failed —", error);
    return null;
  }
}

export async function checkProfilePhoto(
  image: Buffer,
  mediaType: string,
): Promise<PhotoVerdict> {
  const inspection = await inspectPhoto(image, mediaType);

  // Fail open: a timeout or an outage at Google must never block a signup.
  if (!inspection) return { ok: true, inspection: null };

  if (inspection.explicit) {
    console.log("photoCheck: rejected explicit —", inspection.reason);
    return {
      ok: false,
      code: "explicit",
      message: "Let's keep it PG. Try a different photo.",
      inspection,
    };
  }

  if (!inspection.facePresent) {
    console.log("photoCheck: rejected no face —", inspection.reason);
    return {
      ok: false,
      code: "no_face",
      message: "We couldn't find a face in that one. Try a photo of you.",
      inspection,
    };
  }

  return { ok: true, inspection };
}
