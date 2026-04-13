'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function StatusUpdater({ dogId, currentStatus }: { dogId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('dogs').update({ status: newStatus }).eq('id', dogId)
    setStatus(newStatus)
    router.refresh()
    setLoading(false)
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Update status</label>
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="available">Available</option>
        <option value="pending">Pending</option>
        <option value="adopted">Adopted</option>
        <option value="transferred">Transferred</option>
        <option value="deceased">Deceased</option>
      </select>
    </div>
  )
}