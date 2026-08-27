import { NextResponse } from 'next/server';
import { getAllMovies } from '@/lib/movies-server';

export async function GET() {
  const items = await getAllMovies();
  return NextResponse.json({ items });
}
