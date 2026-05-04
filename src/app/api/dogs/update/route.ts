import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be a logged-in user
    const supabaseAuth = await createSupabaseServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { dog_id, ...updateFields } = body

    if (!dog_id) {
      return NextResponse.json({ error: 'dog_id is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ownership check — dog must belong to user's org
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('shelter_id')
      .eq('id', dog_id)
      .single()

    if (!dog || dog.shelter_id !== org.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates = { ...updateFields }
    if ('age_years' in updates) {
      updates.age_years = updates.age_years ? parseFloat(updates.age_years) : null
    }
    if ('weight_lbs' in updates) {
      updates.weight_lbs = updates.weight_lbs ? parseFloat(updates.weight_lbs) : null
    }

    const { error } = await supabase
      .from('dogs')
      .update(updates)
      .eq('id', dog_id)

    if (error) {
      console.error('Error updating dog:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
