'use client'

import { useState } from 'react'

const STATUSES = ['available', 'urgent', 'pending', 'rescue_requested', 'placed', 'adopted', 'deceased', 'transferred']

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

export default function AdminDogsTable({ dogs: initialDogs }: { dogs: Dog[] }) {
  const [dogs, setDogs] = useState(initialDogs)
  const [loading, setLoading] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [dateValue, setDateValue] = useState('')
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'urgent'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Refresh "now" every minute so risk labels stay accurate without calling Date.now() during render
  useState(() => { const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id) })

  const filtered = dogs.filter(d => {
    if (filter === 'urgent') return d.status === 'urgent'
    if (filter === 'at_risk') return !!d.euthanasia_date && new Date(d.euthanasia_date).getTime() > now
    return true
  })

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
      alert('Failed to update dog')
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
      setDogs(prev => prev.filter(d => d.id !== dogId))
    } else {
      alert('Failed to delete dog')
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
    alert(res.ok ? `${data.message}` : 'Failed to send alerts')
    setLoading(null)
  }

  function getRiskLabel(dog: Dog) {
    if (!dog.euthanasia_date) return null
    const diff = new Date(dog.euthanasia_date).getTime() - now
    if (diff <= 0) return { label: 'Past Due', cls: 'bg-red-600 text-white' }
    if (diff <= 24 * 60 * 60 * 1000) return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
    return { label: 'At Risk', cls: 'bg-amber-100 text-amber-700' }
  }

  const atRiskCount = dogs.filter(d => d.euthanasia_date && new Date(d.euthanasia_date).getTime() > now).length
  const urgentCount = dogs.filter(d => d.status === 'urgent').length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${dogs.length})` },
          { key: 'at_risk', label: `At Risk (${atRiskCount})` },
          { key: 'urgent', label: `Urgent (${urgentCount})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === key ? 'bg-[#111] text-white' : 'bg-gray-100 text-[#6b7280] hover:bg-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Dog', 'Shelter', 'Status', 'Euthanasia Date', 'Added', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((dog, i) => {
              const risk = getRiskLabel(dog)
              const isDeleting = confirmDelete === dog.id
              return (
                <tr key={dog.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${isDeleting ? 'bg-red-50' : ''}`}>
                  {/* Dog */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#111]">{dog.name}</p>
                    <p className="text-xs text-[#9ca3af]">{dog.breed}{dog.mix ? ' mix' : ''}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
                  </td>

                  {/* Shelter */}
                  <td className="px-4 py-3 text-[#6b7280]">{dog.organizations?.name ?? '—'}</td>

                  {/* Status dropdown */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {risk && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.cls}`}>{risk.label}</span>
                      )}
                      <select
                        value={dog.status ?? 'available'}
                        disabled={loading === dog.id}
                        onChange={e => updateDog(dog.id, { status: e.target.value })}
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#111] outline-none disabled:opacity-50"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>

                  {/* Euthanasia date */}
                  <td className="px-4 py-3">
                    {editingDate === dog.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dateValue}
                          onChange={e => setDateValue(e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#f59e0b]"
                        />
                        <button
                          onClick={() => { updateDog(dog.id, { euthanasia_date: dateValue || null }); setEditingDate(null) }}
                          className="text-xs font-bold text-green-600 hover:text-green-700"
                        >Save</button>
                        <button onClick={() => setEditingDate(null)} className="text-xs text-[#9ca3af] hover:text-[#111]">×</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6b7280]">
                          {dog.euthanasia_date ? new Date(dog.euthanasia_date).toLocaleDateString() : '—'}
                        </span>
                        <button
                          onClick={() => { setEditingDate(dog.id); setDateValue(dog.euthanasia_date?.split('T')[0] ?? '') }}
                          className="text-[10px] font-bold text-[#9ca3af] hover:text-[#f59e0b] transition-colors"
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

                  {/* Added */}
                  <td className="px-4 py-3 text-[#9ca3af] text-xs">
                    {dog.created_at ? new Date(dog.created_at).toLocaleDateString() : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-semibold">Delete?</span>
                        <button
                          onClick={() => deleteDog(dog.id)}
                          disabled={loading === dog.id + '-delete'}
                          className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {loading === dog.id + '-delete' ? '...' : 'Yes'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs font-bold text-[#6b7280] hover:text-[#111]">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resendAlerts(dog.id)}
                          disabled={loading === dog.id + '-alerts'}
                          className="text-xs font-bold px-2 py-1 bg-[#fffbeb] text-[#451a03] border border-gray-200 rounded hover:bg-amber-50 disabled:opacity-50 whitespace-nowrap"
                        >
                          {loading === dog.id + '-alerts' ? '...' : 'Resend Alerts'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(dog.id)}
                          className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">No dogs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
