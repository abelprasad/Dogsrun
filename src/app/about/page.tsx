import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
            About DOGSRUN
          </h1>
          <p className="text-base text-[#6b7280] max-w-2xl leading-relaxed">
            Connecting shelters and rescues to save more lives through real-time matching and seamless communication.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#111]">Our Mission</h2>
            <p className="text-[#6b7280] leading-relaxed">
              At DOGSRUN, we bring together dog shelters and rescue organizations in a seamless network. 
              Our platform enables shelters to easily share detailed information about dogs in need of homes, 
              while rescues receive timely notifications tailored to their adoption criteria.
            </p>
            <p className="text-[#6b7280] leading-relaxed">
              We are committed to improving the lives of shelter dogs by creating a collaborative network that helps rescues find dogs they can help, reducing the burden of overcrowding in shelters and helping more dogs find loving homes faster.
            </p>
            <Link href="/register" className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors">
              Join the network
            </Link>
          </div>
          <div className="bg-[#fffbeb] rounded-xl border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-[#111] mb-6">How DOGSRUN Works</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center font-bold text-[#451a03] text-sm">1</div>
                <div>
                  <h4 className="font-bold text-[#111] mb-1">Add a dog</h4>
                  <p className="text-sm text-[#6b7280]">Shelters enter details for dogs that need specialized rescue support.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center font-bold text-[#451a03] text-sm">2</div>
                <div>
                  <h4 className="font-bold text-[#111] mb-1">Instant match</h4>
                  <p className="text-sm text-[#6b7280]">Our system automatically matches dogs with rescue organizations based on criteria.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center font-bold text-[#451a03] text-sm">3</div>
                <div>
                  <h4 className="font-bold text-[#111] mb-1">Save lives</h4>
                  <p className="text-sm text-[#6b7280]">Rescues get notified instantly and can respond immediately to pull the dog.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-[#111] mb-8">Nonprofit Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Organization</p>
              <p className="text-sm font-semibold text-[#111]">Dog Shelter & Rescue Unification Network, LLC</p>
              <p className="text-sm text-[#6b7280]">501(c)(3) Public Charity</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Nonprofit ID</p>
              <p className="text-sm font-semibold text-[#111]">EIN 993286395</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Mailing Address</p>
              <p className="text-sm font-semibold text-[#111]">221 W 9th St #896</p>
              <p className="text-sm text-[#6b7280]">Wilmington, DE 19801</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Phone</p>
              <p className="text-sm font-semibold text-[#111]">904-923-4441</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
