import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let profile = null;

    // 1. Attempt Supabase Auth signInWithPassword
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password),
      });

      if (!authError && authData?.user) {
        // 1. Check if profile exists directly in Supabase DB profiles table
        let dbProfile: any = null;
        try {
          const { data: supabaseRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          if (supabaseRow) {
            dbProfile = supabaseRow;
          }
        } catch {
          // Table may not yet be created or schema being setup
        }

        // 2. Resolve display name and role from Supabase DB or Auth Metadata
        const userMeta = authData.user.user_metadata || {};
        const emailPrefix = cleanEmail.split('@')[0];
        const displayName =
          dbProfile?.full_name ||
          userMeta.full_name ||
          userMeta.name ||
          (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));

        const role =
          dbProfile?.role ||
          userMeta.role ||
          (cleanEmail.startsWith('admin') ? 'admin' : 'salesperson');

        // Sync into application store
        profile = await repository.createOrUpdateProfile({
          id: authData.user.id,
          email: cleanEmail,
          full_name: displayName,
          role: role as any,
          active: dbProfile?.active !== undefined ? dbProfile.active : true,
        });
      }
    } catch {
      // Supabase network / table setup fallback
    }

    // 2. If Supabase auth was not used, fallback to repository profile
    if (!profile) {
      profile = await repository.getProfileByEmail(cleanEmail);
      if (!profile) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please verify your credentials.' },
          { status: 401 }
        );
      }
    }

    if (!profile.active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Set auth session cookies
    const response = NextResponse.json({
      user: profile,
      message: 'Logged in successfully.',
    });

    response.cookies.set('jbb_user_id', profile.id, {
      path: '/',
      httpOnly: false,
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
