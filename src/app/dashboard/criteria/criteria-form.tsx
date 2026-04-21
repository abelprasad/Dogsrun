'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface RescueCriteria {
  id?: string;
  rescue_id?: string;
  breeds?: string[];
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

export default function CriteriaForm({ rescueId, initialCriteria }: CriteriaFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!initialCriteria);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    breeds: initialCriteria?.breeds?.join(', ') || '',
    max_age_years: initialCriteria?.max_age_years || '',
    max_weight_lbs: initialCriteria?.max_weight_lbs || '',
    sex_preference: initialCriteria?.sex_preference || 'any',
    accepts_mixes: initialCriteria?.accepts_mixes ?? true,
    states_served: initialCriteria?.states_served?.join(', ') || '',
    is_active: initialCriteria?.is_active ?? true,
    accepts_parvo: initialCriteria?.accepts_parvo ?? false,
    accepts_tripod: initialCriteria?.accepts_tripod ?? false,
    accepts_blind: initialCriteria?.accepts_blind ?? false,
    accepts_other: initialCriteria?.accepts_other ?? false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const payload = {
      rescue_id: rescueId,
      breeds: form.breeds.split(',').map((s: string) => s.trim()).filter(Boolean),
      max_age_years: form.max_age_years ? parseInt(form.max_age_years.toString()) : null,
      max_weight_lbs: form.max_weight_lbs ? parseInt(form.max_weight_lbs.toString()) : null,
      sex_preference: form.sex_preference,
      accepts_mixes: form.accepts_mixes,
      states_served: form.states_served.split(',').map((s: string) => s.trim()).filter(Boolean),
      is_active: form.is_active,
      accepts_parvo: form.accepts_parvo,
      accepts_tripod: form.accepts_tripod,
      accepts_blind: form.accepts_blind,
      accepts_other: form.accepts_other,
    };

    const { error } = await supabase
      .from('rescue_criteria')
      .upsert(payload, { onConflict: 'rescue_id' });

    if (error) {
      alert('Error saving criteria: ' + error.message);
    } else {
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!isEditing && initialCriteria) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-none">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${initialCriteria.is_active ? 'bg-[#166534]' : 'bg-[#6b7280]'}`}></div>
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                {initialCriteria.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-[#f59e0b] hover:underline transition-colors"
            >
              Edit Criteria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Target Breeds</h3>
              <div className="flex flex-wrap gap-2">
                {initialCriteria.breeds && initialCriteria.breeds.length > 0 ? (
                  initialCriteria.breeds.map((breed: string) => (
                    <span key={breed} className="px-3 py-1 bg-[#fffbeb] text-[#451a03] text-xs font-bold rounded border border-gray-100">
                      {breed}
                    </span>
                  ))
                ) : (
                  <span className="text-[#6b7280] text-sm italic">All breeds accepted</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Location Focus</h3>
              <div className="flex flex-wrap gap-2">
                {initialCriteria.states_served && initialCriteria.states_served.length > 0 ? (
                  initialCriteria.states_served.map((state: string) => (
                    <span key={state} className="px-3 py-1 bg-gray-50 text-[#111] text-xs font-bold rounded border border-gray-100">
                      {state}
                    </span>
                  ))
                ) : (
                  <span className="text-[#6b7280] text-sm italic">No specific states set</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
            <div>
              <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Max Age</h3>
              <p className="text-lg font-bold text-[#111]">{initialCriteria.max_age_years ? `${initialCriteria.max_age_years} years` : 'Any age'}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Max Weight</h3>
              <p className="text-lg font-bold text-[#111]">{initialCriteria.max_weight_lbs ? `${initialCriteria.max_weight_lbs} lbs` : 'Any weight'}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Sex Preference</h3>
              <p className="text-lg font-bold text-[#111] capitalize">{initialCriteria.sex_preference || 'Any'}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50">
            <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Special Needs We Accept</h3>
            <div className="flex flex-wrap gap-4">
              {initialCriteria.accepts_parvo && (
                <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">Parvo</span>
              )}
              {initialCriteria.accepts_tripod && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">Tripod / Amputee</span>
              )}
              {initialCriteria.accepts_blind && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-100">Blind / Vision Impaired</span>
              )}
              {initialCriteria.accepts_other && (
                <span className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-bold rounded border border-gray-100">Other Issues</span>
              )}
              {!initialCriteria.accepts_parvo && !initialCriteria.accepts_tripod && !initialCriteria.accepts_blind && !initialCriteria.accepts_other && (
                <span className="text-[#6b7280] text-sm italic">None specified</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-8 space-y-8 shadow-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Breeds (comma separated)</label>
          <input
            type="text"
            placeholder="Golden Retriever, Lab, Poodle"
            value={form.breeds}
            onChange={e => setForm({ ...form, breeds: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
          />
          <p className="text-[10px] text-[#9ca3af] mt-1 uppercase tracking-widest font-bold">Leave empty to match all breeds</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">States Served (comma separated)</label>
          <input
            type="text"
            placeholder="TX, CA, NY"
            value={form.states_served}
            onChange={e => setForm({ ...form, states_served: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Age (years)</label>
          <input
            type="number"
            placeholder="Any"
            value={form.max_age_years}
            onChange={e => setForm({ ...form, max_age_years: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Weight (lbs)</label>
          <input
            type="number"
            placeholder="Any"
            value={form.max_weight_lbs}
            onChange={e => setForm({ ...form, max_weight_lbs: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sex Preference</label>
          <select
            value={form.sex_preference}
            onChange={e => setForm({ ...form, sex_preference: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] bg-white text-sm"
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.accepts_mixes}
            onChange={e => setForm({ ...form, accepts_mixes: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
          />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111] transition-colors">Accepts Mixed Breeds</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
          />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111] transition-colors">Criteria is Active</span>
        </label>
      </div>

      <div className="space-y-4 pt-8 border-t border-gray-50">
        <h3 className="text-sm font-bold text-[#111]">Special Needs We Accept</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
            <input
              type="checkbox"
              checked={form.accepts_parvo}
              onChange={e => setForm({ ...form, accepts_parvo: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">We accept dogs with Parvo</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
            <input
              type="checkbox"
              checked={form.accepts_tripod}
              onChange={e => setForm({ ...form, accepts_tripod: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">We accept Tripod / Amputee dogs</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
            <input
              type="checkbox"
              checked={form.accepts_blind}
              onChange={e => setForm({ ...form, accepts_blind: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">We accept Blind / Vision Impaired dogs</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
            <input
              type="checkbox"
              checked={form.accepts_other}
              onChange={e => setForm({ ...form, accepts_other: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
            />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">We accept dogs with Other Issues</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-50">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#111] text-white py-2.5 rounded-lg font-semibold hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Criteria'}
        </button>
        {initialCriteria && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-8 py-2.5 border border-gray-300 text-[#374151] bg-transparent font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
