import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sale = await repository.getSaleById(params.id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale record not found.' }, { status: 404 });
    }

    const userRole = req.cookies.get('jbb_user_role')?.value;
    const userId = req.cookies.get('jbb_user_id')?.value;

    // Permissions check: Salespeople cannot see other salespeople's private sales
    if (userRole !== 'admin' && userId && sale.salesperson_id !== userId) {
      return NextResponse.json({ error: 'Access denied to this sale record.' }, { status: 403 });
    }

    return NextResponse.json({ sale });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
