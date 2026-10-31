import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    // Guard against missing or placeholder Supabase configuration
    const isSupabaseConfigured =
      Boolean(supabaseUrl) &&
      Boolean(anonKey) &&
      !supabaseUrl.includes('your-new-project-ref') &&
      anonKey !== 'your-supabase-anon-key' &&
      anonKey !== 'placeholder-anon-key';

    let profile = null;

    if (isSupabaseConfigured) {
      // Create server-side Supabase client for auth
      const authClient = createSupabaseClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      let { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password),
      });

      // If email is unconfirmed and service role key exists, auto-confirm it in Supabase Auth
      if (
        authError &&
        authError.message?.toLowerCase().includes('confirm') &&
        serviceRoleKey
      ) {
        try {
          const adminAuth = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userList } = await adminAuth.auth.admin.listUsers();
          const target = userList?.users?.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (target) {
            await adminAuth.auth.admin.updateUserById(target.id, {
              email_confirm: true,
            });
            // Retry sign in now that email is confirmed
            const retry = await authClient.auth.signInWithPassword({
              email: cleanEmail,
              password: String(password),
            });
            if (!retry.error && retry.data?.user) {
              authData = retry.data;
              authError = null;
            }
          }
        } catch (confirmErr) {
          console.warn('Auto-confirm attempt failed:', confirmErr);
        }
      }

      // If authentication still failed, give the user the exact actionable error
      if (authError || !authData?.user) {
        const errMsg = authError?.message || 'Authentication failed.';

        if (errMsg.toLowerCase().includes('confirm')) {
          return NextResponse.json(
            {
              error:
                'Email is not confirmed. In Supabase Dashboard, go to Authentication > Providers > Email and disable "Confirm email", or edit the user to confirm them.',
            },
            { status: 401 }
          );
        }

        if (errMsg.toLowerCase().includes('invalid login credentials')) {
          return NextResponse.json(
            {
              error:
                'Invalid email or password. Please verify the credentials entered in Supabase Auth.',
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: `Supabase login failed: ${errMsg}` },
          { status: 401 }
        );
      }

      // User authenticated successfully! Now resolve profile details
      const authedUser = authData.user;
      const userMeta = authedUser.user_metadata || {};

      // 1. Check if profile exists directly in Supabase DB profiles table
      let dbProfile: any = null;
      try {
        const queryClient = serviceRoleKey
          ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
              auth: { persistSession: false, autoRefreshToken: false },
            })
          : authClient;

        const { data: supabaseRow } = await queryClient
          .from('profiles')
          .select('*')
          .eq('id', authedUser.id)
          .maybeSingle();

        if (supabaseRow) {
          dbProfile = supabaseRow;
        }
      } catch (e) {
        // Profiles table may not yet be created
      }

      // 2. Resolve display name and role
      const emailPrefix = cleanEmail.split('@')[0];
      const displayName =
        dbProfile?.full_name ||
        userMeta.full_name ||
        userMeta.name ||
        (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));

      const rawRole =
        dbProfile?.role ||
        userMeta.role ||
        (cleanEmail.startsWith('admin') ? 'admin' : 'salesperson');

      const role = rawRole === 'admin' ? 'admin' : 'salesperson';

      // 3. Upsert into public.profiles table if using Supabase DB
      try {
        const queryClient = serviceRoleKey
          ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
              auth: { persistSession: false, autoRefreshToken: false },
            })
          : authClient;

        await queryClient.from('profiles').upsert(
          {
            id: authedUser.id,
            email: cleanEmail,
            full_name: displayName,
            role,
            active: dbProfile?.active !== undefined ? dbProfile.active : true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (upsertErr) {
        console.warn('Could not upsert profile row to Supabase:', upsertErr);
      }

      // 4. Sync into application repository
      profile = await repository.createOrUpdateProfile({
        id: authedUser.id,
        email: cleanEmail,
        full_name: displayName,
        role: role as any,
        active: dbProfile?.active !== undefined ? dbProfile.active : true,
      });
    } else {
      // Supabase is not configured on this host
      profile = await repository.getProfileByEmail(cleanEmail);
      if (!profile) {
        return NextResponse.json(
          {
            error:
              'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or set to placeholders in Vercel. Please add them in Vercel Dashboard > Project Settings > Environment Variables, then redeploy.',
          },
          { status: 500 }
        );
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile could not be loaded. Please try again.' },
        { status: 401 }
      );
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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('jbb_user_role', profile.role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login route error:', error);
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 500 });
  }
}
