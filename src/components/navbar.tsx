import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-[#111] border-b border-white/5 sticky top-0 z-50" style={{ backgroundColor: '#111' }}>
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="https://dogsrun2.powerappsportals.com/DOGSRUN Logo idea 4.PNG"
              alt="DOGSRUN logo"
              width={36}
              height={36}
              unoptimized
            />
            <span className="font-semibold tracking-wider text-white text-sm">DOGSRUN</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dogs" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">Browse Dogs</Link>
            <Link href="/about" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">About</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-[#f59e0b] text-[#451a03] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d97706] transition-colors">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
