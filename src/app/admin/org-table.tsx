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

const typeChip = (type: string) =>
  type === 'shelter'
    ? 'border border-sky-400/40 text-sky-300'
    : 'border border-purple-400/40 text-purple-300'

const approvalChip = (status: string) =>
  status === 'approved'
    ? 'border border-[#7ddba3]/50 text-[#7ddba3]'
    : status === 'rejected'
      ? 'border border-[#a8583f]/50 text-[#c98a7a]'
      : 'border border-[#c08a3e]/50 text-[#c08a3e]'

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
          <div className="mb-4 flex items-center gap-3">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#c98a7a]">Pending approvals</p>
            <span className="border border-[#c08a3e]/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#c08a3e]">
              {pendingOrgs.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrgs.map(org => (
              <div key={org.id} className="flex flex-col justify-between gap-4 border border-[#c08a3e]/40 bg-[#122016] p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-0.5 flex items-center gap-2">
                    <p className="font-black tracking-tight text-[#f8f1e8]">{org.name}</p>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${typeChip(org.type)}`}>{org.type}</span>
                  </div>
                  <p className="text-sm text-[#f8f1e8]/55">{org.email} · {org.city}, {org.state}</p>
                  <p className="mt-0.5 text-xs text-[#f8f1e8]/35">Applied {new Date(org.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {org.tax_doc_url && (
                    <button
                      onClick={() => viewDocument(org.tax_doc_url!)}
                      className="border border-white/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f8f1e8] transition-colors hover:border-[#c08a3e] hover:text-[#c08a3e]"
                    >
                      Doc
                    </button>
                  )}
                  <button
                    onClick={() => handleApproval(org.id, 'reject')}
                    disabled={loading === org.id + '-reject'}
                    className="border border-[#a8583f]/60 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#c98a7a] transition-colors hover:bg-[#a8583f]/20 disabled:opacity-50"
                  >
                    {loading === org.id + '-reject' ? '...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApproval(org.id, 'approve')}
                    disabled={loading === org.id + '-approve'}
                    className="bg-[#c08a3e] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#140a08] transition-colors hover:bg-[#d4a050] disabled:opacity-50"
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
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'shelter', 'rescue'] as const).map(f => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`border px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] transition-colors ${
                filter === f
                  ? 'border-[#c08a3e] bg-[#c08a3e] text-[#140a08]'
                  : 'border-white/15 text-[#f8f1e8]/55 hover:border-[#c08a3e]/60 hover:text-[#f8f1e8]'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'shelter' ? `Shelters (${counts.shelter})` : `Rescues (${counts.rescue})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto border border-white/10 bg-[#122016]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Org', 'Type', 'Location', 'Email', 'Alerts', 'Joined', 'Approval', 'Active', 'Action'].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[#f8f1e8]/40">Loading organizations…</td></tr>
              ) : orgs.length > 0 ? orgs.map((org, i) => {
                const stats = alertStats[org.id]
                const dStatus = digestStatus[org.id]
                return (
                  <tr key={org.id} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-[#f8f1e8]">{org.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${typeChip(org.type)}`}>
                        {org.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#f8f1e8]/55">{org.city}, {org.state}</td>
                    <td className="px-4 py-3 text-[#f8f1e8]/55">{org.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#f8f1e8]/55">
                      {stats ? (
                        <span>{stats.sent} sent / <span className="font-bold text-[#7ddba3]">{stats.responded} interested</span></span>
                      ) : (
                        <span className="text-[#f8f1e8]/25">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#f8f1e8]/35">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {org.approval_status ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${approvalChip(org.approval_status)}`}>
                          {org.approval_status}
                        </span>
                      ) : (
                        <span className="text-xs text-[#f8f1e8]/25">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                        org.is_active ? 'border border-[#7ddba3]/50 text-[#7ddba3]' : 'border border-[#a8583f]/50 text-[#c98a7a]'
                      }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {org.tax_doc_url && (
                          <button
                            onClick={() => viewDocument(org.tax_doc_url!)}
                            className="border border-white/20 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#f8f1e8] transition-colors hover:border-[#c08a3e] hover:text-[#c08a3e]"
                          >
                            Doc
                          </button>
                        )}
                        {org.type === 'rescue' && org.approval_status === 'approved' && (
                          <button
                            onClick={() => sendDigest(org.id)}
                            disabled={dStatus === 'sending'}
                            className="border border-purple-400/40 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-purple-300 transition-colors hover:bg-purple-400/10 disabled:opacity-50"
                          >
                            {dStatus === 'sending' ? '...' : dStatus === 'sent' ? 'Sent!' : dStatus === 'error' ? 'Error' : 'Digest'}
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(org.id, org.is_active)}
                          disabled={loading === org.id + '-active'}
                          className={`whitespace-nowrap border px-2 py-1 text-xs font-black uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
                            org.is_active
                              ? 'border-[#a8583f]/60 text-[#c98a7a] hover:bg-[#a8583f]/20'
                              : 'border-[#7ddba3]/60 text-[#7ddba3] hover:bg-[#7ddba3]/10'
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
                  <td colSpan={9} className="px-4 py-12 text-center text-[#f8f1e8]/40">No organizations found</td>
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
