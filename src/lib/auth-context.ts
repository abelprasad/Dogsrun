import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './supabase-server'

export interface AuthOrg {
  id: string
  name: string
  email: string | null
  type: 'shelter' | 'rescue'
  approval_status: string
}

export async function getAuthContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, org: null, isAdmin: false }
  }

  const [{ data: org }, { data: admin }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, email, type, approval_status')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle(),
  ])

  const normalizedOrg = org
    ? {
        ...org,
        approval_status: org.approval_status ?? 'pending',
      } as AuthOrg
    : null

  return {
    supabase,
    user,
    org: normalizedOrg,
    isAdmin: Boolean(admin),
  }
}

export async function requireAuthContext() {
  const context = await getAuthContext()
  if (!context.user) redirect('/auth/login')
  return context
}

export function dashboardPathFor(org: AuthOrg | null, isAdmin: boolean) {
  if (org?.type === 'rescue') return '/dashboard/rescue'
  if (org?.type === 'shelter') return '/dashboard'
  if (isAdmin) return '/admin'
  return '/register'
}
