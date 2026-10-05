'use client'

import { parseLocalDate } from '@/lib/date-utils'
import { useCallback, useEffect, useState } from 'react'
import Button from '@/components/ui/button'
import PaginationControls from './pagination-controls'
import { useToast } from '@/components/toaster'
import { reportError } from '@/lib/friendly-error'

import { DOG_STATUSES, getRiskLevel } from '@/lib/dog-status'

interface Dog {
  id: string
  name: string
  breed: string
  mix: boolean
  age_years: number | null
  status: string
  euthanasia_date: string | null
  created_at: string
  organizations: { name: string } | null
}

type DogFilter = 'all' | 'at_risk' | 'urgent'

const PAGE_SIZE = 25

export default function AdminDogsTable() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<DogFilter>('all')
  const [counts, setCounts] = useState({ all: 0, atRisk: 0, urgent: 0 })
  const [tableLoading, setTableLoading] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [dateValue, setDateValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const toast = useToast()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const fetchPage = useCallback(async (p: number, f: DogFilter) => {
    setTableLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE), filter: f })
      const res = await fetch(`/api/admin/dogs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDogs(data.dogs)
        setTotal(data.total)
        setCounts(data.counts ?? { all: 0, atRisk: 0, urgent: 0 })
      }
    } finally {
      setTableLoading(false)
    }
  }, [])

  useEffect(() => { fetchPage(page, filter) }, [page, filter, fetchPage])

  function changeFilter(f: DogFilter) {
    setFilter(f)
    setPage(1)
  }

  async function updateDog(dogId: string, fields: Record<string, unknown>) {
    setLoading(dogId)
    const res = await fetch('/api/admin/dogs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId, ...fields }),
    })
    if (res.ok) {
      setDogs(prev => prev.map(d => d.id === dogId ? { ...d, ...fields } : d))
    } else {
      toast.error(reportError({ endpoint: '/api/admin/dogs', status: res.status }, "Couldn't update dog — try again."))
    }
    setLoading(null)
  }

  async function deleteDog(dogId: string) {
    setLoading(dogId + '-delete')
    const res = await fetch('/api/admin/dogs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId }),
    })
    if (res.ok) {
      // Refetch so the page stays full; step back if the page is now empty
      if (dogs.length <= 1 && page > 1) setPage(page - 1)
      else fetchPage(page, filter)
    } else {
      toast.error(reportError({ endpoint: '/api/admin/dogs', status: res.status }, "Couldn't delete dog — try again."))
    }
    setLoading(null)
    setConfirmDelete(null)
  }

  async function resendAlerts(dogId: string) {
    setLoading(dogId + '-alerts')
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId }),
    })
    const data = await res.json()
    if (res.ok) toast.success(`${data.message}`)
    else toast.error(reportError({ endpoint: '/api/alerts', status: res.status }, "Couldn't send alerts — try again."))
    setLoading(null)
  }

  function getRiskLabel(dog: Dog) {
    const level = getRiskLevel(dog.euthanasia_date)
    if (level === 'past-due') return { label: 'Past Due', cls: 'bg-[#a8583f] text-white' }
    if (level === 'critical') return { label: 'Critical', cls: 'border border-[#a8583f]/60 text-[#c98a7a]' }
    if (level === 'at-risk') return { label: 'At Risk', cls: 'border border-[#c08a3e]/50 text-[#c08a3e]' }
    return null
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'at_risk', label: `At Risk (${counts.atRisk})` },
          { key: 'urgent', label: `Urgent (${counts.urgent})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => changeFilter(key as DogFilter)}
            className={`border px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] transition-colors ${
              filter === key
                ? 'border-[#c08a3e] bg-[#c08a3e] text-[#140a08]'
                : 'border-white/15 text-[#f8f1e8]/55 hover:border-[#c08a3e]/60 hover:text-[#f8f1e8]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-white/10 bg-[#122016]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Dog', 'Shelter', 'Status', 'Euthanasia Date', 'Added', 'Actions'].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[#f8f1e8]/40">Loading dogs…</td></tr>
            ) : dogs.length > 0 ? dogs.map((dog, i) => {
              const risk = getRiskLabel(dog)
              const isDeleting = confirmDelete === dog.id
              return (
                <tr key={dog.id} className={`border-b border-white/5 ${isDeleting ? 'bg-[#a8583f]/10' : i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#f8f1e8]">{dog.name}</p>
                    <p className="text-xs text-[#f8f1e8]/45">{dog.breed}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-[#f8f1e8]/55">{dog.organizations?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {risk && (
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${risk.cls}`}>{risk.label}</span>
                      )}
                      <select
                        value={dog.status ?? 'available'}
                        disabled={loading === dog.id}
                        onChange={e => updateDog(dog.id, { status: e.target.value })}
                        className="border border-white/15 bg-[#0b140e] px-2 py-1.5 text-xs font-bold text-[#f8f1e8] outline-none [color-scheme:dark] disabled:opacity-50"
                      >
                        {DOG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingDate === dog.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dateValue}
                          onChange={e => setDateValue(e.target.value)}
                          className="border border-white/15 bg-[#0b140e] px-2 py-1 text-xs text-[#f8f1e8] outline-none [color-scheme:dark] focus:border-[#c08a3e]"
                        />
                        <button
                          onClick={() => { updateDog(dog.id, { euthanasia_date: dateValue || null }); setEditingDate(null) }}
                          className="text-xs font-black uppercase tracking-[0.1em] text-[#7ddba3] hover:text-white"
                        >Save</button>
                        <button onClick={() => setEditingDate(null)} className="text-xs text-[#f8f1e8]/50 hover:text-white">×</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#f8f1e8]/55">
                          {dog.euthanasia_date ? parseLocalDate(dog.euthanasia_date).toLocaleDateString() : '—'}
                        </span>
                        <button
                          onClick={() => { setEditingDate(dog.id); setDateValue(dog.euthanasia_date?.split('T')[0] ?? '') }}
                          className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f8f1e8]/45 transition-colors hover:text-[#c08a3e]"
                        >
                          {dog.euthanasia_date ? 'Edit' : 'Set'}
                        </button>
                        {dog.euthanasia_date && (
                          <button
                            onClick={() => updateDog(dog.id, { euthanasia_date: null })}
                            className="text-[10px] font-black uppercase tracking-[0.1em] text-[#c98a7a]/70 transition-colors hover:text-[#c98a7a]"
                          >Clear</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#f8f1e8]/35">
                    {dog.created_at ? new Date(dog.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#c98a7a]">Delete?</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteDog(dog.id)}
                          disabled={loading === dog.id + '-delete'}
                        >
                          {loading === dog.id + '-delete' ? '...' : 'Yes'}
                        </Button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs font-black uppercase tracking-[0.1em] text-[#f8f1e8]/50 hover:text-white">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resendAlerts(dog.id)}
                          disabled={loading === dog.id + '-alerts'}
                          className="whitespace-nowrap border border-[#c08a3e]/50 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#c08a3e] transition-colors hover:bg-[#c08a3e]/10 disabled:opacity-50"
                        >
                          {loading === dog.id + '-alerts' ? '...' : 'Resend Alerts'}
                        </button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDelete(dog.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[#f8f1e8]/40">No dogs found</td></tr>
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
  )
}
