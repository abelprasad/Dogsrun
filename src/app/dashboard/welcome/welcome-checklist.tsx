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
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-[#6b7280] whitespace-nowrap">
          {completedCount} / {steps.length} done
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-10">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex gap-5 p-6 rounded-xl border transition-all ${
              step.done
                ? 'bg-gray-50 border-gray-100 opacity-60'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Number / check */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              step.done
                ? 'bg-green-100 text-green-600'
                : 'bg-[#fffbeb] text-[#f59e0b]'
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
              <p className={`font-bold mb-1 ${step.done ? 'text-[#6b7280] line-through' : 'text-[#111]'}`}>
                {step.label}
              </p>
              <p className="text-sm text-[#9ca3af] mb-3">{step.description}</p>
              {!step.done && step.href && step.cta && (
                <Link
                  href={step.href}
                  className="inline-block px-4 py-1.5 bg-[#111] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
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
          className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors"
        >
          Go to Dashboard
        </Link>
        <button
          onClick={dismiss}
          className="text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          Don&apos;t show this again
        </button>
      </div>
    </div>
  )
}
