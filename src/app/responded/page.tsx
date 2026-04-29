import Link from 'next/link'

export default function RespondedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
            Response Received
          </h1>
        </div>
      </header>

      <main className="py-8 px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[#6b7280] mb-10 leading-relaxed">
            Thanks for your response. We&apos;ve notified the shelter and they&apos;ll be in touch soon.
          </p>
          <Link 
            href="/dashboard/rescue" 
            className="inline-block w-full bg-[#111] text-white py-3 rounded-lg font-semibold hover:bg-black transition-colors"
          >
            Go to Rescue Portal
          </Link>
        </div>
      </main>
    </div>
  )
}
