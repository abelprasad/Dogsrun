import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '../../../sign-out-button'
import EditDogForm from './edit-form'
import EuthanasiaCountdown from '@/components/euthanasia-countdown'
import StatusBadge from '@/components/status-badge'

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: dog } = await supabaseAdmin
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single()

  if (!dog) notFound()
  if (!userOrg || userOrg.id !== dog.shelter_id) redirect('/dashboard')

  const { data: alerts } = await supabaseAdmin
    .from('alerts')
    .select('*, organizations(name, email, city, state)')
    .eq('dog_id', id)
    .order('sent_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      {/* Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">My Dogs</Link>
            <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">{dog.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{userOrg.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-8 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-[#111] mb-1">{dog.name}</h1>
            <p className="text-[#6b7280] text-sm">{dog.breed}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}{dog.sex ? ` · ${dog.sex}` : ''}</p>
          </div>
          <StatusBadge status={dog.status || 'available'} euthanasiaDate={dog.euthanasia_date} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — edit form */}
          <div className="lg:col-span-2">
            <EditDogForm dog={dog} />
          </div>

          {/* Right — status + alerts */}
          <div className="space-y-6">

            {/* Euthanasia countdown */}
            {dog.euthanasia_date && (
              <EuthanasiaCountdown euthanasiaDate={dog.euthanasia_date} />
            )}

            {/* Rescue alerts */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-[900] text-[#111] uppercase tracking-widest">Rescue Alerts</h3>
                <span className="text-[10px] font-bold bg-[#fffbeb] text-[#451a03] px-2 py-1 rounded border border-gray-100">
                  {alerts?.length || 0} sent
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert: any) => (
                    <div key={alert.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[#111] text-sm">{alert.organizations?.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          alert.status === 'responded' ? 'bg-green-100 text-green-700' :
                          alert.status === 'declined' ? 'bg-gray-100 text-gray-500' :
                          'bg-[#fffbeb] text-[#451a03]'
                        }`}>
                          {alert.status === 'responded' ? 'Interested' : alert.status === 'declined' ? 'Passed' : 'Sent'}
                        </span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        {alert.organizations?.city}, {alert.organizations?.state} · {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-[#9ca3af] italic">
                    No alerts sent yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
