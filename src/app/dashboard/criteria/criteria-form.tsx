'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import BreedSelect from '@/components/breed-select';
import ColorPicker from '@/components/color-picker';
import StateMultiSelect from '@/components/state-multi-select';

interface RescueCriteria {
  id?: string;
  rescue_id?: string;
  breeds?: string[];
  colors?: string[];
  max_age_years?: number | string;
  max_weight_lbs?: number | string;
  sex_preference?: string;
  accepts_mixes?: boolean;
  states_served?: string[];
  is_active?: boolean;
  accepts_parvo?: boolean;
  accepts_tripod?: boolean;
  accepts_blind?: boolean;
  accepts_other?: boolean;
}

interface CriteriaFormProps {
  rescueId: string;
  initialCriteria?: RescueCriteria;
}

const inputClass = "w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-3 text-sm text-[#13241d] placeholder-[#5d6a64]/50 transition-all focus:border-[#f4b942] focus:outline-none focus:ring-1 focus:ring-[#f4b942]"
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]"

export default function CriteriaForm({ rescueId, initialCriteria }: CriteriaFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!initialCriteria);
  const [loading, setLoading] = useState(false);
  const [breedInput, setBreedInput] = useState('');
  const [form, setForm] = useState({
    breeds: initialCriteria?.breeds || [] as string[],
    colors: initialCriteria?.colors || [] as string[],
    max_age_years: initialCriteria?.max_age_years || '',
    max_weight_lbs: initialCriteria?.max_weight_lbs || '',
    sex_preference: initialCriteria?.sex_preference || 'any',
    accepts_mixes: initialCriteria?.accepts_mixes ?? true,
    states_served: initialCriteria?.states_served || [] as string[],
    accepts_parvo: initialCriteria?.accepts_parvo ?? false,
    accepts_tripod: initialCriteria?.accepts_tripod ?? false,
    accepts_blind: initialCriteria?.accepts_blind ?? false,
    accepts_other: initialCriteria?.accepts_other ?? false,
  });

  function addBreed(breed: string) {
    const trimmed = breed.trim()
    if (trimmed && !form.breeds.includes(trimmed)) {
      setForm(f => ({ ...f, breeds: [...f.breeds, trimmed] }))
    }
    setBreedInput('')
  }

  function removeBreed(breed: string) {
    setForm(f => ({ ...f, breeds: f.breeds.filter(b => b !== breed) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('rescue_criteria').upsert({
      rescue_id: rescueId,
      breeds: form.breeds,
      colors: form.colors.length > 0 ? form.colors : null,
      max_age_years: form.max_age_years ? parseInt(form.max_age_years.toString()) : null,
      max_weight_lbs: form.max_weight_lbs ? parseInt(form.max_weight_lbs.toString()) : null,
      sex_preference: form.sex_preference,
      accepts_mixes: form.accepts_mixes,
      states_served: form.states_served,
      is_active: true,
      accepts_parvo: form.accepts_parvo,
      accepts_tripod: form.accepts_tripod,
      accepts_blind: form.accepts_blind,
      accepts_other: form.accepts_other,
    }, { onConflict: 'rescue_id' });

    if (error) { alert('Error saving criteria: ' + error.message); }
    else { setIsEditing(false); router.refresh(); }
    setLoading(false);
  }

  // View mode
  if (!isEditing && initialCriteria) {
    return (
      <div className="border border-[#13241d]/10 bg-[#fff9ef]">
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#13241d]/10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a877f]">Active</span>
          </div>
          <button onClick={() => setIsEditing(true)} className="text-xs font-black uppercase tracking-[0.18em] text-[#d95f4b] hover:underline">
            Edit Criteria
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-[#13241d]/10 md:grid-cols-4">
          {[
            { label: 'Breeds', value: initialCriteria.breeds?.join(', ') || 'All' },
            { label: 'Colors', value: initialCriteria.colors?.join(', ') || 'All' },
            { label: 'States', value: initialCriteria.states_served?.join(', ') || 'All' },
            { label: 'Sex', value: initialCriteria.sex_preference || 'Any' },
            { label: 'Max Age', value: initialCriteria.max_age_years ? `${initialCriteria.max_age_years}y` : 'Any' },
            { label: 'Max Weight', value: initialCriteria.max_weight_lbs ? `${initialCriteria.max_weight_lbs} lbs` : 'Any' },
            { label: 'Mixes', value: initialCriteria.accepts_mixes ? 'Yes' : 'No' },
            {
              label: 'Special Needs',
              value: [
                initialCriteria.accepts_parvo && 'Parvo',
                initialCriteria.accepts_tripod && 'Tripod',
                initialCriteria.accepts_blind && 'Blind',
                initialCriteria.accepts_other && 'Other',
              ].filter(Boolean).join(', ') || 'None'
            },
          ].map(({ label, value }) => (
            <div key={label} className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a877f]">{label}</p>
              <p className="mt-1 text-sm font-black text-[#13241d] capitalize leading-6">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="border border-[#13241d]/10 bg-[#fff9ef] p-8 space-y-8">

      {/* Breeds */}
      <div>
        <label className={labelClass}>Breeds <span className="normal-case font-normal tracking-normal text-[#5d6a64]/70">- leave empty to match all</span></label>
        <div className="flex gap-2 mb-3">
          <BreedSelect value={breedInput} onChange={setBreedInput} placeholder="Search or type a breed..." className="flex-1" />
          <button
            type="button"
            onClick={() => addBreed(breedInput)}
            disabled={!breedInput.trim()}
            className="bg-[#f4b942] px-5 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {form.breeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.breeds.map(breed => (
              <span key={breed} className="flex items-center gap-1 border border-[#13241d]/15 bg-[#f5f0e8] px-3 py-1.5 text-xs font-black text-[#13241d]">
                {breed}
                <button type="button" onClick={() => removeBreed(breed)} className="ml-1 text-[#5d6a64] hover:text-red-500">x</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Colors */}
      <div>
        <ColorPicker
          selected={form.colors}
          onChange={colors => setForm(f => ({ ...f, colors }))}
          label="Colors — leave empty to accept all"
        />
      </div>

      {/* Location + Sex */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StateMultiSelect
          selected={form.states_served}
          onChange={states => setForm({ ...form, states_served: states })}
          label="States served"
        />
        <div>
          <label className={labelClass}>Sex preference</label>
          <select value={form.sex_preference} onChange={e => setForm({ ...form, sex_preference: e.target.value })} className={inputClass}>
            <option value="any">Any</option>
            <option value="male">Male only</option>
            <option value="female">Female only</option>
          </select>
        </div>
      </div>

      {/* Age + Weight */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className={labelClass}>Max age <span className="normal-case font-normal tracking-normal text-[#5d6a64]/70">(years)</span></label>
          <input type="number" placeholder="Any" value={form.max_age_years} onChange={e => setForm({ ...form, max_age_years: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Max weight <span className="normal-case font-normal tracking-normal text-[#5d6a64]/70">(lbs)</span></label>
          <input type="number" placeholder="Any" value={form.max_weight_lbs} onChange={e => setForm({ ...form, max_weight_lbs: e.target.value })} className={inputClass} />
        </div>
      </div>

      {/* Accepts mixes */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.accepts_mixes}
            onChange={e => setForm({ ...form, accepts_mixes: e.target.checked })}
            className="h-4 w-4 border-[#13241d]/20 text-[#f4b942] focus:ring-[#f4b942]"
          />
          <span className="text-sm font-black text-[#13241d]">Accept mixed breeds</span>
        </label>
      </div>

      {/* Special needs */}
      <div>
        <label className={labelClass}>Special needs we accept</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'accepts_parvo', label: 'Parvo' },
            { key: 'accepts_tripod', label: 'Tripod / Amputee' },
            { key: 'accepts_blind', label: 'Blind / Vision Impaired' },
            { key: 'accepts_other', label: 'Other Issues' },
          ].map(({ key, label }) => (
            <label key={key} className={`flex cursor-pointer items-center gap-3 border p-4 transition-all ${form[key as keyof typeof form] ? 'border-[#f4b942] bg-[#f4b942]/10' : 'border-[#13241d]/10 bg-[#f5f0e8] hover:border-[#f4b942]/50'}`}>
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={e => setForm({ ...form, [key]: e.target.checked })}
                className="h-4 w-4 border-[#13241d]/20 text-[#f4b942] focus:ring-[#f4b942]"
              />
              <span className="text-sm font-black text-[#13241d]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-[#13241d]/10 pt-6">
        <button type="submit" disabled={loading} className="flex-1 bg-[#f4b942] py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50">
          {loading ? 'Saving...' : 'Save criteria'}
        </button>
        {initialCriteria && (
          <button type="button" onClick={() => setIsEditing(false)} className="border border-[#13241d]/20 bg-[#f5f0e8] px-8 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
