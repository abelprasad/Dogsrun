import Image from 'next/image'

const products = [
  {
    name: 'DOGSRUN Tumbler',
    description: 'Stainless steel insulated tumbler. Keep your drinks hot or cold while supporting our mission to end shelter euthanasia.',
    price: null,
    image: 'https://m.media-amazon.com/images/I/71dSvhkivFL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/DOGSRUN-Tumbler-Stainless-Steel-Insulated/dp/B0DTJS6VPT',
  },
  {
    name: 'DOGSRUN T-Shirt',
    description: 'Show your support with our classic DOGSRUN tee. Every purchase helps fund our shelter-to-rescue matching platform.',
    price: null,
    image: 'https://m.media-amazon.com/images/I/B1BTNNh2-GL._CLa%7C2140%2C2000%7C71Wcw2pS7bL.png%7C0%2C0%2C2140%2C2000%2B0.0%2C0.0%2C2140.0%2C2000.0_AC_SX679_.png',
    url: 'https://www.amazon.com/Dog-Shelter-Rescue-Unification-Network/dp/B0DRF1HPCM',
  },
  {
    name: 'DOGSRUN Tank Top',
    description: 'Lightweight tank top for the dog lover on the go. Wear your mission every day.',
    price: null,
    image: 'https://m.media-amazon.com/images/I/B14MqFUkUdL._CLa%7C2140%2C2000%7C81uvo7foAeL.png%7C0%2C0%2C2140%2C2000%2B0.0%2C0.0%2C2140.0%2C2000.0_AC_SX466_.png',
    url: 'https://www.amazon.com/Dog-Shelter-Rescue-Unification-Network/dp/B0DZ3Z1VJX',
  },
]

export default function MerchPage() {
  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Support the mission
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl lg:text-7xl">
            Shop DOGSRUN Merch
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c8d3ce]">
            Every purchase helps fund our shelter-to-rescue matching platform. Buy on Amazon — ships fast, supports the mission.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20">
          {products.map((product) => (
            <a
              key={product.name}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 overflow-hidden transition hover:-translate-y-1 hover:outline-[#f4b942]"
            >
              <div className="relative aspect-square bg-white overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-6 transition duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-black text-[#13241d]">{product.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[#5d6a64] flex-1">{product.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  {product.price ? (
                    <span className="text-xl font-black text-[#13241d]">{product.price}</span>
                  ) : (
                    <span className="text-sm font-bold text-[#5d6a64]">See on Amazon</span>
                  )}
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#f4b942] bg-[#13241d] px-3 py-1.5">
                    Buy →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border border-[#13241d]/10 bg-[#fff9ef] overflow-hidden">
          <div className="p-10 flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d95f4b] mb-4">Direct donation</p>
            <h2 className="text-3xl font-black tracking-tight text-[#13241d] mb-4">
              Prefer to donate directly?
            </h2>
            <p className="text-sm leading-7 text-[#5d6a64] mb-6">
              DOGSRUN is a 501(c)(3) nonprofit. Every dollar goes toward keeping our platform running and saving more dogs from euthanasia.
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a877f]">
              Scan the QR code with your phone to donate via PayPal.
            </p>
          </div>
          <div className="bg-[#13241d] flex items-center justify-center p-12">
            <div className="bg-white p-4">
              <Image
                src="/paypal-qr.png"
                alt="PayPal donation QR code"
                width={220}
                height={220}
                unoptimized
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
