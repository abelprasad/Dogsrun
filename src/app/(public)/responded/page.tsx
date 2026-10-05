import Link from 'next/link'

export default function RespondedPage() {
  return (
    <div className="flex min-h-[80svh] flex-col bg-[#0b140e] text-[#f8f1e8]">
      <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#7ddba3]" />
            Response received
          </p>

          <div className="mx-auto mb-8 mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#c08a3e] text-[#140a08]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-black uppercase leading-[0.88] tracking-tight">
            You&apos;re <span className="text-[#c08a3e]">in.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-8 text-[#f8f1e8]/60">
            The shelter has been notified and will reach out to you directly.
            Move fast on the details — urgent dogs don&apos;t wait.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
            >
              Log in to your rescue portal
            </Link>
            <Link
              href="/dogs"
              className="inline-flex items-center justify-center border-2 border-white/20 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-[#c08a3e] hover:text-[#c08a3e]"
            >
              Browse available dogs
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
