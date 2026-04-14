import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      {/* Band 2: Amber Hero */}
      <section className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8 min-h-[320px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-[900] tracking-tight text-[#111] leading-tight mb-8">
                Every dog deserves a <mark style={{background: "#f59e0b", color: "#111", padding: "0 4px", borderRadius: "3px", fontStyle: "normal"}}>run</mark> to safety.
              </h1>
              <p className="text-base md:text-lg text-[#6b7280] leading-relaxed mb-8">
                The fastest way for animal shelters to find specialized rescues for their most urgent dogs. Real-time matching, instant alerts, and seamless communication to save more lives.
              </p>
              <div className="flex gap-4">
                <Link href="/register" className="bg-[#111] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-black transition-colors">Get started</Link>
                <Link href="/dogs" className="border border-[#d1d5db] text-[#374151] bg-transparent font-semibold rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-colors">Browse dogs</Link>
              </div>
            </div>
            
            {/* Hero photo collage */}
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[400px]">
              <div className="row-span-2 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Tall dog photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Top right dog photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="https://images.pexels.com/photos/3628100/pexels-photo-3628100.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Bottom right dog photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="bg-[#fafaf9] border-t border-b border-gray-200 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-[#111] mb-2">How it works</h2>
          <p className="text-sm text-gray-500 mb-12 uppercase tracking-widest font-bold">Three steps to save more lives.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-black text-[#f59e0b] mb-3">1</div>
              <h3 className="font-bold text-[#111] text-base mb-1">Shelter adds a dog</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Staff enter intake details and a photo. Takes under 2 minutes.</p>
            </div>
            <div>
              <div className="text-5xl font-black text-[#f59e0b] mb-3">2</div>
              <h3 className="font-bold text-[#111] text-base mb-1">System finds matches</h3>
              <p className="text-sm text-gray-500 leading-relaxed">DOGSRUN checks every active rescue&apos;s criteria and finds the right fit instantly.</p>
            </div>
            <div>
              <div className="text-5xl font-black text-[#f59e0b] mb-3">3</div>
              <h3 className="font-bold text-[#111] text-base mb-1">Rescue gets alerted</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Matched rescues receive an instant email with one-click Interested or Pass links. No login needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: White content body */}
      <section className="bg-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shelter Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#111] mb-4">I run a shelter</h2>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
                List dogs that need rescue pulls. Get matched with the right rescue organizations instantly and track interest in real-time.
              </p>
              <Link href="/register?type=shelter" className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors">
                Register as a shelter
              </Link>
            </div>

            {/* Rescue Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
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
