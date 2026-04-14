import { createClient } from '@/lib/supabase'
import Link from 'next/link'
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
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
          <div className="flex items-center gap-6">
            <Link href="/dogs" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
              ← Back to dogs
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Photo Section */}
            <div className="aspect-square md:aspect-auto bg-amber-50 flex items-center justify-center overflow-hidden">
              {dog.photo_url ? (
                <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-9xl font-black text-[#f59e0b]">
                  {dog.name?.[0] || 'D'}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-10 md:p-12 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-5xl font-black text-gray-900 mb-2">{dog.name}</h1>
                  <StatusBadge status={dog.status} />
                </div>
              </div>

              <div className="space-y-4 pb-8 border-b border-gray-100">
                <p className="text-2xl font-bold text-gray-500">{dog.breed}{dog.mix ? ' mix' : ''}</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Age</p>
                    <p className="text-xl font-bold text-gray-900">{dog.age_years ? `${dog.age_years} years` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sex</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{dog.sex || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-xl font-bold text-gray-900">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Color</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{dog.color || '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Description & Notes</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-100 italic">
                  "{dog.description || 'No additional notes provided for this dog.'}"
                </p>
              </div>

              <div className="pt-6">
                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8">
                  <h3 className="text-xs font-bold text-[#b45309] uppercase tracking-widest mb-2">Location</h3>
                  <p className="text-lg font-bold text-gray-900">{dog.organizations?.name}</p>
                  <p className="text-gray-600">{dog.organizations?.city}, {dog.organizations?.state}</p>
                </div>

                <Link 
                  href="/register?type=rescue"
                  className="block w-full text-center bg-[#f59e0b] text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-amber-200 hover:bg-[#d97706] transform transition active:scale-[0.98]"
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
