import { NextRequest, NextResponse } from 'next/server';
import { runControversyIngest } from '@/lib/controversy-bot/ingest';

// Triggered on a schedule by .github/workflows/fetch-controversies.yml
// (every 5 min) rather than Vercel Cron — Vercel's Hobby plan only allows
// daily cron jobs, and this needs to run often to feel "live". Protect it
// with CRON_SECRET in production so randoms can't trigger scrapes.
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runControversyIngest();
    return NextResponse.json(result);
  } catch (err) {
    console.error('controversy ingest failed', err);
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 });
  }
}
