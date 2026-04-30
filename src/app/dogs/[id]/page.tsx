import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import StatusBadge from '@/components/status-badge'

export default async function PublicDogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  const { data: dog } = await supabase
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()

  if (!dog) notFound()

  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      {/* Hero */}
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
              <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
              Dog profile
            </div>
            <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl lg:text-7xl">
              {dog.name}
            </h1>
            <p className="mt-3 text-xl font-black text-[#c8d3ce]">
              {dog.breed}{dog.mix ? ' mix' : ''}
            </p>
          </div>
          <div>
            <StatusBadge status={dog.status} euthanasiaDate={dog.euthanasia_date} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <Link href="/dogs" className="mb-8 inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64] transition hover:text-[#13241d]">
          ← Back to available dogs
        </Link>

        <div className="grid grid-cols-1 overflow-hidden border border-[#13241d]/10 md:grid-cols-2">
          {/* Photo */}
          <div className="relative aspect-square bg-[#dce8dd] md:aspect-auto">
            {dog.photo_url ? (
              <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-9xl font-black text-[#f4b942]">
                {dog.name?.[0] || 'D'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-[#fff9ef] p-8 md:p-12 space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-black text-[#13241d]">Dog Details</h2>
              <div className="grid grid-cols-2 gap-px bg-[#13241d]/10">
                {[
                  ['Age', dog.age_years ? `${dog.age_years} years` : '—'],
                  ['Sex', dog.sex || '—'],
                  ['Weight', dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'],
                  ['Color', dog.color || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#fff9ef] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a877f]">{label}</p>
                    <p className="mt-1 text-base font-black capitalize text-[#13241d]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#13241d]/10 pt-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a877f]">Description</p>
              <p className="leading-7 text-[#5d6a64] italic">
                &quot;{dog.description || "No additional notes provided for this dog."}&quot;
              </p>
            </div>

            <div className="border-t border-[#13241d]/10 pt-8 space-y-4">
              <div className="border-l-4 border-[#f59e0b] bg-[#13241d] p-5 text-[#f8f1e8]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4b942] mb-1">Location</p>
                <p className="font-black text-[#f8f1e8]">{dog.organizations?.name}</p>
                <p className="text-sm text-[#c8d3ce]">{dog.organizations?.city}, {dog.organizations?.state}</p>
              </div>

              <Link
                href="/register?type=rescue"
                className="block w-full bg-[#f4b942] py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]"
              >
                Interested in rescuing?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
