import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      {/* Hero */}
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Our mission
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl lg:text-7xl">
            About DOGSRUN
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#c8d3ce]">
            Connecting shelters and rescues to save more lives through real-time matching and seamless communication.
          </p>
        </div>
      </header>

      {/* Photo strip */}
      <section className="bg-[#f5f0e8] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=600",
            "https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=600",
            "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600",
          ].map((src, i) => (
            <div key={i} className="relative h-52 overflow-hidden">
              <Image src={src} alt={`Dog photo ${i + 1}`} fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
        {/* Mission + How it works */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-[#13241d]">Our Mission</h2>
            <p className="leading-8 text-[#5d6a64]">
              At DOGSRUN, we bring together dog shelters and rescue organizations in a seamless network.
              Our platform enables shelters to share detailed information about dogs in need, while rescues
              receive timely notifications tailored to their adoption criteria.
            </p>
            <p className="leading-8 text-[#5d6a64]">
              We are committed to improving the lives of shelter dogs by creating a collaborative network
              that reduces overcrowding and helps more dogs find loving homes faster.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#f4b942] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]"
            >
              Join the network
            </Link>
          </div>

          <div className="border-l-4 border-[#f59e0b] bg-[#13241d] p-8 text-[#f8f1e8]">
            <h3 className="mb-8 text-xl font-black text-[#f4b942]">How DOGSRUN Works</h3>
            <div className="space-y-8">
              {[
                ["Add a dog", "Shelters enter details for dogs that need specialized rescue support."],
                ["Instant match", "Our system automatically matches dogs with rescue organizations based on criteria."],
                ["Save lives", "Rescues get notified instantly and can respond immediately to pull the dog."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4b942] text-sm font-black text-[#13241d]">
                    0{i + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-[#f8f1e8]">{title}</h4>
                    <p className="mt-1 text-sm leading-7 text-[#c8d3ce]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nonprofit info */}
        <div className="border border-[#13241d]/15 bg-[#fff9ef] p-8">
          <h2 className="mb-8 text-2xl font-black text-[#13241d]">Nonprofit Information</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Organization", "Dog Shelter & Rescue Unification Network, LLC", "501(c)(3) Public Charity"],
              ["Nonprofit ID", "EIN 993286395"],
              ["Mailing Address", "221 W 9th St #896", "Wilmington, DE 19801"],
              ["Phone", "904-923-4441"],
            ].map(([label, ...lines]) => (
              <div key={label}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a877f]">{label}</p>
                {lines.map((line, i) => (
                  <p key={i} className={`text-sm ${i === 0 ? 'font-black text-[#13241d]' : 'text-[#5d6a64]'}`}>{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
