import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const profile = await repository.getProfileByEmail(cleanEmail);

    if (!profile) {
      return NextResponse.json(
        { error: 'No account found with this email. Contact administrator.' },
        { status: 401 }
      );
    }

    if (!profile.active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact management.' },
        { status: 403 }
      );
    }

    // Set auth cookie
    const response = NextResponse.json({
      user: profile,
      message: 'Logged in successfully.',
    });

    response.cookies.set('jbb_user_id', profile.id, {
      path: '/',
      httpOnly: false, // Accessible to client for quick state hydration
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('jbb_user_role', profile.role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 500 });
  }
}
