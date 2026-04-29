import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import StatusBadge, { DogStatus } from '@/components/status-badge'
import SignOutButton from '../../sign-out-button'
import EuthanasiaCountdown from '@/components/euthanasia-countdown'

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
  euthanasia_date: string | null;
}

export default async function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: dogData } = await supabaseAdmin
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()

  if (!dogData) notFound()

  const dog = dogData as unknown as Dog

  const { data: userOrg } = await supabaseAdmin
    .from('organizations')
    .select('id, type')
    .eq('id', user.id)
    .maybeSingle()

  const backLink = userOrg?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard/dogs'
  const hasSpecialNeeds = dog.parvo || dog.tripod || dog.blind || dog.other_issues

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href={backLink} className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">
              {userOrg?.type === 'rescue' ? 'Alerts' : 'My Dogs'}
            </Link>
            <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">{dog.name}</span>
          </div>
          <SignOutButton />
        </div>
      </div>

      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">{dog.name}</h1>
            <p className="text-[#6b7280] font-bold">{dog.breed}{dog.mix ? ' mix' : ''}</p>
          </div>
          <StatusBadge status={(dog.status as DogStatus) || 'available'} euthanasiaDate={dog.euthanasia_date} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-square md:aspect-auto bg-[#fffbeb] border-r border-gray-100 flex items-center justify-center relative overflow-hidden">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="text-8xl font-[900] text-[#f59e0b]">{dog.name?.[0] || 'D'}</div>
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
                    <p className="text-sm text-[#6b7280] leading-relaxed italic">
                      &quot;{dog.description || 'No additional notes provided.'}&quot;
                    </p>
                    {hasSpecialNeeds && (
                      <div className="pt-6 border-t border-gray-50 mt-6">
                        <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Special Needs</h3>
                        <div className="flex flex-wrap gap-2">
                          {dog.parvo && <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded border border-red-100">Parvo</span>}
                          {dog.tripod && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded border border-blue-100">Tripod / Amputee</span>}
                          {dog.blind && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded border border-purple-100">Blind / Vision Impaired</span>}
                          {dog.other_issues && <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded border border-gray-200">Other Issues</span>}
                        </div>
                        {dog.other_issues && dog.other_issues_notes && (
                          <p className="text-xs text-[#6b7280] mt-3 leading-relaxed italic">Note: {dog.other_issues_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {dog.euthanasia_date && (
              <EuthanasiaCountdown euthanasiaDate={dog.euthanasia_date} />
            )}
            <div className="bg-[#fffbeb] p-6 rounded-xl border border-gray-100">
              <h3 className="text-[10px] font-bold text-[#451a03] uppercase tracking-widest mb-4">Location</h3>
              <p className="font-bold text-[#111] mb-1">{dog.organizations?.name}</p>
              <p className="text-sm text-[#6b7280]">{dog.organizations?.city}, {dog.organizations?.state}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
