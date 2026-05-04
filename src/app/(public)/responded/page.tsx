import Link from 'next/link'

export default function RespondedPage() {
  return (
    <div className="min-h-screen bg-[#f8f1e8]">
      <header className="bg-[#13241d] border-b border-[#f4b942]/30 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#f8f1e8] mb-4">
            You&apos;re Interested
          </h1>
        </div>
      </header>
      <main className="py-8 px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#fffaf2] border border-[#13241d]/15 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#13241d] flex items-center justify-center mx-auto mb-6 text-[#f4b942]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[#5d6a64] mb-8 leading-relaxed">
            The shelter has been notified and will reach out to you directly.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-[#13241d] text-[#f4b942] py-3 rounded-lg font-semibold hover:bg-[#1f332a] transition-colors text-sm"
            >
              Log in to your rescue portal
            </Link>
            <Link
              href="/dogs"
              className="block w-full border border-[#13241d]/20 text-[#13241d] py-3 rounded-lg font-semibold hover:bg-[#f8f1e8] transition-colors text-sm"
            >
              Browse available dogs
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
