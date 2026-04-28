'use client'

import { useState } from 'react'

interface Org {
  id: string
  name: string
  email: string
  type: string
  city: string
  state: string
  is_active: boolean
  created_at: string
}

interface Props {
  orgs: Org[]
  alertsByOrg: Record<string, { sent: number; responded: number }>
}

export default function AdminOrgTable({ orgs, alertsByOrg }: Props) {
  const [orgList, setOrgList] = useState(orgs)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'shelter' | 'rescue'>('all')

  const filtered = orgList.filter(o => filter === 'all' || o.type === filter)

  async function toggleActive(orgId: string, currentState: boolean) {
    setLoading(orgId)
    const res = await fetch('/api/admin/orgs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, is_active: !currentState }),
    })
    if (res.ok) {
      setOrgList(prev => prev.map(o => o.id === orgId ? { ...o, is_active: !currentState } : o))
    }
    setLoading(null)
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'shelter', 'rescue'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === f
                ? 'bg-[#111] text-white'
                : 'bg-gray-100 text-[#6b7280] hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${orgList.length})` : f === 'shelter' ? `Shelters (${orgList.filter(o => o.type === 'shelter').length})` : `Rescues (${orgList.filter(o => o.type === 'rescue').length})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Org</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Alerts</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Joined</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((org, i) => {
              const stats = alertsByOrg[org.id]
              return (
                <tr key={org.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-semibold text-[#111]">{org.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      org.type === 'shelter' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {org.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b7280]">{org.city}, {org.state}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{org.email}</td>
                  <td className="px-4 py-3 text-[#6b7280]">
                    {stats ? (
                      <span>{stats.sent} sent / <span className="text-green-600 font-semibold">{stats.responded} interested</span></span>
                    ) : (
                      <span className="text-[#9ca3af]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af]">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(org.id, org.is_active)}
                      disabled={loading === org.id}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        org.is_active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {loading === org.id ? '...' : org.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#9ca3af]">No organizations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
