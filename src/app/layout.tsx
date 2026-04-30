import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    url: 'https://dogsrun.org',
    siteName: 'DOGSRUN',
    images: [
      {
        url: 'https://dogsrun.org/dogsrun_og-image.png',
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
      <body className="min-h-full flex flex-col bg-white">
        {children}
      </body>
    </html>
  );
}
