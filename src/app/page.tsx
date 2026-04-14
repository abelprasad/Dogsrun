import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Band 2: Amber Hero */}
      <section className="bg-[#fffbeb] border-bottom border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-[900] tracking-tight text-[#111] leading-tight mb-8">
                Every dog deserves a <mark style={{background: "#f59e0b", color: "#111", padding: "0 4px", borderRadius: "3px", fontStyle: "normal"}}>run</mark> to safety.
              </h1>
              <div className="flex gap-4">
                <Link href="/register" className="bg-[#111] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-black transition-colors">Get started</Link>
                <Link href="/dogs" className="border border-[#d1d5db] text-[#374151] bg-transparent font-semibold rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-colors">Browse dogs</Link>
              </div>
            </div>
            <div>
              <p className="text-base md:text-lg text-[#6b7280] leading-relaxed">
                The fastest way for animal shelters to find specialized rescues for their most urgent dogs. Real-time matching, instant alerts, and seamless communication to save more lives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: White content body */}
      <section className="bg-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shelter Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#111] mb-4">I run a shelter</h2>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
                List dogs that need rescue pulls. Get matched with the right rescue organizations instantly and track interest in real-time.
              </p>
              <Link href="/register?type=shelter" className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors">
                Register as a shelter
              </Link>
            </div>

            {/* Rescue Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#111] mb-4">I run a rescue</h2>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
                Set your rescue criteria once. Get alerted automatically when matching dogs are available at shelters near you.
              </p>
              <Link href="/register?type=rescue" className="inline-block border border-[#d1d5db] text-[#374151] bg-transparent font-semibold rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-colors">
                Register as a rescue
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
