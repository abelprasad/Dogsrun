'use client'

import { ReactNode, useState } from 'react'

interface AdminTab {
  id: string
  label: string
  count?: number
  content: ReactNode
}

export default function AdminTabs({ tabs }: { tabs: AdminTab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')
  const active = tabs.find(tab => tab.id === activeTab) ?? tabs[0]

  return (
    <div className="space-y-6">
      <div className="border-b border-[#13241d]/10">
        <div className="flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                active?.id === tab.id
                  ? 'bg-[#13241d] text-[#f4b942]'
                  : 'bg-[#fff9ef] text-[#5d6a64] hover:bg-[#13241d]/10 hover:text-[#13241d]'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-2 opacity-70">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {active?.content}
    </div>
  )
}
