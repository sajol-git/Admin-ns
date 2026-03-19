import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: 'none',
              secure: true,
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null;
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user;
  } catch (error) {
    console.error('Supabase auth error:', error);
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check role for /admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .limit(1);
      profile = data?.[0] || null;
    } catch (error) {
      console.error('Supabase profile error:', error);
    }

    const adminEmails = ['sajol.professional@gmail.com', 'sadikulislamsajol@gmail.com'];
    if (profile?.role !== 'admin' && !adminEmails.includes(user.email || '')) {
      // Not an admin, redirect to unauthorized or login
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
