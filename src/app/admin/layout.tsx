import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import SignOutButton from '@/app/dashboard/sign-out-button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!admin) redirect('/dashboard')

  // Check if this admin is also an org (dual-role: Abel, Steven)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: org } = await serviceClient
    .from('organizations')
    .select('name, type')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div>
      <div className="bg-[#13241d] py-2 px-8 sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <span className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Admin Panel</span>
            </Link>
            {org && (
              <Link
                href="/dashboard"
                className="text-xs font-bold text-[#f5f0e8]/30 hover:text-[#f5f0e8]/70 uppercase tracking-[0.24em] transition-colors"
              >
                My Org ({org.name}) →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
