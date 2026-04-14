'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface CriteriaFormProps {
  rescueId: string;
  initialCriteria?: any;
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${initialCriteria.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                {initialCriteria.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-[#f59e0b] hover:underline"
            >
              Edit Criteria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Target Breeds</h3>
              <div className="flex flex-wrap gap-2">
                {initialCriteria.breeds && initialCriteria.breeds.length > 0 ? (
                  initialCriteria.breeds.map((breed: string) => (
                    <span key={breed} className="px-3 py-1 bg-amber-50 text-[#f59e0b] text-sm font-bold rounded-lg border border-amber-100">
                      {breed}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">All breeds accepted</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location Focus</h3>
              <div className="flex flex-wrap gap-2">
                {initialCriteria.states_served && initialCriteria.states_served.length > 0 ? (
                  initialCriteria.states_served.map((state: string) => (
                    <span key={state} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-100">
                      {state}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">No specific states set</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Age</h3>
              <p className="text-xl font-bold text-gray-900">{initialCriteria.max_age_years ? `${initialCriteria.max_age_years} years` : 'Any age'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Weight</h3>
              <p className="text-xl font-bold text-gray-900">{initialCriteria.max_weight_lbs ? `${initialCriteria.max_weight_lbs} lbs` : 'Any weight'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sex Preference</h3>
              <p className="text-xl font-bold text-gray-900 capitalize">{initialCriteria.sex_preference || 'Any'}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 flex items-center gap-3">
            <div className={`w-10 h-6 rounded-full relative ${initialCriteria.accepts_mixes ? 'bg-green-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${initialCriteria.accepts_mixes ? 'left-5' : 'left-1'}`}></div>
            </div>
            <span className="font-bold text-gray-700">Accepts Mixed Breeds</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Target Breeds (comma separated)</label>
          <input
            type="text"
            placeholder="Golden Retriever, Lab, Poodle"
            value={form.breeds}
            onChange={e => setForm({ ...form, breeds: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Leave empty to match all breeds</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">States Served (comma separated)</label>
          <input
            type="text"
            placeholder="TX, CA, NY"
            value={form.states_served}
            onChange={e => setForm({ ...form, states_served: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Max Age (years)</label>
          <input
            type="number"
            placeholder="Any"
            value={form.max_age_years}
            onChange={e => setForm({ ...form, max_age_years: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Max Weight (lbs)</label>
          <input
            type="number"
            placeholder="Any"
            value={form.max_weight_lbs}
            onChange={e => setForm({ ...form, max_weight_lbs: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Sex Preference</label>
          <select
            value={form.sex_preference}
            onChange={e => setForm({ ...form, sex_preference: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 bg-white"
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
            className="w-5 h-5 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
          />
          <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Accepts Mixed Breeds</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-[#f59e0b] focus:ring-[#f59e0b]"
          />
          <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Criteria is Active</span>
        </label>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-50">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#f59e0b] text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-[#d97706] disabled:opacity-50 transform transition active:scale-[0.98]"
        >
          {loading ? 'Saving...' : 'Save Criteria'}
        </button>
        {initialCriteria && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-8 py-4 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
