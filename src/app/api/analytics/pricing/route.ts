import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salespersonId = searchParams.get('salespersonId') || undefined;

    const data = await repository.getProductPricingAnalytics(salespersonId);

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
