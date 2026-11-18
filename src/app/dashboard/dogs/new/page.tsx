import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import PageHeader from '@/components/ui/page-header'
import NewDogForm from './new-dog-form'

export default async function NewDogPage() {
  const { org } = await requireAuthContext()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <PageHeader eyebrow="Shelter" title="Add a Dog" sub="Help this dog find the perfect rescue match." />
      <NewDogForm shelterId={org.id} />
    </div>
  )
}
