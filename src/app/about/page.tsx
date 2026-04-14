import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img 
              src="https://dogsrun2.powerappsportals.com/DOGSRUN Logo idea 4.PNG"
              alt="DOGSRUN"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dogs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Browse Dogs</Link>
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative h-96 flex items-center justify-center overflow-hidden">
          <img 
            src="https://images.pexels.com/photos/3628100/pexels-photo-3628100.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="About DOGSRUN"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div className="relative z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Connecting shelters and rescues
            </h1>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl text-gray-600 leading-relaxed mb-12">
              At DOGSRUN, we bring together dog shelters and rescue organizations in a seamless network. 
              Our platform enables shelters to easily share detailed information about dogs in need of homes, 
              while rescues receive timely notifications tailored to their adoption criteria.
            </p>
            <div className="bg-amber-50 rounded-[40px] p-10 border border-amber-100 mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-700 leading-relaxed font-medium">
                We are committed to improving the lives of shelter dogs by creating a collaborative network that helps rescues find dogs they can help, which should reduce the burden of overcrowding in shelters. By connecting shelters and rescues, we help more dogs find loving homes faster and more efficiently and reduce unnecessary euthanasia of shelter dogs.
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-[#f59e0b] text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-200 hover:bg-[#d97706] transition-all">
              Join Our Network
            </Link>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl font-black text-gray-900 mb-6">How It Works</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Shelters log in to enter detailed profiles of dogs available for adoption. 
                Rescues set their preferences and receive instant notifications when dogs matching their criteria become available. 
                This streamlined communication helps save time and lives.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Success Stories</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Read inspiring stories of dogs who found their forever homes through our network, thanks to the dedication of shelters and rescues working together.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Community Focus</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  We foster a supportive community where shelters and rescues share resources, knowledge, and support to improve animal welfare across regions.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Get Involved</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-6">
                  Whether you are a shelter, rescue, or animal lover, join DOGSRUN to make a difference. Together, we can save more dogs and create happier lives.
                </p>
                <Link href="/register" className="inline-flex items-center px-6 py-2 border border-[#f59e0b] text-sm font-bold rounded-xl text-[#f59e0b] hover:bg-amber-50 transition-all">
                  Register
                </Link>
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
