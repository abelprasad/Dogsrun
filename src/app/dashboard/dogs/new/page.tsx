'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewDogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: '',
    breed: '',
    mix: false,
    age_years: '',
    weight_lbs: '',
    sex: 'unknown',
    color: '',
    description: '',
  })

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-[#f59e0b] text-gray-900 placeholder-gray-400 transition-all"
      />
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!org) {
      alert('No organization found for your account. Contact support.')
      setLoading(false)
      return
    }

    let photo_url = null
    if (photo) {
      const folderId = crypto.randomUUID()
      const fileName = `${folderId}/${photo.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, photo)

      if (uploadError) {
        alert('Error uploading photo: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName)
      
      photo_url = publicUrl
    }

    const { data, error } = await supabase.from('dogs').insert({
      ...form,
      age_years: form.age_years ? parseFloat(form.age_years) : null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      shelter_id: org.id,
      status: 'available',
      photo_url,
    }).select().single()

    if (error) {
      alert(error.message)
    } else {
      if (data) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dog_id: data.id }),
        })
      }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-6 h-16 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-[#f59e0b]">DOGSRUN</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
          ← Back to dashboard
        </button>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900">Add a dog</h2>
          <p className="text-gray-500 mt-2 text-lg">Help this dog find the perfect rescue match.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('name', 'Dog Name', 'text', 'Buddy')}
            {field('breed', 'Primary Breed', 'text', 'Labrador')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('age_years', 'Age (years)', 'number', '2')}
            {field('weight_lbs', 'Weight (lbs)', 'number', '45')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select
                value={form.sex}
                onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-[#f59e0b] text-gray-900 transition-all bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            {field('color', 'Color/Markings', 'text', 'Black and white')}
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <input
              type="checkbox"
              id="mix"
              checked={form.mix}
              onChange={e => setForm(f => ({ ...f, mix: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <label htmlFor="mix" className="text-sm font-bold text-amber-900 cursor-pointer">This is a mixed breed dog</label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description & Medical Notes</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any relevant info about behavior, medical needs, or urgency..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-[#f59e0b] text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dog Photo</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setPhoto(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-2xl p-8 text-center group-hover:bg-amber-50 transition-colors">
                {photo ? (
                  <p className="text-amber-900 font-bold">{photo.name}</p>
                ) : (
                  <>
                    <p className="text-amber-900 font-bold">Click to upload photo</p>
                    <p className="text-xs text-gray-500 mt-1">Accepts PNG, JPG, or WEBP (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-[#d97706] disabled:opacity-50 transform transition active:scale-[0.98]"
          >
            {loading ? 'Adding Dog...' : 'Post to Network'}
          </button>
        </form>
      </main>
    </div>
  )
}
