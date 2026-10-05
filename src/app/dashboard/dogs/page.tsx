import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import StatusBadge from '@/components/status-badge'
import DogRowActions from './dog-row-actions'
import PageHeader from '@/components/ui/page-header'
import Button from '@/components/ui/button'
import Pagination from '@/components/ui/pagination'

const PAGE_SIZE = 10

export default async function MyDogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { supabase, org } = await requireAuthContext()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  const { data: dogs, count } = await supabase
    .from('dogs')
    .select('*, alerts(status)', { count: 'exact' })
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <PageHeader
        eyebrow="Shelter"
        title="My Dogs"
        sub={<>{count || 0} dog{count !== 1 ? 's' : ''} listed</>}
        innerClassName="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4"
        actions={<Button href="/dashboard/dogs/new">+ Add a Dog</Button>}
      />

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
                    <StatusBadge status={dog.status || 'available'} euthanasiaDate={dog.euthanasia_date} />
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

        <Pagination
          page={page}
          totalPages={totalPages}
          getHref={(p) => `/dashboard/dogs?page=${p}`}
          summary={<>Page {page} of {totalPages} · {count} dogs</>}
          className="flex items-center justify-between mt-8 pt-6 border-t border-[#13241d]/10"
        />
      </main>
    </div>
  )
}
