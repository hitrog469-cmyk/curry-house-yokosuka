import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const currentPath = nextUrl.pathname
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as any)?.role || 'customer'

  // Skip middleware for admin login page and API routes
  if (currentPath === '/admin/login' || currentPath.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected routes and their allowed roles
  const protectedRoutes: { [key: string]: string[] } = {
    '/admin':     ['admin'],
    '/staff':     ['staff', 'admin'],
    '/reception': ['reception', 'admin'],
    '/kitchen':   ['kitchen', 'staff', 'admin'],
    '/profile':   ['customer', 'staff', 'admin', 'reception', 'kitchen'],
    '/my-orders': ['customer', 'staff', 'admin'],
  }

  // Where each role lands after login
  const roleRedirects: { [key: string]: string } = {
    admin:     '/admin',
    staff:     '/staff',
    reception: '/reception',
    kitchen:   '/kitchen',
    customer:  '/profile',
  }

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (currentPath.startsWith(route)) {
      if (!isLoggedIn) {
        const redirectUrl = new URL('/auth/login', nextUrl.origin)
        redirectUrl.searchParams.set('redirectTo', currentPath)
        return NextResponse.redirect(redirectUrl)
      }

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(
          new URL(roleRedirects[userRole] || '/', nextUrl.origin)
        )
      }
    }
  }

  // Redirect logged-in users away from auth pages
  const authPages = ['/auth/login', '/auth/register']
  if (isLoggedIn && authPages.some((page) => currentPath.startsWith(page))) {
    return NextResponse.redirect(
      new URL(roleRedirects[userRole] || '/', nextUrl.origin)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
