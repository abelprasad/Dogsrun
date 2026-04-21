import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import StatusBadge, { DogStatus } from '@/components/status-badge'
import StatusUpdater from './status-updater'
import ManagementActions from './management-actions'
import SignOutButton from '../../sign-out-button'

interface Organization {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
}

interface Dog {
  id: string;
  name: string;
  breed: string;
  mix: boolean;
  age_years: number;
  weight_lbs: number;
  sex: string;
  color: string;
  description: string;
  photo_url: string;
  status: string;
  shelter_id: string;
  organizations?: Organization;
  parvo: boolean;
  tripod: boolean;
  blind: boolean;
  other_issues: boolean;
  other_issues_notes: string;
}

interface Alert {
  id: string;
  dog_id: string;
  rescue_id: string;
  status: string;
  sent_at: string;
  organizations?: Organization;
}

export default async function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: userOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  const { data: dogData } = await supabase
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()

  if (!dogData) {
    notFound()
  }

  const dog = dogData as unknown as Dog;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: alertsData } = await supabaseAdmin
    .from('alerts')
    .select('*, organizations(name, email, city, state)')
    .eq('dog_id', id)
    .order('sent_at', { ascending: false })

  const alerts = (alertsData || []) as unknown as Alert[];

  const isShelter = userOrg?.type === 'shelter'
  const isDogShelter = isShelter && userOrg?.id === dog.shelter_id
  const backLink = userOrg?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard'

  const hasSpecialNeeds = dog.parvo || dog.tripod || dog.blind || dog.other_issues

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href={backLink} className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dashboard</Link>
            <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Dog Profile</span>
          </div>
          <SignOutButton />
        </div>
      </div>

      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
              {dog.name}
            </h1>
            <p className="text-[#6b7280] font-bold">{dog.breed}{dog.mix ? ' mix' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={(dog.status as DogStatus) || 'available'} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-none">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-square md:aspect-auto bg-[#fffbeb] border-r border-gray-100 flex items-center justify-center relative overflow-hidden">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="text-8xl font-[900] text-[#f59e0b]">
                      {dog.name?.[0] || 'D'}
                    </div>
                  )}
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Age</p>
                      <p className="text-lg font-bold text-[#111]">{dog.age_years ? `${dog.age_years}y` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Sex</p>
                      <p className="text-lg font-bold text-[#111] capitalize">{dog.sex || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Weight</p>
                      <p className="text-lg font-bold text-[#111]">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Color</p>
                      <p className="text-lg font-bold text-[#111] capitalize">{dog.color || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Description / Notes</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed italic mb-6">
                      &quot;{dog.description || "No additional notes provided for this dog."}&quot;
                    </p>

                    {hasSpecialNeeds && (
                      <div className="pt-6 border-t border-gray-50">
                        <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Special Needs</h3>
                        <div className="flex flex-wrap gap-2">
                          {dog.parvo && <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded border border-red-100">Parvo</span>}
                          {dog.tripod && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded border border-blue-100">Tripod / Amputee</span>}
                          {dog.blind && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded border border-purple-100">Blind / Vision Impaired</span>}
                          {dog.other_issues && <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded border border-gray-200">Other Issues</span>}
                        </div>
                        {dog.other_issues && dog.other_issues_notes && (
                          <p className="text-xs text-[#6b7280] mt-3 leading-relaxed italic">
                            Note: {dog.other_issues_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alert History */}
            {isDogShelter && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-none">
                <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-[900] text-[#111] uppercase tracking-widest">Rescue Alerts</h3>
                  <span className="text-[10px] font-bold bg-[#fffbeb] text-[#451a03] px-2 py-1 rounded border border-gray-100">{alerts?.length || 0} alerts sent</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-bold text-[#111] text-sm">{alert.organizations?.name}</p>
                          <p className="text-xs text-[#6b7280]">{alert.organizations?.email} • {alert.organizations?.city}, {alert.organizations?.state}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                            alert.status === 'sent' ? 'bg-[#fffbeb] text-[#451a03] border-gray-100' :
                            alert.status === 'responded' ? 'bg-[#dcfce7] text-[#166534] border-[#166534]/10' :
                            alert.status === 'declined' ? 'bg-[#f3f4f6] text-[#6b7280] border-gray-100' :
                            'bg-gray-50 text-[#111] border-gray-100'
                          }`}>
                            {alert.status}
                          </span>
                          <p className="text-[10px] text-[#9ca3af] mt-1 uppercase font-bold tracking-widest">{alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : 'Pending'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-8 py-10 text-center text-[#6b7280] text-sm italic">
                      No rescue alerts have been sent for this dog yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isDogShelter && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-none">
                <StatusUpdater dogId={dog.id} currentStatus={dog.status || 'available'} />
              </div>
            )}

            <div className="bg-[#fffbeb] p-6 rounded-xl border border-gray-100">
              <h3 className="text-[10px] font-bold text-[#451a03] uppercase tracking-widest mb-4">Location</h3>
              <p className="font-bold text-[#111] mb-1">{dog.organizations?.name}</p>
              <p className="text-sm text-[#6b7280] mb-4">{dog.organizations?.city}, {dog.organizations?.state}</p>
              <p className="text-[10px] text-[#9ca3af] leading-tight uppercase font-bold tracking-widest">
                {isDogShelter ? 'Your Listing' : 'Contact Shelter'}
              </p>
            </div>

            {isDogShelter && (
              <ManagementActions dogId={dog.id} currentStatus={dog.status || 'available'} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
