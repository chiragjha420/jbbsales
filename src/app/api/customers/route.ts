import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const salespersonId = searchParams.get('salespersonId') || undefined;

    const customers = await repository.getCustomers({
      search,
      salespersonId,
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value;

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }

    if (!body.phone || body.phone.trim() === '') {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const customer = await repository.createCustomer({
      name: body.name,
      company: body.company,
      contact_person: body.contact_person,
      phone: body.phone,
      email: body.email,
      address: body.address,
      city: body.city,
      notes: body.notes,
      assigned_salesperson_id: body.assigned_salesperson_id || userId,
      createdBy: userId,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
