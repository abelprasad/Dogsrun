import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import StatusBadge from '@/components/status-badge'

export default async function PublicDogsPage() {
  const supabase = createClient()
  
  const { data: dogs } = await supabase
    .from('dogs')
    .select('*, organizations(name)')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar placeholder if needed, but layout might handle it or we use a custom one */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">About</Link>
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Dogs available for rescue</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            These dogs are waiting for a rescue organization to give them a second chance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {dogs?.map((dog) => (
            <Link 
              key={dog.id} 
              href={`/dogs/${dog.id}`}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="aspect-[4/3] bg-amber-50 relative overflow-hidden">
                {dog.photo_url ? (
                  <img 
                    src={dog.photo_url} 
                    alt={dog.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-[#f59e0b]">
                    {dog.name?.[0] || 'D'}
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <StatusBadge status={dog.status} />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-black text-gray-900">{dog.name}</h2>
                </div>
                <p className="text-gray-500 font-bold mb-4">{dog.breed}{dog.mix ? ' mix' : ''}</p>
                
                <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age</p>
                    <p className="text-sm font-bold text-gray-900">{dog.age_years ? `${dog.age_years}y` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight</p>
                    <p className="text-sm font-bold text-gray-900">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sex</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{dog.sex || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-[#f59e0b]">
                    {dog.organizations?.name?.[0]}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Listed by <span className="text-gray-900">{dog.organizations?.name}</span></p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!dogs || dogs.length === 0) && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No dogs currently available for rescue. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}
