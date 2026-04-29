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

  if (!dog) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
              {dog.name}
            </h1>
            <p className="text-xl font-bold text-[#6b7280]">
              {dog.breed}{dog.mix ? ' mix' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={dog.status} euthanasiaDate={dog.euthanasia_date} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <Link href="/dogs" className="inline-block text-sm font-semibold text-[#9ca3af] hover:text-[#111] mb-8 transition-colors">
          ← Back to available dogs
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Photo Section */}
            <div className="aspect-square md:aspect-auto bg-[#fffbeb] flex items-center justify-center relative overflow-hidden border-r border-gray-100">
              {dog.photo_url ? (
                <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="text-9xl font-[900] text-[#f59e0b]">
                  {dog.name?.[0] || 'D'}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-8 md:p-12 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-[#111] mb-6">Dog Details</h2>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Age</p>
                    <p className="text-lg font-semibold text-[#111]">{dog.age_years ? `${dog.age_years} years` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Sex</p>
                    <p className="text-lg font-semibold text-[#111] capitalize">{dog.sex || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-lg font-semibold text-[#111]">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Color</p>
                    <p className="text-lg font-semibold text-[#111] capitalize">{dog.color || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Description</h3>
                <p className="text-[#6b7280] leading-relaxed italic">
                  &quot;{dog.description || "No additional notes provided for this dog."}&quot;
                </p>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <div className="bg-[#fffbeb] rounded-lg p-6 border border-gray-100 mb-8">
                  <h3 className="text-[10px] font-bold text-[#451a03] uppercase tracking-widest mb-2">Location</h3>
                  <p className="text-lg font-bold text-[#111]">{dog.organizations?.name}</p>
                  <p className="text-[#6b7280]">{dog.organizations?.city}, {dog.organizations?.state}</p>
                </div>

                <Link 
                  href="/register?type=rescue"
                  className="block w-full text-center bg-[#f59e0b] text-[#451a03] py-4 rounded-lg font-bold text-lg hover:bg-[#d97706] transition-colors"
                >
                  Interested in rescuing?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
