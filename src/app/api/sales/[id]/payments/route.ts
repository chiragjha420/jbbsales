import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value || '00000000-0000-0000-0000-000000000002';

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero.' }, { status: 400 });
    }

    if (!body.paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
    }

    if (!body.proofs || !Array.isArray(body.proofs) || body.proofs.length === 0) {
      return NextResponse.json({ error: 'At least one payment proof screenshot is required.' }, { status: 400 });
    }

    const payment = await repository.addPayment(params.id, {
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      recordedBy: userId,
      proofs: body.proofs,
    });

    const updatedSale = await repository.getSaleById(params.id);

    return NextResponse.json({ payment, sale: updatedSale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
