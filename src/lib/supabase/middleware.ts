import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    return NextResponse.next({ request })
  }
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isResetPassword = request.nextUrl.pathname.startsWith('/auth/reset-password')
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isPublic = request.nextUrl.pathname === '/'

  // API routes enforce their own auth and return JSON errors — redirecting them to
  // an HTML page instead breaks client-side fetch() calls that expect JSON back.
  if (!isApiRoute) {
    if (!user && !isAuthPage && !isPublic) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Password recovery lands the user on /auth/reset-password with an active
    // (recovery) session — the usual "authenticated users skip auth pages" rule
    // would otherwise bounce them straight to /dashboard before they can reset it.
    if (user && isAuthPage && !isResetPassword) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
