import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  image: string;
  imageAlt: string;
  eyebrow: string;
  headline: ReactNode;
  copy: string;
  stats?: Array<[string, string]>;
  urgentNote?: string;
  children: ReactNode;
}

// Dark form input: near-black field, amber focus ring.
export const authInputClass =
  "w-full px-4 py-3 border border-white/15 bg-white/[0.04] text-[#f8f1e8] placeholder-[#f8f1e8]/30 text-sm outline-none transition-colors focus:border-[#c08a3e] focus:bg-white/[0.07] focus:ring-1 focus:ring-[#c08a3e]/40";

export const authLabelClass =
  "block text-[11px] uppercase tracking-[0.24em] font-bold text-[#f8f1e8]/60 mb-2";

export const authErrorClass =
  "p-4 bg-[#a8583f]/10 border border-[#a8583f]/40 text-[#c98a7a] text-sm font-semibold mb-6";

const networkStats: Array<[string, string]> = [
  ["1-click", "rescue response"],
  ["24/7", "matching, always on"],
  ["50+", "states in the network"],
];

// Split layout for auth pages: mission panel (imagery + massive type) on one
// side, the form on the other. Collapses to a compact banner + form on mobile.
export default function AuthShell({
  image,
  imageAlt,
  eyebrow,
  headline,
  copy,
  stats = networkStats,
  urgentNote,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b140e] text-[#f8f1e8] lg:flex-row">
      {/* ── Mission panel ── */}
      <aside className="relative flex min-h-[46svh] flex-col justify-end overflow-hidden lg:min-h-screen lg:w-[52%]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover object-center"
          sizes="(min-width: 1024px) 52vw, 100vw"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e] via-[#0b140e]/40 to-[#0b140e]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b140e]/60 via-transparent to-transparent" />

        <div className="relative px-6 pb-10 pt-28 sm:px-10 lg:px-14 lg:pb-16">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            {eyebrow}
          </div>
          <h1 className="text-[clamp(2.6rem,6vw,5.5rem)] font-black uppercase leading-[0.88] tracking-tight">
            {headline}
          </h1>
          <p className="mt-6 max-w-md text-base font-medium leading-7 text-[#f8f1e8]/80 sm:text-lg">
            {copy}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map(([big, small]) => (
              <div key={small}>
                <p className="text-3xl font-black tracking-tight text-[#c08a3e] lg:text-4xl">
                  {big}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f8f1e8]/50">
                  {small}
                </p>
              </div>
            ))}
          </div>
          {urgentNote && (
            <p className="animate-urgent-glow mt-8 inline-block border border-[#a8583f]/60 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#c98a7a]">
              {urgentNote}
            </p>
          )}
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-block text-xs font-black uppercase tracking-[0.3em] text-[#c08a3e] transition hover:text-[#d4a050]"
          >
            DOGSRUN
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
