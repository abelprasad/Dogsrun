import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { dog_id } = await req.json()

    if (!dog_id) {
      return NextResponse.json({ error: 'dog_id required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('dogs')
      .update({ status: 'urgent' })
      .eq('id', dog_id)

    if (error) {
      console.error('Error updating dog status:', error)
      return NextResponse.json({ error: 'Failed to update dog status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
