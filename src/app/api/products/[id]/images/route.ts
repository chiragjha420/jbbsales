import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    if (!body.dataUrl || !body.fileName) {
      return NextResponse.json({ error: 'Image data and file name are required.' }, { status: 400 });
    }

    const image = await repository.addProductImage(params.id, {
      fileName: body.fileName,
      dataUrl: body.dataUrl,
      isPrimary: body.isPrimary || false,
    });

    const updatedProduct = await repository.getProductById(params.id);
    return NextResponse.json({ image, product: updatedProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required.' }, { status: 400 });
    }

    await repository.deleteProductImage(params.id, imageId);
    const updatedProduct = await repository.getProductById(params.id);

    return NextResponse.json({ product: updatedProduct, message: 'Image deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.imageId) {
      return NextResponse.json({ error: 'Image ID is required.' }, { status: 400 });
    }

    await repository.setPrimaryProductImage(params.id, body.imageId);
    const updatedProduct = await repository.getProductById(params.id);

    return NextResponse.json({ product: updatedProduct, message: 'Primary photo updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
