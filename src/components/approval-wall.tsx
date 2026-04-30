import SignOutButton from '@/app/dashboard/sign-out-button'

interface Org {
  name: string
  approval_status: string
}

export default function ApprovalWall({ org }: { org: Org }) {
  const isRejected = org.approval_status === 'rejected'

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <div className="bg-[#13241d] border-b border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
          <SignOutButton />
        </div>
      </div>

      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942]">{org.name}</h1>
          <p className="mt-3 text-[#c8d3ce]">Portal</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8 flex justify-center">
        <div className="max-w-md w-full border border-[#13241d]/10 bg-[#fff9ef] p-10 text-center">
          <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${isRejected ? 'bg-red-100' : 'bg-[#f4b942]'}`}>
            {isRejected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#13241d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-black text-[#13241d] mb-3">
            {isRejected ? 'Application Not Approved' : 'Application Under Review'}
          </h2>
          <p className="text-[#5d6a64] mb-8 leading-7">
            {isRejected
              ? "We weren't able to verify your 501(c)(3) status. Please contact us to resubmit your documentation."
              : "Your 501(c)(3) documentation is being reviewed by our team. You'll receive an email once you're approved."}
          </p>
          {isRejected && (
            <a
              href="mailto:admin@dogsrun.org"
              className="inline-flex items-center justify-center bg-[#f4b942] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]"
            >
              Contact Us
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
