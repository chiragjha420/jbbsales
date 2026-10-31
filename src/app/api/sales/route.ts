import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userRole = req.cookies.get('jbb_user_role')?.value;
    const userId = req.cookies.get('jbb_user_id')?.value;

    let salespersonId = searchParams.get('salespersonId') || undefined;

    // Enforce role-based access:
    // Salespeople can ONLY see their own sales unless they are admin!
    if (userRole !== 'admin') {
      salespersonId = userId || '00000000-0000-0000-0000-000000000002';
    }

    const customerId = searchParams.get('customerId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as any) || 'newest';

    const sales = await repository.getSales({
      salespersonId,
      customerId,
      productId,
      paymentStatus,
      startDate,
      endDate,
      search,
      sort,
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value || '00000000-0000-0000-0000-000000000002';

    if (!body.customerId) {
      return NextResponse.json({ error: 'Please select a customer.' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Add at least one product to the sale.' }, { status: 400 });
    }

    for (const item of body.items) {
      if (!item.productId) {
        return NextResponse.json({ error: 'Invalid product selection.' }, { status: 400 });
      }
      if (item.quantity === undefined || Number(item.quantity) <= 0) {
        return NextResponse.json({ error: 'Quantity must be positive for all items.' }, { status: 400 });
      }
      if (item.sellingPrice === undefined || Number(item.sellingPrice) < 0) {
        return NextResponse.json({ error: 'Selling price cannot be negative.' }, { status: 400 });
      }
    }

    // Validate payment if supplied
    if (body.initialPayment && body.initialPayment.amount > 0) {
      if (!body.initialPayment.paymentMethod) {
        return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
      }
      if (!body.initialPayment.proofs || body.initialPayment.proofs.length === 0) {
        return NextResponse.json({ error: 'Payment proof screenshot is required when entering a payment.' }, { status: 400 });
      }
    }

    const sale = await repository.createSale({
      salespersonId: body.salespersonId || userId,
      customerId: body.customerId,
      items: body.items,
      courierCharge: body.courierCharge ? Number(body.courierCharge) : 0,
      courierCost: body.courierCost ? Number(body.courierCost) : 0,
      otherCharge: body.otherCharge ? Number(body.otherCharge) : 0,
      otherCost: body.otherCost ? Number(body.otherCost) : 0,
      notes: body.notes,
      initialPayment: body.initialPayment,
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
