import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'DOGSRUN',
  description: 'The fastest way for animal shelters to find specialized rescues for their most urgent dogs.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'DOGSRUN — Every dog deserves a run to safety.',
    description: 'Real-time matching between shelters and rescue organizations. Instant alerts, seamless communication.',
    url: 'https://dogsrun.org',
    siteName: 'DOGSRUN',
    images: [{ url: 'https://dogsrun.org/dogsrun_og_image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'DOGSRUN', description: 'Real-time dog matching between shelters and rescues.' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-[#111] border-t border-white/5 py-8 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="DOGSRUN logo"
                  width={36}
                  height={36}
                  unoptimized
                />
                <div>
                  <span className="font-semibold tracking-wider text-white text-sm uppercase block">DOGSRUN</span>
                  <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">Loyalty Repaid</span>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <Link href="/dogs" className="text-sm font-medium text-[#9ca3af] hover:text-white transition-colors">Browse Dogs</Link>
                <Link href="/about" className="text-sm font-medium text-[#9ca3af] hover:text-white transition-colors">About</Link>
                <Link href="/faq" className="text-sm font-medium text-[#9ca3af] hover:text-white transition-colors">FAQ</Link>
                <Link href="/contact" className="text-sm font-medium text-[#9ca3af] hover:text-white transition-colors">Contact</Link>
                <Link href="/merch" className="text-sm font-medium text-[#9ca3af] hover:text-white transition-colors">Shop</Link>
              </div>
              <div className="text-[#6b7280] text-xs font-medium">
                © {new Date().getFullYear()} DOGSRUN | 501(c)(3) nonprofit
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
