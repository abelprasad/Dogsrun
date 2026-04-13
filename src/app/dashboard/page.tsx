import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  const { data: dogs } = await supabase
    .from('dogs')
    .select('*')
    .order('created_at', { ascending: false })

  const available = dogs?.filter(d => d.status === 'available').length ?? 0
  const adopted = dogs?.filter(d => d.status === 'adopted').length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">DOGSRUN</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{org?.name ?? user.email}</span>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">{org?.city}, {org?.state}</p>
          </div>
          <Link
            href="/dashboard/dogs/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Add dog
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Total dogs</h3>
            <p className="text-3xl font-bold text-blue-600">{dogs?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Available</h3>
            <p className="text-3xl font-bold text-green-600">{available}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Adopted</h3>
            <p className="text-3xl font-bold text-gray-600">{adopted}</p>
          </div>
        </div>

        {/* Dogs table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Your dogs</h3>
          </div>
          {!dogs || dogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No dogs yet.</p>
              <Link href="/dashboard/dogs/new" className="text-blue-600 hover:underline text-sm">
                Add your first dog →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Name</th>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Breed</th>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Age</th>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Weight</th>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-gray-500 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dogs.map(dog => (
                  <tr key={dog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{dog.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{dog.breed ?? '—'}{dog.mix ? ' mix' : ''}</td>
                    <td className="px-6 py-4 text-gray-600">{dog.age_years ? `${dog.age_years}y` : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dog.status === 'available' ? 'bg-green-100 text-green-700' :
                        dog.status === 'adopted' ? 'bg-gray-100 text-gray-600' :
                        dog.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {dog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(dog.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}