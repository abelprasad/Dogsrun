import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dog_id, ...updateFields } = body

    if (!dog_id) {
      return NextResponse.json({ error: 'dog_id is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Filter out fields that shouldn't be updated directly via this payload if any
    // or just pass them through as requested.
    const { error } = await supabase
      .from('dogs')
      .update({
        ...updateFields,
        // Ensure numeric fields are correctly typed if they came in as strings
        age_years: updateFields.age_years ? parseFloat(updateFields.age_years) : null,
        weight_lbs: updateFields.weight_lbs ? parseFloat(updateFields.weight_lbs) : null,
      })
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
