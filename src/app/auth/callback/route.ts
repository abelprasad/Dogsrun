import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard/welcome'
  // Block open redirect — only allow relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard/welcome'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('Auth code exchange failed:', exchangeError.message)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (next === '/dashboard/welcome') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: admin }, { data: org }] = await Promise.all([
          supabase
            .from('admins')
            .select('id')
            .eq('email', user.email)
            .maybeSingle(),
          supabase
            .from('organizations')
            .select('id')
            .eq('id', user.id)
            .maybeSingle(),
        ])

        if (admin && !org) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
