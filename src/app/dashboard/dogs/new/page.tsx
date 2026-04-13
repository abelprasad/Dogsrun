'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewDogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    breed: '',
    mix: false,
    age_years: '',
    weight_lbs: '',
    sex: 'unknown',
    color: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!org) {
      alert('No organization found for your account. Contact support.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('dogs').insert({
      ...form,
      age_years: form.age_years ? parseFloat(form.age_years) : null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      shelter_id: org.id,
      status: 'available',
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">DOGSRUN</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to dashboard
        </button>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add a dog</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('name', 'Name', 'text', 'Buddy')}
            {field('breed', 'Breed', 'text', 'Labrador')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('age_years', 'Age (years)', 'number', '2')}
            {field('weight_lbs', 'Weight (lbs)', 'number', '45')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select
                value={form.sex}
                onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            {field('color', 'Color', 'text', 'Black and white')}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mix"
              checked={form.mix}
              onChange={e => setForm(f => ({ ...f, mix: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="mix" className="text-sm font-medium text-gray-700">Mixed breed</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any relevant info about this dog..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add dog'}
          </button>
        </form>
      </main>
    </div>
  )
}