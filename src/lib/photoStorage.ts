import { createClient } from "@supabase/supabase-js";

/**
 * Profile photos live in the `profile-photos` bucket of the same Supabase
 * project that backs Postgres. The bucket is public, so `photoUrl` on User is
 * a permanent CDN URL — the same shape the Vercel Blob setup used before.
 *
 * Uploads run with the service-role key: Daisy authenticates with NextAuth,
 * so there is no Supabase JWT for RLS to check against.
 */

const BUCKET = "profile-photos";

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase storage is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Uploads and returns the public URL. Throws if the upload fails. */
export async function uploadProfilePhoto(
  image: Buffer,
  contentType: string,
  userId: string,
): Promise<string> {
  const ext = EXT_BY_TYPE[contentType] ?? "jpg";
  const path = `photos/${userId}-${Date.now()}.${ext}`;

  const supabase = client();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, image, { contentType, upsert: false });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Only ever delete objects we uploaded: our bucket, path photos/{userId}-timestamp.ext */
export function isDaisyProfilePhoto(url: string, userId: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith(".supabase.co")) return false;
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    if (!pathname.startsWith(prefix)) return false;
    const key = pathname.slice(prefix.length);
    return (
      key.startsWith(`photos/${userId}-`) && /\.(jpe?g|png|webp)$/i.test(key)
    );
  } catch {
    return false;
  }
}

/** Best effort: a failed delete is logged, never thrown. */
export async function deleteProfilePhoto(
  url: string | null,
  userId: string,
): Promise<void> {
  if (!url || !isDaisyProfilePhoto(url, userId)) return;
  try {
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    const key = new URL(url).pathname.slice(prefix.length);
    const { error } = await client().storage.from(BUCKET).remove([key]);
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("Could not delete profile photo:", error);
  }
}
