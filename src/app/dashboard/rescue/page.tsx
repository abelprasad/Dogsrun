import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge, { DogStatus } from '@/components/status-badge'
import ApprovalWall from '@/components/approval-wall'
import AlertActions from './alert-actions'
import SignOutButton from '../sign-out-button'

interface Alert {
  id: string
  dog_id: string
  rescue_id: string
  status: string
  sent_at: string
  dogs: {
    id: string
    name: string
    breed: string
    age_years: number | null
    sex: string | null
    photo_url: string | null
    status: string | null
    euthanasia_date: string | null
    organizations: { name: string | null; city: string | null; state: string | null } | null
  } | null
}

export default async function RescuePortalPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'rescue') redirect('/dashboard')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: adminRow } = await serviceClient
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  const isAdmin = !!adminRow

  const { data: alertsData } = await supabase
    .from('alerts')
    .select('*, dogs(*, organizations(name, city, state))')
    .eq('rescue_id', org.id)
    .order('sent_at', { ascending: false, nullsFirst: false })

  const alerts = (alertsData || []) as unknown as Alert[]

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="bg-[#13241d] py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Matching Criteria</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Admin</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">Rescue Portal</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">{org.name}</h1>
          <p className="text-[#f5f0e8]/50 mt-2 text-sm">New dog matches based on your organization&apos;s criteria.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const dog = alert.dogs
              const shelter = dog?.organizations
              const shelterLocation = [shelter?.city, shelter?.state].filter(Boolean).join(', ')

              return (
                <div key={alert.id} className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 overflow-hidden">
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-[#13241d] flex items-center justify-center text-2xl font-black text-[#f4b942] flex-shrink-0 overflow-hidden relative">
                          {dog?.photo_url ? (
                            <Image src={dog.photo_url} alt={dog.name || 'Dog photo'} fill className="object-cover" unoptimized />
                          ) : (
                            dog?.name?.[0] || 'D'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-black text-[#13241d]">{dog?.name || 'Unnamed Dog'}</h2>
                            <StatusBadge status={(dog?.status as DogStatus) || 'available'} euthanasiaDate={dog?.euthanasia_date} />
                          </div>
                          <p className="text-sm text-[#5d6a64] mb-2">
                            {dog?.breed || 'Unknown breed'}{dog?.age_years ? ` · ${dog.age_years}y` : ''}{dog?.sex ? ` · ${dog.sex}` : ''}
                          </p>
                          {(shelter?.name || shelterLocation) && (
                            <p className="text-[10px] font-bold text-[#5d6a64] uppercase tracking-[0.24em]">
                              Listed by{shelter?.name ? <span className="text-[#13241d]"> {shelter.name}</span> : null}{shelterLocation ? ` · ${shelterLocation}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <AlertActions alertId={alert.id} currentStatus={alert.status} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#f5f0e8] px-8 py-3 border-t border-[#13241d]/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5d6a64] uppercase tracking-[0.24em]">
                      Received {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : 'Unknown date'}
                    </span>
                    <Link href={`/dogs/${alert.dog_id}`} className="text-xs font-bold text-[#13241d] hover:text-[#f4b942] transition-colors uppercase tracking-[0.24em]">View Profile</Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-20 bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 text-center">
              <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64] mb-4">No Alerts Yet</p>
              <h3 className="text-2xl font-black text-[#13241d] mb-3">No dog matches yet</h3>
              <p className="text-[#5d6a64] max-w-sm mx-auto mb-8 text-sm">Make sure your matching criteria are set up to start receiving dog matches.</p>
              <Link href="/dashboard/criteria" className="inline-block bg-[#13241d] text-[#f4b942] text-xs uppercase tracking-[0.24em] font-bold px-8 py-3 hover:bg-[#1a2e1a] transition-colors">
                Manage Criteria
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
