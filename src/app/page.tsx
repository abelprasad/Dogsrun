import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dogs" className="text-sm font-medium text-gray-500 hover:text-[#f59e0b] transition-colors">Browse Dogs</Link>
              <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-[#f59e0b] transition-colors">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-[#f59e0b] transition-colors">
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-[#f59e0b] hover:bg-[#d97706] transition-all">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.pexels.com/photos/13349425/pexels-photo-13349425.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Dog background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        
        <div className="relative z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Every dog deserves a <span className="text-[#f59e0b]">run</span> to safety.
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            The fastest way for shelters to find rescues for their most urgent dogs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-[#f59e0b] hover:bg-[#d97706] transform transition hover:scale-105 active:scale-95">
              Get Started
            </Link>
            <Link href="/dogs" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-bold rounded-xl text-white hover:bg-white/10 transition-colors">
              Browse Dogs
            </Link>
          </div>
        </div>
      </header>

      {/* Join the Network Section */}
      <section id="join" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Join the network</h2>
          <p className="text-lg text-gray-600">How do you want to get started?</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shelter Card */}
          <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-8 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">I run a shelter</h3>
            <p className="text-gray-500 mb-10 leading-relaxed">
              List dogs that need rescue pulls. Get matched with the right rescue orgs instantly.
            </p>
            <Link href="/register?type=shelter" className="inline-flex items-center justify-center w-full px-6 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-[#f59e0b] hover:bg-[#d97706] transition-all transform active:scale-95 shadow-lg shadow-amber-200">
              Get Started as a Shelter
            </Link>
          </div>

          {/* Rescue Card */}
          <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-8 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">I run a rescue</h3>
            <p className="text-gray-500 mb-10 leading-relaxed">
              Set your criteria once. Get alerted automatically when matching dogs are available.
            </p>
            <Link href="/register?type=rescue" className="inline-flex items-center justify-center w-full px-6 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-[#f59e0b] hover:bg-[#d97706] transition-all transform active:scale-95 shadow-lg shadow-amber-200">
              Get Started as a Rescue
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works (3 Steps) */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How DOGSRUN Works</h2>
          <p className="text-lg text-gray-600">Matching the right dog with the right rescue in three simple steps.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl font-bold text-[#f59e0b] mb-6">1</div>
            <h3 className="text-xl font-bold mb-3">Add a Dog</h3>
            <p className="text-gray-600">Shelters enter details for dogs that need specialized rescue support or are at risk.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl font-bold text-[#f59e0b] mb-6">2</div>
            <h3 className="text-xl font-bold mb-3">Instant Match</h3>
            <p className="text-gray-600">Our system automatically matches dogs with rescue organizations based on specific criteria.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl font-bold text-[#f59e0b] mb-6">3</div>
            <h3 className="text-xl font-bold mb-3">Save Lives</h3>
            <p className="text-gray-600">Rescues get notified instantly and can respond immediately to pull the dog from the shelter.</p>
          </div>
        </div>
      </section>

      {/* For Shelters Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Built for Shelters</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Don't spend hours emailing rescues one by one. With DOGSRUN, you list a dog once, and every rescue matching that dog's profile is notified instantly. 
            </p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3 italic">"DOGSRUN has cut our networking time in half."</li>
              <li className="flex items-start gap-3">✓ Reach targeted rescues instantly</li>
              <li className="flex items-start gap-3">✓ Track rescue interest in real-time</li>
              <li className="flex items-start gap-3">✓ Focused on high-needs dogs</li>
            </ul>
          </div>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.pexels.com/photos/16583180/pexels-photo-16583180.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Shelter dogs"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* For Rescues Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.pexels.com/photos/6298625/pexels-photo-6298625.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Rescue volunteer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Built for Rescues</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Stop digging through social media to find dogs that fit your mission. Set your criteria—breed, age, distance, and more—and let the matches come to you.
            </p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3 italic">"We only see the dogs we're actually able to pull."</li>
              <li className="flex items-start gap-3">✓ Customized matching criteria</li>
              <li className="flex items-start gap-3">✓ Clear, concise dog profiles</li>
              <li className="flex items-start gap-3">✓ One-click interest reporting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</span>
            <p className="mt-4 text-gray-400 max-w-xs leading-relaxed text-sm">
              Connecting animal shelters with specialized rescue organizations to save more lives. Built with love for dogs everywhere.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/register" className="hover:text-white">Register</Link></li>
              <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} DOGSRUN. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
