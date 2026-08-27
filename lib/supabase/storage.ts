import { getSupabaseServerClient } from '@/lib/supabase/server';

const BUCKET = 'comment-images';

// The comment composer sends the full-size image as a data URL. We store
// only a tiny inline thumbnail in Postgres (see `comments.thumbnail_url`);
// the full-size image is uploaded here so the browser only fetches it when
// a comment card is actually hovered, instead of shipping it with every
// page load.
export async function uploadCommentImage(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Expected a base64 image data URL');
  const [, mimeType, base64] = match;
  const extension = mimeType.split('/')[1] || 'jpg';
  const bytes = Buffer.from(base64, 'base64');

  const supabase = getSupabaseServerClient();
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
