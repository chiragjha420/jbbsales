import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await repository.getSalespersonAnalytics({
      start: startDate,
      end: endDate,
    });

    return NextResponse.json({ salespeople: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
