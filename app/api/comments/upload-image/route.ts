import { NextRequest, NextResponse } from 'next/server';
import { uploadCommentImage } from '@/lib/supabase/storage';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const dataUrl: string | undefined = body?.image;

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'image must be a data URL' }, { status: 400 });
  }
  if (dataUrl.length > MAX_BYTES * 1.4) {
    // base64 inflates size by ~4/3; rough guard before we even try to decode it
    return NextResponse.json({ error: 'Image is too large' }, { status: 400 });
  }

  try {
    const url = await uploadCommentImage(dataUrl);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
