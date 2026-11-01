import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const products = await repository.getProducts({
      search,
      category,
      activeOnly,
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value;

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }

    const costPrice =
      body.cost_price !== undefined && body.cost_price !== null && body.cost_price !== ''
        ? Number(body.cost_price)
        : 0;

    if (isNaN(costPrice) || costPrice < 0) {
      return NextResponse.json({ error: 'Cost price cannot be negative.' }, { status: 400 });
    }

    if (!body.keywords || !Array.isArray(body.keywords) || body.keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required for product discovery.' }, { status: 400 });
    }

    const product = await repository.createProduct({
      name: body.name,
      sku: body.sku,
      description: body.description,
      cost_price: costPrice,
      recommended_price: body.recommended_price ? Number(body.recommended_price) : undefined,
      minimum_price: body.minimum_price ? Number(body.minimum_price) : undefined,
      category: body.category || 'General',
      keywords: body.keywords,
      images: body.images || [],
      createdBy: userId,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
