'use client'

import { useCallback, useEffect, useState } from 'react'
import PaginationControls from './pagination-controls'
import { useToast } from '@/components/toaster'
import { reportError } from '@/lib/friendly-error'

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

interface AlertStats {
  sent: number
  responded: number
}

type TypeFilter = 'all' | 'shelter' | 'rescue'

const PAGE_SIZE = 25

export default function AdminOrgTable() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [alertStats, setAlertStats] = useState<Record<string, AlertStats>>({})
  const [pendingOrgs, setPendingOrgs] = useState<Org[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<TypeFilter>('all')
  const [counts, setCounts] = useState({ all: 0, shelter: 0, rescue: 0 })
  const [tableLoading, setTableLoading] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [digestStatus, setDigestStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})
  const toast = useToast()

  const fetchPage = useCallback(async (p: number, f: TypeFilter) => {
    setTableLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) })
      if (f !== 'all') params.set('type', f)
      const res = await fetch(`/api/admin/orgs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.orgs)
        setTotal(data.total)
        setAlertStats(data.alertStats ?? {})
        setCounts(data.counts ?? { all: 0, shelter: 0, rescue: 0 })
      }
    } finally {
      setTableLoading(false)
    }
  }, [])

  const fetchPending = useCallback(async () => {
    const res = await fetch('/api/admin/orgs?page=1&pageSize=100&approval_status=pending')
    if (res.ok) setPendingOrgs((await res.json()).orgs)
  }, [])

  useEffect(() => { fetchPage(page, filter) }, [page, filter, fetchPage])
  useEffect(() => { fetchPending() }, [fetchPending])

  function changeFilter(f: TypeFilter) {
    setFilter(f)
    setPage(1)
  }

  async function refresh() {
    await Promise.all([fetchPage(page, filter), fetchPending()])
  }

  async function toggleActive(orgId: string, currentState: boolean) {
    setLoading(orgId + '-active')
    const res = await fetch('/api/admin/orgs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, is_active: !currentState }),
    })
    if (res.ok) await refresh()
    setLoading(null)
  }

  async function handleApproval(orgId: string, action: 'approve' | 'reject') {
    setLoading(orgId + '-' + action)
    const res = await fetch('/api/admin/orgs/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, action }),
    })
    if (res.ok) await refresh()
    setLoading(null)
  }

  async function sendDigest(orgId: string) {
    setDigestStatus(prev => ({ ...prev, [orgId]: 'sending' }))
    try {
      const res = await fetch('/api/admin/orgs/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      const data = await res.json()
      if (res.ok) {
        setDigestStatus(prev => ({ ...prev, [orgId]: 'sent' }))
        if (data.matches === 0) toast.success("No matching dogs found for this rescue's criteria.")
        else toast.success(`Digest sent! ${data.matches} matching dog${data.matches === 1 ? '' : 's'}.`)
      } else {
        setDigestStatus(prev => ({ ...prev, [orgId]: 'error' }))
        toast.error(reportError(data.error ?? `digest ${res.status}`, "Couldn't send digest — try again."))
      }
    } catch (err) {
      setDigestStatus(prev => ({ ...prev, [orgId]: 'error' }))
      toast.error(reportError(err, "Couldn't send digest — try again."))
    } finally {
      setTimeout(() => setDigestStatus(prev => { const next = { ...prev }; delete next[orgId]; return next }), 3000)
    }
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-10">

      {/* Pending Approvals */}
      {pendingOrgs.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64]">Pending Approvals</p>
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#f4b942]/20 text-[#13241d]">
              {pendingOrgs.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrgs.map(org => (
              <div key={org.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#fff9ef] outline outline-1 outline-[#f4b942]/30">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-[#13241d]">{org.name}</p>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      org.type === 'shelter' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{org.type}</span>
                  </div>
                  <p className="text-sm text-[#5d6a64]">{org.email} · {org.city}, {org.state}</p>
                  <p className="text-xs text-[#5d6a64]/60 mt-0.5">Applied {new Date(org.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {org.tax_doc_url && (
                    <button
                      onClick={() => viewDocument(org.tax_doc_url!)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#f5f0e8] text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942] transition-colors uppercase tracking-[0.1em]"
                    >
                      Doc
                    </button>
                  )}
                  <button
                    onClick={() => handleApproval(org.id, 'reject')}
                    disabled={loading === org.id + '-reject'}
                    className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 uppercase tracking-[0.1em]"
                  >
                    {loading === org.id + '-reject' ? '...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApproval(org.id, 'approve')}
                    disabled={loading === org.id + '-approve'}
                    className="px-3 py-1.5 text-xs font-bold bg-[#13241d] text-[#f4b942] hover:bg-[#1a2e1a] transition-colors disabled:opacity-50 uppercase tracking-[0.1em]"
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
              onClick={() => changeFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] transition-colors ${
                filter === f
                  ? 'bg-[#13241d] text-[#f4b942]'
                  : 'bg-[#f5f0e8] text-[#5d6a64] hover:bg-[#13241d]/10'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'shelter' ? `Shelters (${counts.shelter})` : `Rescues (${counts.rescue})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto bg-[#fff9ef] outline outline-1 outline-[#13241d]/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#13241d]">
                {['Org', 'Type', 'Location', 'Email', 'Alerts', 'Joined', 'Approval', 'Active', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-[#f4b942]/70 uppercase tracking-[0.24em] text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[#5d6a64]">Loading organizations…</td></tr>
              ) : orgs.length > 0 ? orgs.map((org, i) => {
                const stats = alertStats[org.id]
                const dStatus = digestStatus[org.id]
                return (
                  <tr key={org.id} className={i % 2 === 0 ? 'bg-[#fff9ef]' : 'bg-[#f5f0e8]/60'}>
                    <td className="px-4 py-3 font-semibold text-[#13241d] whitespace-nowrap">{org.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        org.type === 'shelter' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {org.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5d6a64] whitespace-nowrap">{org.city}, {org.state}</td>
                    <td className="px-4 py-3 text-[#5d6a64]">{org.email}</td>
                    <td className="px-4 py-3 text-[#5d6a64] whitespace-nowrap">
                      {stats ? (
                        <span>{stats.sent} sent / <span className="text-green-700 font-semibold">{stats.responded} interested</span></span>
                      ) : (
                        <span className="text-[#5d6a64]/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#5d6a64]/60 text-xs whitespace-nowrap">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {org.approval_status ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                          org.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                          org.approval_status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-[#f4b942]/20 text-[#13241d]'
                        }`}>
                          {org.approval_status}
                        </span>
                      ) : (
                        <span className="text-[#5d6a64]/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {org.tax_doc_url && (
                          <button
                            onClick={() => viewDocument(org.tax_doc_url!)}
                            className="px-2 py-1 text-xs font-bold bg-[#f5f0e8] text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942] transition-colors uppercase tracking-[0.1em]"
                          >
                            Doc
                          </button>
                        )}
                        {org.type === 'rescue' && org.approval_status === 'approved' && (
                          <button
                            onClick={() => sendDigest(org.id)}
                            disabled={dStatus === 'sending'}
                            className="px-2 py-1 text-xs font-bold uppercase tracking-[0.1em] transition-colors disabled:opacity-50 bg-purple-50 text-purple-700 hover:bg-purple-100"
                          >
                            {dStatus === 'sending' ? '...' : dStatus === 'sent' ? 'Sent!' : dStatus === 'error' ? 'Error' : 'Digest'}
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(org.id, org.is_active)}
                          disabled={loading === org.id + '-active'}
                          className={`px-2 py-1 text-xs font-bold uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
                            org.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {loading === org.id + '-active' ? '...' : org.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#5d6a64]">No organizations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}