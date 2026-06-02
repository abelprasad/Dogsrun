import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import NewDogForm from './new-dog-form'

export default async function NewDogPage() {
  const { org } = await requireAuthContext()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  return <NewDogForm />
}
