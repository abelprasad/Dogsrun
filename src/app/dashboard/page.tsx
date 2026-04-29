import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge from '@/components/status-badge'
import SignOutButton from './sign-out-button'
import ApprovalWall from '@/components/approval-wall'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org) redirect('/register')
  if (org.type === 'rescue') redirect('/dashboard/rescue')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  const isAdmin = !!admin

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch counts efficiently
  const [{ count: total }, { count: available }, { count: urgent }, { count: placed }] = await Promise.all([
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['available', null as unknown as string]),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).eq('status', 'urgent'),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['placed', 'adopted']),
  ])

  const { data: recentDogs } = await serviceClient
    .from('dogs')
    .select('*, alerts(status)')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Add Dog</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f59e0b]/60 hover:text-[#f59e0b] uppercase tracking-widest transition-colors">Admin</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">{org.name}</h1>
          <p className="text-[#6b7280]">Manage your dogs and track rescue interest.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#fffbeb] rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Total Dogs</p>
            <p className="text-3xl font-[900] text-[#111]">{total ?? 0}</p>
          </div>
          <div className="bg-[#fffbeb] rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Available</p>
            <p className="text-3xl font-[900] text-[#111]">{available ?? 0}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Urgent</p>
            <p className="text-3xl font-[900] text-red-600">{urgent ?? 0}</p>
          </div>
          <div className="bg-[#dcfce7] rounded-xl border border-green-100 p-5">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Placed / Adopted</p>
            <p className="text-3xl font-[900] text-green-700">{placed ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-[900] text-[#111] uppercase tracking-widest">Recent Dogs</h2>
          <Link href="/dashboard/dogs" className="text-sm font-bold text-[#f59e0b] hover:underline">Manage all dogs →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentDogs && recentDogs.length > 0 ? (
            recentDogs.map((dog) => (
              <div key={dog.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="w-full h-32 bg-gray-100 overflow-hidden relative">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-[900] text-[#f59e0b]">
                      {dog.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-base font-[900] text-[#111]">{dog.name}</h2>
                    <StatusBadge status={dog.status || 'available'} euthanasiaDate={dog.euthanasia_date} />
                  </div>
                  <p className="text-xs text-[#6b7280] mb-2">{dog.breed || 'Unknown breed'}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
                  {(() => {
                    const interested = (dog.alerts || []).filter((a: {status: string}) => a.status === 'responded').length
                    return interested > 0 ? (
                      <p className="text-xs font-bold text-green-600">{interested} rescue{interested !== 1 ? 's' : ''} interested</p>
                    ) : null
                  })()}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-[#fffbeb] rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-[#6b7280] mb-4">No dogs listed yet.</p>
              <Link href="/dashboard/dogs/new" className="text-[#f59e0b] font-bold hover:underline">Add your first dog</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
