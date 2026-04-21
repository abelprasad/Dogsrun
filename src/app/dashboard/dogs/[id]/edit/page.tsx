import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditDogForm from './edit-form'
import SignOutButton from '../../../sign-out-button'

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: userOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: dogData } = await supabaseAdmin
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single()

  if (!dogData) {
    notFound()
  }

  if (!userOrg || userOrg.id !== dogData.shelter_id) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dashboard</Link>
            <Link href={`/dashboard/dogs/${id}`} className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dog Profile</Link>
            <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Edit Dog</span>
          </div>
          <SignOutButton />
        </div>
      </div>

      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
            Edit {dogData.name}
          </h1>
          <p className="text-[#6b7280]">Update this dog's information.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-8">
        <EditDogForm dog={dogData} />
      </main>
    </div>
  )
}
