import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const EDITABLE_DOG_FIELDS = [
  'name',
  'breed',
  'mix',
  'age_years',
  'weight_lbs',
  'sex',
  'color',
  'state',
  'description',
  'photo_url',
  'parvo',
  'tripod',
  'blind',
  'other_issues',
  'other_issues_notes',
  'euthanasia_date',
  'intake_date',
] as const

const VALID_SEXES = new Set(['male', 'female', 'unknown'])

export async function POST(req: NextRequest) {
  try {
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

    const updates: Record<string, unknown> = {}
    for (const field of EDITABLE_DOG_FIELDS) {
      if (field in updateFields) updates[field] = updateFields[field]
    }

    if ('sex' in updates && typeof updates.sex === 'string' && !VALID_SEXES.has(updates.sex)) {
      return NextResponse.json({ error: 'Invalid sex value' }, { status: 400 })
    }
    if ('age_years' in updates) {
      const age = updates.age_years ? Number(updates.age_years) : null
      if (age !== null && (!Number.isFinite(age) || age < 0)) {
        return NextResponse.json({ error: 'Invalid age_years value' }, { status: 400 })
      }
      updates.age_years = age
    }
    if ('weight_lbs' in updates) {
      const weight = updates.weight_lbs ? Number(updates.weight_lbs) : null
      if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
        return NextResponse.json({ error: 'Invalid weight_lbs value' }, { status: 400 })
      }
      updates.weight_lbs = weight
    }
    if ('color' in updates && updates.color !== null && !Array.isArray(updates.color)) {
      return NextResponse.json({ error: 'Invalid color value' }, { status: 400 })
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
