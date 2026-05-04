'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Step {
  id: string
  label: string
  description: string
  href?: string
  cta?: string
  done: boolean
}

interface Props {
  orgType: 'shelter' | 'rescue'
  orgId: string
  approvalStatus: string
  hasDogs: boolean
  hasCriteria: boolean
  dashboardHref: string
}

const DISMISS_KEY = (orgId: string) => `dogsrun_welcome_dismissed_${orgId}`

export default function WelcomeChecklist({
  orgType,
  orgId,
  approvalStatus,
  hasDogs,
  hasCriteria,
  dashboardHref,
}: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY(orgId)) === 'true') {
      router.replace(dashboardHref)
    }
  }, [orgId, dashboardHref, router])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY(orgId), 'true')
    setDismissed(true)
    router.replace(dashboardHref)
  }

  const shelterSteps: Step[] = [
    {
      id: 'add_dog',
      label: 'Add your first dog',
      description: 'List a dog available for rescue. Include a photo, breed, age, and any special needs.',
      href: '/dashboard/dogs/new',
      cta: 'Add a Dog',
      done: hasDogs,
    },
    {
      id: 'send_alert',
      label: 'Send your first alert',
      description: 'Once a dog is listed, go to their profile and trigger an alert to notify matching rescue orgs.',
      href: '/dashboard',
      cta: 'Go to Dashboard',
      done: false,
    },
  ]

  const rescueSteps: Step[] = [
    {
      id: 'approval',
      label: 'Get approved',
      description: 'Your 501(c)(3) documentation is under review. You\'ll receive an email once approved.',
      done: approvalStatus === 'approved',
    },
    {
      id: 'criteria',
      label: 'Set your matching criteria',
      description: 'Tell us what kinds of dogs your rescue can take — breed, age, weight, special needs, and more.',
      href: '/dashboard/criteria',
      cta: 'Set Criteria',
      done: hasCriteria,
    },
    {
      id: 'alerts',
      label: 'Wait for dog matches',
      description: 'Once approved and criteria are set, you\'ll receive email alerts when a matching dog is listed.',
      done: false,
    },
  ]

  const steps = orgType === 'shelter' ? shelterSteps : rescueSteps
  const completedCount = steps.filter(s => s.done).length

  if (dismissed) return null

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-2 bg-[#13241d]/10 overflow-hidden">
          <div
            className="h-full bg-[#f4b942] transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-[#5d6a64] whitespace-nowrap">
          {completedCount} / {steps.length} done
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-10">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex gap-5 p-6 rounded-lg border transition-all ${
              step.done
                ? 'bg-[#efe7dc] border-[#13241d]/10 opacity-70'
                : 'bg-[#fffaf2] border-[#13241d]/15'
            }`}
          >
            {/* Number / check */}
            <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              step.done
                ? 'bg-[#dbe7d6] text-[#2f5d3a]'
                : 'bg-[#13241d] text-[#f4b942]'
            }`}>
              {step.done ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-bold mb-1 ${step.done ? 'text-[#5d6a64] line-through' : 'text-[#13241d]'}`}>
                {step.label}
              </p>
              <p className="text-sm text-[#5d6a64] mb-3">{step.description}</p>
              {!step.done && step.href && step.cta && (
                <Link
                  href={step.href}
                  className="inline-block px-4 py-1.5 bg-[#13241d] text-[#f8f1e8] text-xs font-bold hover:bg-[#1f332a] transition-colors"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href={dashboardHref}
          className="inline-block bg-[#f4b942] text-[#13241d] font-semibold px-5 py-2.5 hover:bg-[#e3a72c] transition-colors"
        >
          Go to Dashboard
        </Link>
        <button
          onClick={dismiss}
          className="text-sm text-[#5d6a64] hover:text-[#13241d] transition-colors"
        >
          Don&apos;t show this again
        </button>
      </div>
    </div>
  )
}
