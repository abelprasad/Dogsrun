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
  approval_status: string
  tax_doc_url: string | null
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
  const pendingRescues = orgList.filter(o => o.type === 'rescue' && o.approval_status === 'pending')

  async function toggleActive(orgId: string, currentState: boolean) {
    setLoading(orgId + '-active')
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

  async function handleApproval(orgId: string, action: 'approve' | 'reject') {
    setLoading(orgId + '-' + action)
    const res = await fetch('/api/admin/orgs/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, action }),
    })
    if (res.ok) {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setOrgList(prev => prev.map(o => o.id === orgId ? { ...o, approval_status: newStatus } : o))
    }
    setLoading(null)
  }

  async function viewDocument(filePath: string) {
    const res = await fetch('/api/admin/orgs/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: filePath }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-10">

      {/* Pending Approvals */}
      {pendingRescues.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-base font-bold text-[#111]">Pending Approvals</h3>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              {pendingRescues.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingRescues.map(org => (
              <div key={org.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-amber-200 bg-[#fffbeb]">
                <div>
                  <p className="font-bold text-[#111]">{org.name}</p>
                  <p className="text-sm text-[#6b7280]">{org.email} · {org.city}, {org.state}</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Applied {new Date(org.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {org.tax_doc_url && (
                    <button
                      onClick={() => viewDocument(org.tax_doc_url!)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 text-[#6b7280] hover:text-[#111] hover:border-gray-300 transition-colors"
                    >
                      View Doc
                    </button>
                  )}
                  <button
                    onClick={() => handleApproval(org.id, 'reject')}
                    disabled={loading === org.id + '-reject'}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {loading === org.id + '-reject' ? '...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApproval(org.id, 'approve')}
                    disabled={loading === org.id + '-approve'}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {loading === org.id + '-approve' ? '...' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Orgs Table */}
      <div>
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
                <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Approval</th>
                <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Active</th>
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
                      {org.type === 'rescue' ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          org.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                          org.approval_status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {org.approval_status ?? 'pending'}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af] text-xs">—</span>
                      )}
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
                        disabled={loading === org.id + '-active'}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                          org.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {loading === org.id + '-active' ? '...' : org.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#9ca3af]">No organizations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
