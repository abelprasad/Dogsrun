import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import StatusBadge, { DogStatus } from '@/components/status-badge'
import SignOutButton from '../sign-out-button'
import DogRowActions from './dog-row-actions'

const PAGE_SIZE = 10

export default async function MyDogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

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

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  const { data: dogs, count } = await supabase
    .from('dogs')
    .select('*', { count: 'exact' })
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-white">
      {/* Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Add Dog</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-[900] tracking-tight text-[#111] mb-1">My Dogs</h1>
            <p className="text-[#6b7280] text-sm">{count || 0} dog{count !== 1 ? 's' : ''} listed</p>
          </div>
          <Link
            href="/dashboard/dogs/new"
            className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors text-sm"
          >
            + Add a dog
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        {dogs && dogs.length > 0 ? (
          <div className="space-y-3">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className="bg-white border border-gray-100 rounded-xl flex items-center gap-5 px-5 py-4 shadow-sm hover:border-gray-200 transition-colors"
              >
                {/* Photo */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-[900] text-[#f59e0b]">
                      {dog.name?.[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-[900] text-[#111] text-base">{dog.name}</h2>
                    <StatusBadge status={(dog.status as DogStatus) || 'available'} euthanasiaDate={dog.euthanasia_date} />
                    {dog.parvo || dog.tripod || dog.blind || dog.other_issues ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Special Needs</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[#6b7280]">
                    {dog.breed || 'Unknown breed'}
                    {dog.mix ? ' mix' : ''}
                    {dog.age_years ? ` · ${dog.age_years}y` : ''}
                    {dog.sex ? ` · ${dog.sex}` : ''}
                    {dog.weight_lbs ? ` · ${dog.weight_lbs} lbs` : ''}
                  </p>
                </div>

                {/* Actions — client component */}
                <DogRowActions dogId={dog.id} currentStatus={dog.status || 'available'} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 bg-[#fffbeb] rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-[#6b7280] mb-4 text-sm">No dogs listed yet.</p>
            <Link href="/dashboard/dogs/new" className="text-[#f59e0b] font-bold hover:underline text-sm">
              Add your first dog →
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-[#9ca3af] font-semibold">
              Page {page} of {totalPages} · {count} dogs
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/dogs?page=${page - 1}`}
                  className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-[#374151] hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/dashboard/dogs?page=${p}`}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    p === page
                      ? 'bg-[#f59e0b] text-[#451a03]'
                      : 'border border-gray-200 text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/dashboard/dogs?page=${page + 1}`}
                  className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-[#374151] hover:bg-gray-50 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
