'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in...');
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      // Handle PKCE flow (?code= in URL)
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      // Listen for SIGNED_IN event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            setStatus('Loading your dashboard...');
            
            const { data: org, error } = await supabase
              .from('organizations')
              .select('type')
              .eq('email', session.user.email)
              .single()

            if (error) throw error

            if (org?.type === 'rescue') {
              router.push('/dashboard/rescue')
            } else {
              router.push('/dashboard')
            }
          } catch (err) {
            console.error('Error fetching org type:', err)
            router.push('/dashboard')
          } finally {
            subscription.unsubscribe()
          }
        }
      })

      // Check if session already exists
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: org } = await supabase
          .from('organizations')
          .select('type')
          .eq('email', session.user.email)
          .single()
        
        if (org?.type === 'rescue') {
          router.push('/dashboard/rescue')
        } else {
          router.push('/dashboard')
        }
      }
    }

    handleAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#f59e0b] mb-4 tracking-tight animate-pulse">
          DOGSRUN
        </h1>
        <p className="text-gray-500 font-medium">{status}</p>
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-amber-100 border-t-[#f59e0b] rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}