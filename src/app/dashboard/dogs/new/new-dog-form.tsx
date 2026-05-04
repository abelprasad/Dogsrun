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

interface Props {
  orgName: string
  isAdmin: boolean
}

export default function NewDogForm({ orgName, isAdmin }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [showSpecialNeeds, setShowSpecialNeeds] = useState(false)
  const [form, setForm] = useState<DogForm>({
    name: '', breed: '', mix: false, age_years: '', weight_lbs: '',
    sex: 'unknown', color: [], state: '', description: '',
    parvo: false, tripod: false, blind: false, other_issues: false, other_issues_notes: '',
  })

  const inputCls = "w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-3 focus:outline-none focus:border-[#f4b942] focus:ring-1 focus:ring-[#f4b942] text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
  const labelCls = "block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2"

  const field = (key: keyof DogForm, label: string, type = 'text', placeholder = '', min?: string, step?: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        min={min}
        step={step}
        className={inputCls}
      />
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.age_years !== '' && parseFloat(form.age_years) < 0) { alert('Age cannot be negative'); return }
    if (form.weight_lbs !== '' && parseFloat(form.weight_lbs) < 0) { alert('Weight cannot be negative'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data: org } = await supabase.from('organizations').select('id, name').eq('id', user.id).single()
    if (!org) { alert('No organization found. Contact support.'); setLoading(false); return }

    let photo_url = null
    if (photo) {
      const folderId = crypto.randomUUID()
      const fileName = `${folderId}/${photo.name}`
      const compressedPhoto = await imageCompression(photo, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true })
      const { error: uploadError } = await supabase.storage.from('dog-photos').upload(fileName, compressedPhoto)
      if (uploadError) { alert('Error uploading photo: ' + uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
      photo_url = publicUrl
    }

    const { data, error } = await supabase.from('dogs').insert({
      name: form.name, breed: form.breed, mix: form.mix,
      age_years: form.age_years ? parseFloat(form.age_years) : null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      sex: form.sex, color: form.color.length > 0 ? form.color : null,
      state: form.state || null, description: form.description,
      parvo: form.parvo, tripod: form.tripod, blind: form.blind,
      other_issues: form.other_issues, other_issues_notes: form.other_issues_notes,
      shelter_id: org.id, status: 'available', photo_url,
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
      router.push('/dashboard/dogs')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Subnav */}
      <div className="bg-[#13241d] py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Add Dog</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Admin</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{orgName}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">Shelter</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Add a Dog</h1>
          <p className="text-[#f5f0e8]/50 mt-2 text-sm">Help this dog find the perfect rescue match.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-8">
        <form onSubmit={handleSubmit} className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('name', 'Dog Name', 'text', 'Buddy')}
            <div>
              <label className={labelCls}>Primary Breed</label>
              <BreedSelect value={form.breed} onChange={val => setForm(f => ({ ...f, breed: val }))} placeholder="Search or type breed..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field('age_years', 'Age (years)', 'number', '2', '0', '0.1')}
            {field('weight_lbs', 'Weight (lbs)', 'number', '45', '0', '1')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Sex</label>
              <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>State</label>
              <StateSelect value={form.state} onChange={val => setForm(f => ({ ...f, state: val }))} />
            </div>
          </div>

          <ColorPicker selected={form.color} onChange={colors => setForm(f => ({ ...f, color: colors }))} label="Color(s)" />

          <label className="flex items-center gap-3 p-4 bg-[#f5f0e8] cursor-pointer">
            <input type="checkbox" id="mix" checked={form.mix} onChange={e => setForm(f => ({ ...f, mix: e.target.checked }))}
              className="w-4 h-4 border-[#13241d]/30 text-[#13241d] focus:ring-[#13241d]" />
            <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d]">Mixed breed dog</span>
          </label>

          <div>
            <label className={labelCls}>Description & Medical Notes</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any relevant info about behavior, medical needs, or urgency..."
              rows={4} className={inputCls + ' resize-none'} />
          </div>

          {/* Special needs */}
          <div className="space-y-4">
            <button type="button" onClick={() => setShowSpecialNeeds(!showSpecialNeeds)}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64] hover:text-[#13241d] transition-colors">
              <span className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${showSpecialNeeds ? 'border-[#13241d] bg-[#13241d]' : 'border-[#13241d]/30'}`}>
                {showSpecialNeeds && <svg className="w-2.5 h-2.5 text-[#f4b942]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round"/></svg>}
              </span>
              This dog has special needs
            </button>
            {showSpecialNeeds && (
              <div className="space-y-4 pl-6 border-l-2 border-[#13241d]/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'parvo', label: 'Parvo' },
                    { key: 'tripod', label: 'Tripod / Amputee' },
                    { key: 'blind', label: 'Blind / Vision Impaired' },
                    { key: 'other_issues', label: 'Other Issues' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-[#13241d]/10 bg-[#f5f0e8] cursor-pointer">
                      <input type="checkbox" checked={form[key as keyof DogForm] as boolean}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked, ...(key === 'other_issues' && !e.target.checked ? { other_issues_notes: '' } : {}) }))}
                        className="w-4 h-4 border-[#13241d]/30 text-[#13241d] focus:ring-[#13241d]" />
                      <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d]">{label}</span>
                    </label>
                  ))}
                </div>
                {form.other_issues && (
                  <input type="text" placeholder="Describe the issue(s)..." value={form.other_issues_notes}
                    onChange={e => setForm(f => ({ ...f, other_issues_notes: e.target.value }))} className={inputCls} />
                )}
              </div>
            )}
          </div>

          {/* Photo upload */}
          <div>
            <label className={labelCls}>Dog Photo</label>
            <div className="relative group">
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed border-[#13241d]/20 bg-[#f5f0e8] p-8 text-center group-hover:border-[#13241d]/40 transition-colors">
                {photo ? (
                  <p className="text-[#13241d] font-bold text-sm">{photo.name}</p>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d]">Click to upload photo</p>
                    <p className="text-xs text-[#5d6a64] mt-1">PNG, JPG, or WEBP · Max 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#13241d] text-[#f4b942] py-4 font-black text-xs uppercase tracking-[0.24em] hover:bg-[#1a2e1a] disabled:opacity-50 transition-colors">
            {loading ? 'Adding Dog...' : 'Post to Network'}
          </button>
        </form>
      </main>
    </div>
  )
}
