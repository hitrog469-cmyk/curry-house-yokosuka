import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip auth checks if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || !supabaseKey.startsWith('eyJ') || supabaseKey.length < 100) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const protectedRoutes: { [key: string]: string[] } = {
    '/admin': ['admin'],
    '/staff': ['staff', 'admin'],
    '/profile': ['customer', 'staff', 'admin'],
    '/my-orders': ['customer', 'staff', 'admin'],
  };

  const currentPath = request.nextUrl.pathname;

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (currentPath.startsWith(route)) {
      if (!session) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirectTo', currentPath);
        return NextResponse.redirect(redirectUrl);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const userRole = profile?.role || 'customer';

      if (!allowedRoles.includes(userRole)) {
        const roleRedirects: { [key: string]: string } = {
          admin: '/admin/dashboard',
          staff: '/staff/orders',
          customer: '/menu',
        };
        return NextResponse.redirect(new URL(roleRedirects[userRole] || '/', request.url));
      }
    }
  }

  const authPages = ['/auth/login', '/auth/register'];
  if (session && authPages.some((page) => currentPath.startsWith(page))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || 'customer';
    const roleRedirects: { [key: string]: string } = {
      admin: '/admin/dashboard',
      staff: '/staff/orders',
      customer: '/menu',
    };

    return NextResponse.redirect(new URL(roleRedirects[userRole], request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};