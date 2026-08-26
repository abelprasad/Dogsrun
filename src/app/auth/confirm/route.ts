import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error && user) {
      const url = new URL(request.url)
      url.searchParams.delete('token_hash')
      url.searchParams.delete('type')

      if (type === 'recovery') {
        url.pathname = '/auth/update-password'
        url.searchParams.set('recovery', '1')
        return NextResponse.redirect(url)
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('type')
        .eq('email', user.email)
        .maybeSingle()

      if (org?.type === 'rescue') {
        url.pathname = '/dashboard/rescue'
      } else {
        url.pathname = '/dashboard'
      }
      
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
