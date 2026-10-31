import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await repository.getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value;

    if (body.reassignToSalespersonId) {
      const customer = await repository.reassignCustomer(
        params.id,
        body.reassignToSalespersonId,
        userId || 'admin'
      );
      return NextResponse.json({ customer, message: 'Customer reassigned successfully.' });
    }

    return NextResponse.json({ error: 'Unsupported update operation.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
