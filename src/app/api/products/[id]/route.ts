import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await repository.getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const userId = req.cookies.get('jbb_user_id')?.value;

    const product = await repository.updateProduct(params.id, body, userId);
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.cookies.get('jbb_user_id')?.value;
    // Deactivate rather than hard delete to protect historical sales integrity
    const product = await repository.updateProduct(params.id, { active: false }, userId);
    return NextResponse.json({ message: 'Product deactivated successfully.', product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
