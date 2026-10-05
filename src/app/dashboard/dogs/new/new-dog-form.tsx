'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import BreedSelect from '@/components/breed-select'
import ColorPicker from '@/components/color-picker'
import StateSelect from '@/components/state-select'
import { useToast } from '@/components/toaster'
import { reportError } from '@/lib/friendly-error'
import { uploadDogPhoto } from '@/lib/upload-photo'

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
  intake_date: string;
  euthanasia_date: string;
}

export default function NewDogForm() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ age_years?: string; weight_lbs?: string }>({})
  const [showSpecialNeeds, setShowSpecialNeeds] = useState(false)
  const [form, setForm] = useState<DogForm>({
    name: '', breed: '', mix: false, age_years: '', weight_lbs: '',
    sex: 'unknown', color: [], state: '', description: '',
    parvo: false, tripod: false, blind: false, other_issues: false, other_issues_notes: '',
    intake_date: '', euthanasia_date: '',
  })

  const inputCls = "w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-3 focus:outline-none focus:border-[#c08a3e] focus:ring-1 focus:ring-[#c08a3e] text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
  const labelCls = "block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.age_years !== '' && parseFloat(form.age_years) < 0) { setFieldErrors({ age_years: 'Age cannot be negative' }); return }
    if (form.weight_lbs !== '' && parseFloat(form.weight_lbs) < 0) { setFieldErrors({ weight_lbs: 'Weight cannot be negative' }); return }
    setFieldErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/auth/login')

    const { data: org } = await supabase.from('organizations').select('id, name').eq('id', user.id).single()
    if (!org) { toast.error('No organization found. Contact support.'); setLoading(false); return }

    let photo_url = null
    if (photo) {
      const { url, error: uploadError } = await uploadDogPhoto(supabase, photo)
      if (uploadError) { toast.error(reportError(uploadError, "Couldn't upload photo — try again.")); setLoading(false); return }
      photo_url = url
    }

    const { data, error } = await supabase.from('dogs').insert({
      name: form.name, breed: form.breed, mix: form.mix,
      age_years: form.age_years ? parseFloat(form.age_years) : null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      sex: form.sex, color: form.color.length > 0 ? form.color : null,
      state: form.state || null, description: form.description,
      parvo: form.parvo, tripod: form.tripod, blind: form.blind,
      other_issues: form.other_issues, other_issues_notes: form.other_issues_notes,
      intake_date: form.intake_date || null,
      euthanasia_date: form.euthanasia_date || null,
      shelter_id: org.id, status: 'available', photo_url,
    }).select().single()

    if (error) {
      toast.error(reportError(error, "Couldn't add dog — try again."))
    } else {
      if (data) {
        // M-F2: check alert response — don't silently fail to notify rescues
        try {
          const alertRes = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dog_id: data.id }),
          })
          if (!alertRes.ok) {
            toast.error('Dog posted, but rescue alerts failed to send — please retry from the dog page.')
          }
        } catch {
          toast.error('Dog posted, but rescue alerts failed to send — please retry from the dog page.')
        }
      }
      router.push('/dashboard/dogs')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <main className="max-w-3xl mx-auto py-10 px-8">
        <form onSubmit={handleSubmit} className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-dog-name" className={labelCls}>Dog Name</label>
              <input
                id="new-dog-name"
                type="text"
                placeholder="Buddy"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="new-primary-breed" className={labelCls}>Primary Breed</label>
              <BreedSelect id="new-primary-breed" value={form.breed} onChange={val => setForm(f => ({ ...f, breed: val }))} placeholder="Search or type breed..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-age-years" className={labelCls}>Age (years)</label>
              <input
                id="new-age-years"
                type="number"
                placeholder="2"
                value={form.age_years}
                onChange={e => { setForm(f => ({ ...f, age_years: e.target.value })); setFieldErrors(f => ({ ...f, age_years: undefined })) }}
                min="0"
                step="0.1"
                className={inputCls}
              />
              {fieldErrors.age_years && <p className="mt-1.5 text-xs font-bold text-red-600">{fieldErrors.age_years}</p>}
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-[#5d6a64]/60 font-bold">
                Use decimals for puppies — e.g. 0.5 for 6 months, 1.5 for 18 months
              </p>
            </div>
            <div>
              <label htmlFor="new-weight-lbs" className={labelCls}>Weight (lbs)</label>
              <input
                id="new-weight-lbs"
                type="number"
                placeholder="45"
                value={form.weight_lbs}
                onChange={e => { setForm(f => ({ ...f, weight_lbs: e.target.value })); setFieldErrors(f => ({ ...f, weight_lbs: undefined })) }}
                min="0"
                step="1"
                className={inputCls}
              />
              {fieldErrors.weight_lbs && <p className="mt-1.5 text-xs font-bold text-red-600">{fieldErrors.weight_lbs}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-sex" className={labelCls}>Sex</label>
              <select id="new-sex" value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-state" className={labelCls}>State</label>
              <StateSelect id="new-state" value={form.state} onChange={val => setForm(f => ({ ...f, state: val }))} />
            </div>
          </div>

          {/* Intake & Euthanasia dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="new-date-brought-to-shelter" className={labelCls}>Date Brought to Shelter</label>
              <input
                id="new-date-brought-to-shelter"
                type="date"
                value={form.intake_date}
                onChange={e => setForm(f => ({ ...f, intake_date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="new-euthanasia-date" className={labelCls}>
                Euthanasia Date
                <span className="ml-2 normal-case tracking-normal font-normal text-[#5d6a64]">(if applicable)</span>
              </label>
              <input
                id="new-euthanasia-date"
                type="date"
                value={form.euthanasia_date}
                onChange={e => setForm(f => ({ ...f, euthanasia_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={`${inputCls} ${form.euthanasia_date ? 'border-red-400 focus:border-red-500 focus:ring-red-400' : ''}`}
              />
              {form.euthanasia_date && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold">
                  ⚠ This dog will be marked at-risk and shown as urgent to rescues.
                </p>
              )}
            </div>
          </div>

          <ColorPicker id="new-colors" selected={form.color} onChange={colors => setForm(f => ({ ...f, color: colors }))} label="Color(s)" />

          <label htmlFor="mix" className="flex items-center gap-3 p-4 bg-[#f5f0e8] cursor-pointer">
            <input type="checkbox" id="mix" checked={form.mix} onChange={e => setForm(f => ({ ...f, mix: e.target.checked }))}
              className="w-4 h-4 border-[#13241d]/30 text-[#13241d] focus:ring-[#13241d]" />
            <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d]">Mixed breed dog</span>
          </label>

          <div>
            <label htmlFor="new-description-medical-notes" className={labelCls}>Description & Medical Notes</label>
            <textarea id="new-description-medical-notes" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any relevant info about behavior, medical needs, or urgency..."
              rows={4} className={inputCls + ' resize-none'} />
          </div>

          {/* Special needs */}
          <div className="space-y-4">
            <button type="button" onClick={() => setShowSpecialNeeds(!showSpecialNeeds)}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64] hover:text-[#13241d] transition-colors">
              <span className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${showSpecialNeeds ? 'border-[#13241d] bg-[#13241d]' : 'border-[#13241d]/30'}`}>
                {showSpecialNeeds && <svg className="w-2.5 h-2.5 text-[#c08a3e]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round"/></svg>}
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
            <label htmlFor="new-dog-photo" className={labelCls}>Dog Photo</label>
            <div className="relative group">
              <input id="new-dog-photo" type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)}
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
            className="w-full bg-[#13241d] text-[#c08a3e] py-4 font-black text-xs uppercase tracking-[0.24em] hover:bg-[#1a2e1a] disabled:opacity-50 transition-colors">
            {loading ? 'Adding Dog...' : 'Post to Network'}
          </button>
        </form>
      </main>
    </div>
  )
}