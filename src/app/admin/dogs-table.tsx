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
    if (level === 'past-due') return { label: 'Past Due', cls: 'bg-red-600 text-white' }
    if (level === 'critical') return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
    if (level === 'at-risk') return { label: 'At Risk', cls: 'bg-[#f4b942]/20 text-[#13241d]' }
    return null
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'at_risk', label: `At Risk (${counts.atRisk})` },
          { key: 'urgent', label: `Urgent (${counts.urgent})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => changeFilter(key as DogFilter)}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] transition-colors ${
              filter === key
                ? 'bg-[#13241d] text-[#f4b942]'
                : 'bg-[#f5f0e8] text-[#5d6a64] hover:bg-[#13241d]/10'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-[#fff9ef] outline outline-1 outline-[#13241d]/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#13241d]">
              {['Dog', 'Shelter', 'Status', 'Euthanasia Date', 'Added', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-bold text-[#f4b942]/70 uppercase tracking-[0.24em] text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[#5d6a64]">Loading dogs…</td></tr>
            ) : dogs.length > 0 ? dogs.map((dog, i) => {
              const risk = getRiskLabel(dog)
              const isDeleting = confirmDelete === dog.id
              return (
                <tr key={dog.id} className={`${isDeleting ? 'bg-red-50' : i % 2 === 0 ? 'bg-[#fff9ef]' : 'bg-[#f5f0e8]/60'}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#13241d]">{dog.name}</p>
                    <p className="text-xs text-[#5d6a64]">{dog.breed}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5d6a64]">{dog.organizations?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {risk && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-[0.1em] ${risk.cls}`}>{risk.label}</span>
                      )}
                      <select
                        value={dog.status ?? 'available'}
                        disabled={loading === dog.id}
                        onChange={e => updateDog(dog.id, { status: e.target.value })}
                        className="text-xs font-semibold border border-[#13241d]/20 px-2 py-1.5 bg-[#fffaf2] text-[#13241d] outline-none disabled:opacity-50"
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
                          className="text-xs border border-[#13241d]/20 px-2 py-1 outline-none focus:border-[#f4b942] bg-[#fffaf2] text-[#13241d]"
                        />
                        <button
                          onClick={() => { updateDog(dog.id, { euthanasia_date: dateValue || null }); setEditingDate(null) }}
                          className="text-xs font-bold text-green-700 hover:text-green-800"
                        >Save</button>
                        <button onClick={() => setEditingDate(null)} className="text-xs text-[#5d6a64] hover:text-[#13241d]">×</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5d6a64]">
                          {dog.euthanasia_date ? parseLocalDate(dog.euthanasia_date).toLocaleDateString() : '—'}
                        </span>
                        <button
                          onClick={() => { setEditingDate(dog.id); setDateValue(dog.euthanasia_date?.split('T')[0] ?? '') }}
                          className="text-[10px] font-bold text-[#5d6a64] hover:text-[#13241d] transition-colors uppercase tracking-[0.1em]"
                        >
                          {dog.euthanasia_date ? 'Edit' : 'Set'}
                        </button>
                        {dog.euthanasia_date && (
                          <button
                            onClick={() => updateDog(dog.id, { euthanasia_date: null })}
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
                          >Clear</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5d6a64]/60 text-xs whitespace-nowrap">
                    {dog.created_at ? new Date(dog.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-semibold">Delete?</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteDog(dog.id)}
                          disabled={loading === dog.id + '-delete'}
                        >
                          {loading === dog.id + '-delete' ? '...' : 'Yes'}
                        </Button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs font-bold text-[#5d6a64] hover:text-[#13241d]">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resendAlerts(dog.id)}
                          disabled={loading === dog.id + '-alerts'}
                          className="text-xs font-bold px-2 py-1 bg-[#13241d] text-[#f4b942] hover:bg-[#1a2e1a] disabled:opacity-50 whitespace-nowrap uppercase tracking-[0.1em]"
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
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[#5d6a64]">No dogs found</td></tr>
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