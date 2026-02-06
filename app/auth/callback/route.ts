import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/menu';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
    }

    // Create profile if it doesn't exist (for OAuth users)
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // Create profile for OAuth user
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          role: 'customer',
          is_active: true
        });
      }
    }

    // Redirect to menu after successful auth
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
