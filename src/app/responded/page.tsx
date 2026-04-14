import Link from 'next/link'

export default function RespondedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-[#f59e0b] mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Response Received</h1>
        <p className="text-gray-500 mb-10 leading-relaxed text-lg">
          Thanks for your response. We've notified the shelter and they'll be in touch.
        </p>
        <Link 
          href="/auth/login" 
          className="inline-block w-full bg-[#f59e0b] text-white py-4 rounded-xl font-bold hover:bg-[#d97706] transition-colors"
        >
          Go to Rescue Portal
        </Link>
      </div>
    </div>
  )
}
