import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge from '@/components/status-badge'

export default async function PublicDogsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: dogs } = await supabase
    .from('dogs')
    .select('*, organizations(name, city, state)')
    .in('status', ['available', 'urgent'])
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Available dogs</h1>
          <p className="text-base text-[#6b7280] max-w-2xl leading-relaxed">Dogs currently in the network looking for rescue pulls.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {dogs?.map((dog) => (
            <Link key={dog.id} href={`/dogs/${dog.id}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:border-[#f59e0b]/30">
              <div className="aspect-[4/3] bg-[#fffbeb] relative overflow-hidden">
                {dog.photo_url ? (
                  <Image src={dog.photo_url} alt={dog.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-[900] text-[#f59e0b]">
                    {dog.name?.[0] || 'D'}
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <StatusBadge status={dog.status} euthanasiaDate={dog.euthanasia_date} />
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#111] mb-1">{dog.name}</h2>
                <p className="text-sm text-[#6b7280] mb-4">{dog.breed}{dog.mix ? ' mix' : ''}</p>
                <div className="flex items-center gap-4 py-3 border-t border-gray-50 mb-4">
                  {[
                    { label: 'Age', value: dog.age_years ? `${dog.age_years}y` : '—' },
                    { label: 'Weight', value: dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—' },
                    { label: 'Sex', value: dog.sex || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-semibold text-[#111] capitalize">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center text-[10px] font-bold text-[#451a03]">
                    {dog.organizations?.name?.[0]}
                  </div>
                  <p className="text-xs text-[#6b7280]">From <span className="font-semibold text-[#111]">{dog.organizations?.name}</span></p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!dogs || dogs.length === 0) && (
          <div className="text-center py-20 bg-[#fffbeb] rounded-xl border border-dashed border-gray-200">
            <p className="text-[#6b7280] font-medium">No dogs currently available for rescue. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}
