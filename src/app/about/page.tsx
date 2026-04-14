import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
          <div className="flex items-center gap-6">
            <Link href="/dogs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Browse Dogs</Link>
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-8">
            Connecting <span className="text-[#f59e0b]">shelters</span> and <span className="text-[#f59e0b]">rescues</span>
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl text-gray-600 leading-relaxed mb-12">
              We are committed to improving the lives of shelter dogs by creating a collaborative network 
              that helps rescues find dogs they can help, reducing overcrowding in shelters.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-[#f59e0b] text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-200 hover:bg-[#d97706] transition-all">
              Join the Network
            </Link>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-gray-900 mb-4">How it Works</h2>
              <p className="text-gray-500">Matching the right dog with the right rescue in three simple steps.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-[#f59e0b] text-2xl font-black mb-8">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Shelters add dogs</h3>
                <p className="text-gray-500 leading-relaxed">
                  Shelters enter details for dogs that need specialized rescue support or are at risk of euthanasia.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-[#f59e0b] text-2xl font-black mb-8">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">System matches criteria</h3>
                <p className="text-gray-500 leading-relaxed">
                  Our system automatically matches dogs with rescue organizations based on their specific breed, age, and needs.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-[#f59e0b] text-2xl font-black mb-8">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Rescues get alerts</h3>
                <p className="text-gray-500 leading-relaxed">
                  Rescues receive instant email alerts and can express interest with one click to start the pull process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nonprofit Info Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="bg-amber-50 rounded-[40px] p-12 border border-amber-100">
            <h2 className="text-2xl font-black text-amber-900 mb-6 uppercase tracking-widest">Our Foundation</h2>
            <p className="text-lg text-amber-900/80 mb-8 leading-relaxed font-medium">
              Dog Shelter & Rescue Unification Network, LLC, is a 501(c3) nonprofit charity dedicated to streamlining 
              the networking process between animal shelters and specialized rescue groups.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto pt-8 border-t border-amber-200/50">
              <div>
                <p className="text-[10px] font-black text-amber-700/50 uppercase tracking-[0.2em] mb-2">Nonprofit ID</p>
                <p className="text-amber-900 font-bold">EIN 993286395</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700/50 uppercase tracking-[0.2em] mb-2">Mailing Address</p>
                <p className="text-amber-900 font-bold leading-relaxed">
                  221 W 9th St #896<br />Wilmington, DE 19801
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700/50 uppercase tracking-[0.2em] mb-2">Phone Support</p>
                <p className="text-amber-900 font-bold">904-923-4441</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700/50 uppercase tracking-[0.2em] mb-2">Status</p>
                <p className="text-amber-900 font-bold">501(c)(3) Public Charity</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
