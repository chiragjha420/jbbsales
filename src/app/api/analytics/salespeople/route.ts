import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const userRole = req.cookies.get('jbb_user_role')?.value;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Salesperson performance analytics are reserved for administrator access.' },
        { status: 403 }
      );
    }

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
