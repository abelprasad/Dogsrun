import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'DOGSRUN',
  description: 'The fastest way for animal shelters to find specialized rescues for their most urgent dogs.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'DOGSRUN — Every dog deserves a run to safety.',
    description: 'Real-time matching between shelters and rescue organizations. Instant alerts, seamless communication.',
    url: 'https://dogsrun.net',
    siteName: 'DOGSRUN',
    images: [
      {
        url: 'https://dogsrun.net/dogsrun_og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DOGSRUN',
    description: 'Real-time dog matching between shelters and rescues.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-gray-100 py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-sm">
              <div className="font-medium text-center md:text-left">
                © {new Date().getFullYear()} DOGSRUN — Dog Shelter & Rescue Unification Network
              </div>
              <div className="flex items-center gap-8 font-bold">
                <Link href="/dogs" className="hover:text-[#f59e0b] transition-colors">Browse Dogs</Link>
                <Link href="/about" className="hover:text-[#f59e0b] transition-colors">About</Link>
                <Link href="mailto:support@dogsrun.net" className="hover:text-[#f59e0b] transition-colors">Contact</Link>
              </div>
              <div className="text-gray-400 font-medium">
                EIN 993286395 | 501(c)(3) nonprofit
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
