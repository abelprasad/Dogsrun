import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import NewDogForm from './new-dog-form'

export default async function NewDogPage() {
  const { org } = await requireAuthContext()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.24em] text-[#c08a3e]/70 mb-3 font-bold">Shelter</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#c08a3e]">Add a Dog</h1>
          <p className="text-[#f5f0e8]/50 mt-2 text-sm">Help this dog find the perfect rescue match.</p>
        </div>
      </header>
      <NewDogForm />
    </div>
  )
}
