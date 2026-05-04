import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '../../../sign-out-button'
import EditDogForm from './edit-form'
import EuthanasiaCountdown from '@/components/euthanasia-countdown'
import StatusBadge from '@/components/status-badge'

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
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
    <div className="min-h-screen bg-[#f8f1e8]">
      <div className="bg-[#13241d] border-t border-[#f4b942]/20 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#d8cfc2] hover:text-[#f8f1e8] uppercase tracking-widest transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#d8cfc2] hover:text-[#f8f1e8] uppercase tracking-widest transition-colors">My Dogs</Link>
            <span className="text-xs font-bold text-[#f4b942] uppercase tracking-widest">{dog.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#d8cfc2] uppercase tracking-widest">{userOrg.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#13241d] border-b border-[#f4b942]/30 py-8 px-8 text-[#f8f1e8]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-[900] tracking-tight mb-1">{dog.name}</h1>
            <p className="text-[#d8cfc2] text-sm">{dog.breed}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}{dog.sex ? ` · ${dog.sex}` : ''}</p>
          </div>
          <StatusBadge status={dog.status || 'available'} euthanasiaDate={dog.euthanasia_date} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EditDogForm dog={dog} />
          </div>
          <div className="space-y-6">
            {dog.euthanasia_date && <EuthanasiaCountdown euthanasiaDate={dog.euthanasia_date} />}
            <div className="bg-[#fffaf2] rounded-lg border border-[#13241d]/15 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#13241d]/10 flex items-center justify-between">
                <h3 className="text-sm font-[900] text-[#13241d] uppercase tracking-widest">Rescue Alerts</h3>
                <span className="text-[10px] font-bold bg-[#13241d] text-[#f4b942] px-2 py-1 border border-[#13241d]/10">
                  {alerts?.length || 0} sent
                </span>
              </div>
              <div className="divide-y divide-[#13241d]/10">
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert: { id: string; status: string; sent_at: string | null; organizations: { name: string; city: string; state: string } | null }) => (
                    <div key={alert.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[#13241d] text-sm">{alert.organizations?.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          alert.status === 'responded' ? 'bg-green-100 text-green-700' :
                          alert.status === 'declined' ? 'bg-[#efe7dc] text-[#5d6a64]' :
                          'bg-[#13241d] text-[#f4b942]'
                        }`}>
                          {alert.status === 'responded' ? 'Interested' : alert.status === 'declined' ? 'Passed' : 'Sent'}
                        </span>
                      </div>
                      <p className="text-xs text-[#5d6a64]">
                        {alert.organizations?.city}, {alert.organizations?.state} · {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-[#5d6a64] italic">No alerts sent yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
