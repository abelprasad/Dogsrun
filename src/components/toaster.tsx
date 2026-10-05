'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error'
interface Toast { id: number; kind: ToastKind; message: string }

const ToastCtx = createContext<{ success: (m: string) => void; error: (m: string) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  function push(kind: ToastKind, message: string) {
    const id = ++idRef.current
    setToasts(prev => [...prev.slice(-2), { id, kind, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  return (
    <ToastCtx.Provider value={{ success: m => push('success', m), error: m => push('error', m) }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-[100] flex w-[calc(100%-3rem)] max-w-sm flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`border-l-4 px-4 py-3 text-sm font-semibold shadow-lg ${t.kind === 'success'
              ? 'border-[#c08a3e] bg-[#13241d] text-[#c08a3e]'
              : 'border-red-400 bg-[#7f1d1d] text-white'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
