import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  try {
    const data = await repository.getCustomerAnalytics();
    return NextResponse.json({ customers: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
