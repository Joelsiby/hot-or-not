import { NextRequest, NextResponse } from 'next/server';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB limit for request body

export function limitRequestSize(request: NextRequest): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }
  }
  
  return null;
}
