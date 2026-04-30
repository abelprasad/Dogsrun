import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
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
    age_years: number
    sex: string
    photo_url: string
    status: string
    euthanasia_date: string | null
    organizations: { name: string; city: string; state: string }
  }
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

  const { data: alertsData } = await supabase
    .from('alerts')
    .select('*, dogs(*, organizations(name, city, state))')
    .eq('rescue_id', org.id)
    .order('sent_at', { ascending: false, nullsFirst: false })

  const alerts = (alertsData || []) as unknown as Alert[]

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <div className="bg-[#13241d] border-b border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#f4b942] uppercase tracking-widest">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Matching Criteria</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#13241d] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f4b942] sm:text-5xl">{org.name}</h1>
          <p className="mt-2 text-[#c8d3ce]">New dog matches based on your organization&apos;s criteria.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <div className="space-y-5">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const shelter = alert.dogs?.organizations
              const shelterLocation = [shelter?.city, shelter?.state].filter(Boolean).join(', ')
              return (
                <div key={alert.id} className="overflow-hidden bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 transition hover:outline-[#d95f4b]">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-5">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[#dce8dd]">
                          {alert.dogs?.photo_url ? (
                            <Image src={alert.dogs.photo_url} alt={alert.dogs.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#f4b942]">
                              {alert.dogs?.name?.[0] || 'D'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-3">
                            <h2 className="text-xl font-black text-[#13241d]">{alert.dogs?.name || 'Unnamed Dog'}</h2>
                            <StatusBadge status={(alert.dogs?.status as DogStatus) || 'available'} euthanasiaDate={alert.dogs?.euthanasia_date} />
                          </div>
                          <p className="text-sm text-[#5d6a64] mb-1">
                            {alert.dogs?.breed || 'Unknown breed'}{alert.dogs?.age_years ? ` · ${alert.dogs.age_years}y` : ''}{alert.dogs?.sex ? ` · ${alert.dogs.sex}` : ''}
                          </p>
                          {(shelter?.name || shelterLocation) && (
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">
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
                  <div className="flex items-center justify-between border-t border-[#13241d]/10 bg-[#f5f0e8] px-6 py-3 sm:px-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">
                      Received {new Date(alert.sent_at).toLocaleDateString()}
                    </span>
                    <Link href={`/dogs/${alert.dog_id}`} className="text-xs font-black uppercase tracking-[0.18em] text-[#d95f4b] hover:underline">
                      View Full Profile →
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
              <h3 className="mb-2 text-lg font-black text-[#13241d]">No alerts yet</h3>
              <p className="mx-auto mb-8 max-w-sm text-[#5d6a64] leading-7">
                Make sure your matching criteria are set up to start receiving dog matches.
              </p>
              <Link
                href="/dashboard/criteria"
                className="inline-flex items-center justify-center bg-[#f4b942] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]"
              >
                Manage Criteria
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
