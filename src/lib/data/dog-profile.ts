import { supabaseAdmin } from '@/lib/supabase-server'

// Service-role reads behind the dashboard dog pages. Callers do their own
// authorization checks on the returned rows.

export function fetchDogWithShelter(id: string) {
  return supabaseAdmin
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()
}

export function fetchDog(id: string) {
  return supabaseAdmin
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single()
}

export async function rescueWasAlertedAboutDog(dogId: string, rescueId: string) {
  const { data } = await supabaseAdmin
    .from('alerts')
    .select('id')
    .eq('dog_id', dogId)
    .eq('rescue_id', rescueId)
    .maybeSingle()
  return Boolean(data)
}

export function fetchDogAlertsWithRescue(dogId: string) {
  return supabaseAdmin
    .from('alerts')
    .select('*, organizations(name, email, city, state)')
    .eq('dog_id', dogId)
    .order('sent_at', { ascending: false })
}
