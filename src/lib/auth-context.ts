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

  const [{ data: org, error: orgError }, { data: admin, error: adminError }] = await Promise.all([
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

  // A failed lookup must not look like "no org" (which redirects real orgs to /register).
  if (orgError || adminError) {
    throw new Error(`Auth context lookup failed: ${(orgError ?? adminError)?.message}`)
  }

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

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false }

  const { data: admin, error } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (error) throw new Error(`Admin lookup failed: ${error.message}`)

  return { user, isAdmin: Boolean(admin) }
}
