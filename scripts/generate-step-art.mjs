#!/usr/bin/env node
/**
 * Generates the How It Works artwork with Gemini.
 *
 *   node --env-file=.env scripts/generate-step-art.mjs
 *   node --env-file=.env scripts/generate-step-art.mjs 2      # just step 2
 *
 * Writes public/howitworks/step-N.png. Re-run to iterate on a single prompt
 * without regenerating the set.
 *
 * The prompts describe Daisy's own product moments in Montreal, shot warm and
 * grounded. Deliberately not styled after anyone else's marketing: original
 * work is the whole point of generating it rather than borrowing it.
 */

/* Tried in order. gemini-3-pro-image is paid-only (free-tier quota is 0), so
   the flash models are the practical default on a fresh key. */
const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3-pro-image",
];
const OUT_DIR = "public/howitworks";

/** Shared direction so the four read as one set. */
const STYLE = [
  "Bold graphic collage in a lo-fi zine style, wide banner crop roughly 2.6:1.",
  "Heavy halftone dot screen and visible print dither over everything, slightly misregistered.",
  "Photographs tilted at angles like scattered prints, thick white borders, hard drop shadows.",
  "Strong flat duotone colour washes over each photo — sage green, warm gold, deep ink, cream.",
  "Playful, high energy, slightly retro. Plain cream background around the collage.",
  "No text, no lettering, no logos, no watermarks, no user interface elements.",
  "No recognisable faces — crop below the chin, shoot from behind, or show hands only.",
].join(" ");

const STEPS = [
  {
    n: 1,
    slug: "build-profile",
    prompt:
      "A scattered collage of three tilted prints: a hand filling a short paper form, a canvas " +
      "tote bag, and a coffee cup seen from above. Each print a different flat duotone.",
  },
  {
    n: 2,
    slug: "wait-for-wednesday",
    prompt:
      "A collage of a phone held in one hand with a big blank speech bubble beside it, and a torn " +
      "paper calendar page. Bold flat colour blocks behind them.",
  },
  {
    n: 3,
    slug: "say-yes",
    prompt:
      "Two tilted overlapping prints with thick white borders: two coffee cups on a cafe table " +
      "from above, and two empty chairs facing each other. Duotone gold and sage.",
  },
  {
    n: 4,
    slug: "go-meet",
    prompt:
      "A collage of tilted prints of a Montreal Plateau street: a cafe storefront, a spiral " +
      "staircase, a parked bicycle. Saturated duotone washes, scattered like photos on a table.",
  },
];

async function tryModel(model, step) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing — run with node --env-file=.env");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${step.prompt} ${STYLE}` }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    },
  );

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${body?.error?.message ?? JSON.stringify(body).slice(0, 300)}`);
  }

  const parts = body?.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((p) => p.inlineData?.data);
  if (!image) {
    const reason = body?.candidates?.[0]?.finishReason ?? "no inlineData in response";
    throw new Error(`no image returned (${reason})`);
  }

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(OUT_DIR, { recursive: true });
  const path = `${OUT_DIR}/step-${step.n}.png`;
  await writeFile(path, Buffer.from(image.inlineData.data, "base64"));
  return { path, model };
}

async function generate(step) {
  const failures = [];
  for (const model of MODELS) {
    try {
      return await tryModel(model, step);
    } catch (err) {
      failures.push(`${model}: ${err.message.split("\n")[0].slice(0, 90)}`);
    }
  }
  throw new Error("all models failed\n    " + failures.join("\n    "));
}

const only = process.argv[2] ? Number(process.argv[2]) : null;
const queue = only ? STEPS.filter((s) => s.n === only) : STEPS;

for (const step of queue) {
  process.stdout.write(`step ${step.n} (${step.slug}) … `);
  try {
    const { path, model } = await generate(step);
    const { stat } = await import("node:fs/promises");
    console.log(`ok  ${path}  ${Math.round((await stat(path)).size / 1024)}KB  via ${model}`);
  } catch (err) {
    console.log(`FAILED  ${err.message}`);
  }
}
