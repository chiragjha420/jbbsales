import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  try {
    const profiles = await repository.getProfiles();
    return NextResponse.json({ profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.email || !body.full_name) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const profile = await repository.createProfile({
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      role: body.role || 'salesperson',
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const profile = await repository.updateProfile(body.id, {
      full_name: body.full_name,
      phone: body.phone,
      role: body.role,
      active: body.active,
    });

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
