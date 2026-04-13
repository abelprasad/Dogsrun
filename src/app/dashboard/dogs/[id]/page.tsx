import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusUpdater from './status-updater'

export default async function DogProfilePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: dog } = await supabase
    .from('dogs')
    .select('*, organizations(name, city, state)')
    .eq('id', params.id)
    .single()

  if (!dog) notFound()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, organizations(name, city, state)')
    .eq('dog_id', dog.id)
    .order('sent_at', { ascending: false })

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    adopted: 'bg-gray-100 text-gray-600',
    transferred: 'bg-blue-100 text-blue-700',
    deceased: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">DOGSRUN</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to dashboard
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="bg-white rounded-xl border p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{dog.name ?? 'Unnamed'}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[dog.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {dog.status}
                </span>
              </div>
              <p className="text-gray-500">
                {dog.breed ?? 'Unknown breed'}{dog.mix ? ' mix' : ''} · {dog.age_years ? `${dog.age_years}y` : 'Age unknown'} · {dog.weight_lbs ? `${dog.weight_lbs} lbs` : ''} · {dog.sex ?? 'Unknown sex'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Intake date: {dog.intake_date ? new Date(dog.intake_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <StatusUpdater dogId={dog.id} currentStatus={dog.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Details */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Dog details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Breed', value: `${dog.breed ?? '—'}${dog.mix ? ' mix' : ''}` },
                  { label: 'Age', value: dog.age_years ? `${dog.age_years} years` : '—' },
                  { label: 'Weight', value: dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—' },
                  { label: 'Sex', value: dog.sex ?? '—' },
                  { label: 'Color', value: dog.color ?? '—' },
                  { label: 'Status', value: dog.status },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b border-gray-100 pb-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-gray-900 font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {dog.notes && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{dog.notes}</p>
                </div>
              )}
            </div>

            {/* Alert history */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Alert history
                <span className="ml-2 text-sm font-normal text-gray-400">({alerts?.length ?? 0} sent)</span>
              </h3>
              {!alerts || alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">No alerts sent yet.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{(alert.organizations as any)?.name ?? 'Unknown rescue'}</p>
                        <p className="text-xs text-gray-400">{(alert.organizations as any)?.city}, {(alert.organizations as any)?.state}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'responded' ? 'bg-green-100 text-green-700' :
                          alert.status === 'opened' ? 'bg-blue-100 text-blue-700' :
                          alert.status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{new Date(alert.sent_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Shelter</h3>
              <p className="font-medium text-gray-900">{(dog.organizations as any)?.name}</p>
              <p className="text-sm text-gray-500">{(dog.organizations as any)?.city}, {(dog.organizations as any)?.state}</p>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/dogs/${dog.id}/edit`}
                  className="block w-full text-center border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Edit dog info
                </Link>
                <button className="block w-full text-center border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Send manual alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}