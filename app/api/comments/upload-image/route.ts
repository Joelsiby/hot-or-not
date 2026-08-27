import { NextRequest, NextResponse } from 'next/server';
import { uploadCommentImage } from '@/lib/supabase/storage';
import { validateImageMetadata, isMimeTypeValid, isExtensionValid } from '@/lib/image-validation';
import { rateLimitImageUpload, getClientIdentifier } from '@/lib/rate-limit';
import { limitRequestSize } from '@/lib/request-limiter';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  // Check request size limit
  const sizeLimitError = limitRequestSize(request);
  if (sizeLimitError) return sizeLimitError;

  // Rate limiting based on robust client identification
  const identifier = getClientIdentifier(request);
  
  const rateLimitResult = await rateLimitImageUpload(identifier);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Too many upload attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  const body = await request.json().catch(() => null);
  const dataUrl: string | undefined = body?.image;

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'image must be a data URL' }, { status: 400 });
  }

  // Extract MIME type and base64 data
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid image data URL format' }, { status: 400 });
  }

  const [, mimeType, base64] = match;

  // Validate MIME type
  if (!isMimeTypeValid(mimeType)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
      { status: 400 }
    );
  }

  // Validate extension
  const extension = mimeType.split('/')[1] || 'jpg';
  if (!isExtensionValid(extension)) {
    return NextResponse.json(
      { error: 'Invalid file extension. Allowed: jpg, jpeg, png, gif, webp' },
      { status: 400 }
    );
  }

  // Convert to bytes for accurate size check
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image size exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
      { status: 400 }
    );
  }

  // Validate image metadata
  try {
    await validateImageMetadata(bytes);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid image file' },
      { status: 400 }
    );
  }

  // Additional rough guard before base64 decode
  if (dataUrl.length > MAX_BYTES * 1.4) {
    return NextResponse.json({ error: 'Image is too large' }, { status: 400 });
  }

  try {
    const url = await uploadCommentImage(dataUrl);
    return NextResponse.json(
      { url },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
