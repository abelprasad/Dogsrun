'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import BreedSelect from '@/components/breed-select';
import ColorPicker from '@/components/color-picker';
import StateSelect from '@/components/state-select';

interface Dog {
  id: string;
  name: string;
  breed: string;
  mix: boolean;
  age_years: number | null;
  weight_lbs: number | null;
  sex: string;
  color: string[] | null;
  state: string | null;
  description: string;
  photo_url: string | null;
  status: string;
  parvo: boolean;
  tripod: boolean;
  blind: boolean;
  other_issues: boolean;
  other_issues_notes: string;
  euthanasia_date: string | null;
}

interface EditDogFormProps {
  dog: Dog;
}

export default function EditDogForm({ dog }: EditDogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: dog.name || '',
    breed: dog.breed || '',
    mix: dog.mix || false,
    age_years: dog.age_years?.toString() || '',
    weight_lbs: dog.weight_lbs?.toString() || '',
    sex: dog.sex || 'unknown',
    color: dog.color || [] as string[],
    state: dog.state || '',
    description: dog.description || '',
    parvo: dog.parvo || false,
    tripod: dog.tripod || false,
    blind: dog.blind || false,
    other_issues: dog.other_issues || false,
    other_issues_notes: dog.other_issues_notes || '',
    euthanasia_date: dog.euthanasia_date ? dog.euthanasia_date.split('T')[0] : '',
  });

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '', min?: string) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string | number}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        min={min}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] placeholder-[#9ca3af] transition-all text-sm"
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.age_years && parseFloat(form.age_years) < 0) {
      alert('Age cannot be negative');
      return;
    }
    if (form.weight_lbs && parseFloat(form.weight_lbs) < 0) {
      alert('Weight cannot be negative');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    let photo_url = dog.photo_url;

    if (photo) {
      const folderId = crypto.randomUUID();
      const fileName = `${folderId}/${photo.name}`;
      const compressedPhoto = await imageCompression(photo, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, compressedPhoto);
      if (uploadError) {
        alert('Error uploading photo: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);
      photo_url = publicUrl;
    }

    const response = await fetch('/api/dogs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dog_id: dog.id,
        ...form,
        color: form.color.length > 0 ? form.color : null,
        state: form.state || null,
        euthanasia_date: form.euthanasia_date || null,
        photo_url,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Failed to update dog');
    } else {
      router.push('/dashboard/dogs');
      router.refresh();
    }
    setLoading(false);
  };

  return (
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
        {field('age_years', 'Age (years)', 'number', '2', '0')}
        {field('weight_lbs', 'Weight (lbs)', 'number', '45', '0')}
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

      <div className="space-y-3 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <div>
          <label className="block text-sm font-bold text-amber-800 mb-1">⚠ Euthanasia Date</label>
          <p className="text-xs text-amber-700 mb-3">If this dog is at risk of euthanasia, set the date. A countdown will appear on their profile and in your dog list.</p>
          <input
            type="date"
            value={form.euthanasia_date}
            onChange={e => setForm(f => ({ ...f, euthanasia_date: e.target.value }))}
            className="w-full border border-amber-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-[#111] transition-all text-sm bg-white"
          />
        </div>
        {form.euthanasia_date && (
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, euthanasia_date: '' }))}
            className="text-xs font-semibold text-amber-700 hover:text-red-600 transition-colors"
          >
            Clear date
          </button>
        )}
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
                checked={form[key as keyof typeof form] as boolean}
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
        {dog.photo_url && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-100 mb-4">
            <img src={dog.photo_url} alt={dog.name} className="object-cover w-full h-full" />
          </div>
        )}
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
                <p className="text-[#111] font-bold text-sm">Click to upload new photo</p>
                <p className="text-xs text-[#9ca3af] mt-1 uppercase tracking-widest">PNG, JPG, or WEBP (Max 5MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f59e0b] text-[#451a03] py-3 rounded-lg font-bold text-lg hover:bg-[#d97706] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
        <Link
          href="/dashboard/dogs"
          className="block text-center text-sm font-semibold text-[#6b7280] hover:text-[#111] transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
