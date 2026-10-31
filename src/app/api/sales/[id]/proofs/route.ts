import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value || '00000000-0000-0000-0000-000000000002';

    if (!body.paymentId) {
      return NextResponse.json({ error: 'Payment ID is required.' }, { status: 400 });
    }

    if (!body.dataUrl || !body.fileName) {
      return NextResponse.json({ error: 'Valid proof image is required.' }, { status: 400 });
    }

    const proof = await repository.addPaymentProof(body.paymentId, params.id, {
      fileName: body.fileName,
      mimeType: body.mimeType || 'image/jpeg',
      dataUrl: body.dataUrl,
      size: body.size,
      uploadedBy: userId,
    });

    const updatedSale = await repository.getSaleById(params.id);

    return NextResponse.json({ proof, sale: updatedSale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
