import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge from '@/components/status-badge'

const PAGE_SIZE = 12

export default async function PublicDogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createSupabaseServerClient()

  const { data: dogs, count } = await supabase
    .from('dogs')
    .select('*, organizations(name, city, state)', { count: 'exact' })
    .in('status', ['available', 'urgent'])
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#d95f4b]" />
            Public rescue board
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl lg:text-7xl">
            Dogs ready for a rescue commitment.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#c8d3ce]">
            A live view of available and urgent dogs in the DOGSRUN network. Open a profile to review the details shelters need rescues to see first.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        {dogs && dogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dogs.map((dog) => (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.id}`}
                  className="group flex min-h-full flex-col overflow-hidden bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 transition hover:-translate-y-1 hover:outline-[#d95f4b]"
                >
                  <div className="relative aspect-[5/4] overflow-hidden bg-[#dce8dd]">
                    {dog.photo_url ? (
                      <Image
                        src={dog.photo_url}
                        alt={dog.name}
                        fill
                        className="object-cover saturate-[0.92] transition duration-700 group-hover:scale-105"
                        unoptimized
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#dce8dd] text-7xl font-black text-[#436154]">
                        {dog.name?.[0] || 'D'}
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <StatusBadge status={dog.status} euthanasiaDate={dog.euthanasia_date} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#13241d]/75 to-transparent p-4 pt-16">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f8f1e8]/80">
                        {dog.organizations?.city}{dog.organizations?.state ? `, ${dog.organizations.state}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-[#13241d]">{dog.name}</h2>
                        <p className="mt-1 text-sm font-semibold text-[#617069]">
                          {dog.breed}{dog.mix ? ' mix' : ''}
                        </p>
                      </div>
                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#13241d] text-xs font-black text-[#f8f1e8]">
                        {dog.organizations?.name?.[0] || 'S'}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-px bg-[#13241d]/10">
                      {[
                        { label: 'Age', value: dog.age_years ? `${dog.age_years}y` : '-' },
                        { label: 'Weight', value: dog.weight_lbs ? `${dog.weight_lbs} lb` : '-' },
                        { label: 'Sex', value: dog.sex || '-' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#f5f0e8] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">{label}</p>
                          <p className="mt-1 text-sm font-black capitalize text-[#13241d]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#13241d]/10 pt-4">
                      <p className="min-w-0 text-xs leading-5 text-[#617069]">
                        From <span className="font-black text-[#13241d]">{dog.organizations?.name || 'Shelter partner'}</span>
                      </p>
                      <span className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-[#d95f4b]">
                        Review
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between border-t border-[#13241d]/10 pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a877f]">
                  Page {page} of {totalPages} · {count} dogs
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/dogs?page=${page - 1}`}
                      className="border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]"
                    >
                      ← Prev
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/dogs?page=${p}`}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                        p === page
                          ? 'bg-[#f4b942] text-[#13241d]'
                          : 'border border-[#13241d]/20 bg-[#fff9ef] text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942]'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link
                      href={`/dogs?page=${page + 1}`}
                      className="border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#436154]">No open cases</p>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#617069]">
              There are no dogs currently available for rescue. New shelter cases will appear here as soon as they are published.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
