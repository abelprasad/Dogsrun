import SignOutButton from '@/app/dashboard/sign-out-button'

interface Org {
  name: string
  approval_status: string
}

export default function ApprovalWall({ org }: { org: Org }) {
  const isRejected = org.approval_status === 'rejected'

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
          <SignOutButton />
        </div>
      </div>
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">{org.name}</h1>
          <p className="text-[#6b7280]">Portal</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-16 px-8 flex justify-center">
        <div className="max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-red-50' : 'bg-[#fffbeb]'}`}>
            {isRejected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#111] mb-3">
            {isRejected ? 'Application Not Approved' : 'Application Under Review'}
          </h2>
          <p className="text-[#6b7280] mb-6">
            {isRejected
              ? "We weren't able to verify your 501(c)(3) status. Please contact us to resubmit your documentation."
              : "Your 501(c)(3) documentation is being reviewed by our team. You'll receive an email once you're approved."}
          </p>
          {isRejected && (
            <a href="mailto:admin@dogsrun.org" className="inline-block bg-[#111] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-black transition-colors">
              Contact Us
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
