import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge, { DogStatus } from '@/components/status-badge'
import SignOutButton from '../sign-out-button'
import DogRowActions from './dog-row-actions'

const PAGE_SIZE = 10

export default async function MyDogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

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

  const { data: dogs, count } = await supabase
    .from('dogs')
    .select('*, alerts(status)', { count: 'exact' })
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Subnav */}
      <div className="bg-[#13241d] py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Add Dog</Link>
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

      {/* Header */}
      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">Shelter</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">My Dogs</h1>
            <p className="text-[#f5f0e8]/50 mt-2 text-sm">{count || 0} dog{count !== 1 ? 's' : ''} listed</p>
          </div>
          <Link href="/dashboard/dogs/new" className="inline-block bg-[#f4b942] text-[#13241d] font-black text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-[#f4b942]/90 transition-colors">
            + Add a Dog
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        {dogs && dogs.length > 0 ? (
          <div className="space-y-3">
            {dogs.map((dog) => (
              <div key={dog.id} className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 flex items-center gap-5 px-5 py-4">
                <div className="w-16 h-16 overflow-hidden bg-[#13241d] flex-shrink-0 relative">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#f4b942]">
                      {dog.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-black text-[#13241d] text-base">{dog.name}</h2>
                    <StatusBadge status={(dog.status as DogStatus) || 'available'} euthanasiaDate={dog.euthanasia_date} />
                    {(dog.parvo || dog.tripod || dog.blind || dog.other_issues) && (
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d95f4b] bg-red-50 px-2 py-0.5">Special Needs</span>
                    )}
                  </div>
                  <p className="text-sm text-[#5d6a64]">
                    {dog.breed || 'Unknown breed'}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}{dog.sex ? ` · ${dog.sex}` : ''}{dog.weight_lbs ? ` · ${dog.weight_lbs} lbs` : ''}
                  </p>
                  {(() => {
                    const interested = (dog.alerts || []).filter((a: {status: string}) => a.status === 'responded').length
                    return interested > 0 ? (
                      <p className="text-xs font-bold text-green-700 mt-0.5">{interested} rescue{interested !== 1 ? 's' : ''} interested</p>
                    ) : null
                  })()}
                </div>
                <DogRowActions dogId={dog.id} currentStatus={dog.status || 'available'} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 text-center">
            <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64] mb-4">No Dogs Yet</p>
            <Link href="/dashboard/dogs/new" className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] hover:text-[#f4b942] transition-colors">Add your first dog →</Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#13241d]/10">
            <p className="text-xs text-[#5d6a64] font-semibold uppercase tracking-[0.24em]">Page {page} of {totalPages} · {count} dogs</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/dashboard/dogs?page=${page - 1}`} className="px-4 py-2 text-xs font-bold border border-[#13241d]/20 text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942] transition-colors uppercase tracking-[0.24em]">← Prev</Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/dashboard/dogs?page=${p}`} className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] transition-colors ${p === page ? 'bg-[#13241d] text-[#f4b942]' : 'border border-[#13241d]/20 text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942]'}`}>
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={`/dashboard/dogs?page=${page + 1}`} className="px-4 py-2 text-xs font-bold border border-[#13241d]/20 text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942] transition-colors uppercase tracking-[0.24em]">Next →</Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
