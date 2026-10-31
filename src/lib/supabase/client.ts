import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  // Guard against missing environment variables
  if (!url || !anonKey || url.includes('your-new-project-ref')) {
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(url, anonKey);
}
