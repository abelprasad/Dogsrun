import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {children}
      </main>
      <footer className="bg-[#111] border-t border-white/5 py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Image
                src="https://dogsrun2.powerappsportals.com/DOGSRUN Logo idea 4.PNG"
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
            </div>
            <div className="text-[#6b7280] text-xs font-medium">
              © {new Date().getFullYear()} DOGSRUN | 501(c)(3) nonprofit
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
