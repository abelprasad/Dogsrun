import Link from "next/link";
import Image from "next/image";
import { dashboardPathFor, getAuthContext } from "@/lib/auth-context";

export default async function Navbar() {
  const { user, org, isAdmin } = await getAuthContext();
  const signedInHref = dashboardPathFor(org, isAdmin);
  const signedInLabel = isAdmin && !org ? "Admin" : "Dashboard";

  return (
    <nav className="bg-[#111] border-b border-white/5 sticky top-0 z-50" style={{ backgroundColor: '#111' }}>
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="DOGSRUN logo"
              width={36}
              height={36}
              unoptimized
            />
            <div>
              <span className="font-semibold tracking-wider text-white text-sm block">DOGSRUN</span>
              <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">Loyalty Repaid</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dogs" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">Browse</Link>
            <Link href="/about" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">About</Link>
            <Link href="/faq" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">FAQ</Link>
            <Link href="/contact" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">Contact</Link>
            <Link href="/merch" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">Shop</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <Link
              href={signedInHref}
              className="bg-[#f59e0b] text-[#451a03] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d97706] transition-colors"
            >
              {signedInLabel}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] transition-colors">
                Login
              </Link>
              <Link href="/register" className="bg-[#f59e0b] text-[#451a03] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d97706] transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
