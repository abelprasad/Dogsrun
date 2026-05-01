import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import NewDogForm from './new-dog-form'

export default async function NewDogPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'shelter') redirect('/dashboard')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: adminRow } = await serviceClient
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  const isAdmin = !!adminRow

  return <NewDogForm orgName={org.name} isAdmin={isAdmin} />
}
