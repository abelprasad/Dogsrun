'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '../../sign-out-button'
import imageCompression from 'browser-image-compression'
import BreedSelect from '@/components/breed-select'
import ColorPicker from '@/components/color-picker'
import StateSelect from '@/components/state-select'

interface DogForm {
  name: string;
  breed: string;
  mix: boolean;
  age_years: string;
  weight_lbs: string;
  sex: string;
  color: string[];
  state: string;
  description: string;
  parvo: boolean;
  tripod: boolean;
  blind: boolean;
  other_issues: boolean;
  other_issues_notes: string;
}

export default function NewDogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [form, setForm] = useState<DogForm>({
    name: '',
    breed: '',
    mix: false,
    age_years: '',
    weight_lbs: '',
    sex: 'unknown',
    color: [],
    state: '',
    description: '',
    parvo: false,
    tripod: false,
    blind: false,
    other_issues: false,
    other_issues_notes: '',
  })

  const field = (key: keyof DogForm, label: string, type = 'text', placeholder = '', min?: string, step?: string) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        min={min}
        step={step}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] placeholder-[#9ca3af] transition-all text-sm"
      />
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.age_years !== '' && parseFloat(form.age_years) < 0) {
      alert('Age cannot be negative')
      return
    }
    if (form.weight_lbs !== '' && parseFloat(form.weight_lbs) < 0) {
      alert('Weight cannot be negative')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('email', user.email)
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
      const compressedPhoto = await imageCompression(photo, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, compressedPhoto)
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
      name: form.name,
      breed: form.breed,
      mix: form.mix,
      age_years: form.age_years ? parseFloat(form.age_years) : null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      sex: form.sex,
      color: form.color.length > 0 ? form.color : null,
      state: form.state || null,
      description: form.description,
      parvo: form.parvo,
      tripod: form.tripod,
      blind: form.blind,
      other_issues: form.other_issues,
      other_issues_notes: form.other_issues_notes,
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
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Add Dog</Link>
          </div>
          <SignOutButton />
        </div>
      </div>

      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">Add a dog</h1>
          <p className="text-[#6b7280]">Help this dog find the perfect rescue match.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-8 space-y-8 shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('name', 'Dog Name', 'text', 'Buddy')}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Breed</label>
              <BreedSelect
                value={form.breed}
                onChange={val => setForm(f => ({ ...f, breed: val }))}
                placeholder="Search or type breed..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('age_years', 'Age (years)', 'number', '2', '0', '0.1')}
            {field('weight_lbs', 'Weight (lbs)', 'number', '45', '0', '1')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sex</label>
              <select
                value={form.sex}
                onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] transition-all bg-white text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <StateSelect
                value={form.state}
                onChange={val => setForm(f => ({ ...f, state: val }))}
              />
            </div>
          </div>

          <ColorPicker
            selected={form.color}
            onChange={colors => setForm(f => ({ ...f, color: colors }))}
            label="Color(s)"
          />

          <div className="flex items-center gap-3 p-4 bg-[#fffbeb] rounded-lg border border-gray-100">
            <input
              type="checkbox"
              id="mix"
              checked={form.mix}
              onChange={e => setForm(f => ({ ...f, mix: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <label htmlFor="mix" className="text-sm font-semibold text-[#111] cursor-pointer">This is a mixed breed dog</label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description & Medical Notes</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any relevant info about behavior, medical needs, or urgency..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] placeholder-[#9ca3af] transition-all text-sm"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#111]">Special Needs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'parvo', label: 'Parvo' },
                { key: 'tripod', label: 'Tripod / Amputee' },
                { key: 'blind', label: 'Blind / Vision Impaired' },
                { key: 'other_issues', label: 'Other Issues' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form[key as keyof DogForm] as boolean}
                    onChange={e => setForm(f => ({
                      ...f,
                      [key]: e.target.checked,
                      ...(key === 'other_issues' && !e.target.checked ? { other_issues_notes: '' } : {}),
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
                  />
                  <span className="text-sm font-semibold text-[#111]">{label}</span>
                </label>
              ))}
            </div>
            {form.other_issues && (
              <input
                type="text"
                placeholder="Describe the issue(s)..."
                value={form.other_issues_notes}
                onChange={e => setForm(f => ({ ...f, other_issues_notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] placeholder-[#9ca3af] transition-all text-sm"
              />
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Dog Photo</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={e => setPhoto(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-lg p-8 text-center group-hover:bg-gray-50 transition-colors">
                {photo ? (
                  <p className="text-[#111] font-bold text-sm">{photo.name}</p>
                ) : (
                  <>
                    <p className="text-[#111] font-bold text-sm">Click to upload photo</p>
                    <p className="text-xs text-[#9ca3af] mt-1 uppercase tracking-widest">PNG, JPG, or WEBP (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] text-[#451a03] py-3 rounded-lg font-bold text-lg hover:bg-[#d97706] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding Dog...' : 'Post to Network'}
          </button>
        </form>
      </main>
    </div>
  )
}
