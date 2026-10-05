import Image from "next/image";
import Link from "next/link";

const products = [
  {
    name: "DOGSRUN Tumbler",
    description:
      "Stainless steel insulated tumbler. Keep your drinks hot or cold while supporting our mission to end shelter euthanasia.",
    image: "https://m.media-amazon.com/images/I/71dSvhkivFL._AC_SX679_.jpg",
    url: "https://www.amazon.com/DOGSRUN-Tumbler-Stainless-Steel-Insulated/dp/B0DTJS6VPT",
  },
  {
    name: "DOGSRUN T-Shirt",
    description:
      "Show your support with our classic DOGSRUN tee. Every purchase helps fund our shelter-to-rescue matching platform.",
    image:
      "https://m.media-amazon.com/images/I/B1BTNNh2-GL._CLa%7C2140%2C2000%7C71Wcw2pS7bL.png%7C0%2C0%2C2140%2C2000%2B0.0%2C0.0%2C2140.0%2C2000.0_AC_SX679_.png",
    url: "https://www.amazon.com/Dog-Shelter-Rescue-Unification-Network/dp/B0DRF1HPCM",
  },
  {
    name: "DOGSRUN Tank Top",
    description:
      "Lightweight tank top for the dog lover on the go. Wear your mission every day.",
    image:
      "https://m.media-amazon.com/images/I/B14MqFUkUdL._CLa%7C2140%2C2000%7C81uvo7foAeL.png%7C0%2C0%2C2140%2C2000%2B0.0%2C0.0%2C2140.0%2C2000.0_AC_SX466_.png",
    url: "https://www.amazon.com/Dog-Shelter-Rescue-Unification-Network/dp/B0DZ3Z1VJX",
  },
];

export default function MerchPage() {
  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HERO ── */}
      <header className="px-5 pb-16 pt-24 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            Support the mission
          </div>
          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#f8f1e8]">Wear it.</span>
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#c08a3e]">Fund the run.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#f8f1e8]/70">
            Every purchase helps fund our shelter-to-rescue matching platform.
            Buy on Amazon — ships fast, supports the mission.
          </p>
        </div>
      </header>

      {/* ── PRODUCTS ── */}
      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-16">
        <div className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <a
              key={product.name}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden border border-white/10 bg-[#122016] transition hover:-translate-y-1 hover:border-[#c08a3e]"
            >
              <div className="relative aspect-square overflow-hidden bg-[#0b140e]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-8 transition duration-500 group-hover:scale-105"
                  unoptimized
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-[#f8f1e8]">
                  {product.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-7 text-[#f8f1e8]/60">
                  {product.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">
                    See on Amazon
                  </span>
                  <span className="bg-[#c08a3e] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#140a08] transition group-hover:bg-[#d4a050]">
                    Buy →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* ── DIRECT DONATION ── */}
        <div className="grid grid-cols-1 overflow-hidden border border-white/10 bg-[#122016] md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="mb-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em] text-[#a8583f]">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-[#a8583f]" />
              Direct donation
            </p>
            <h2 className="mb-4 text-[clamp(2rem,4.5vw,3rem)] font-black uppercase leading-[0.92] tracking-tight">
              Rather skip<br />the <span className="text-[#c08a3e]">merch?</span>
            </h2>
            <p className="mb-6 max-w-md text-sm leading-7 text-[#f8f1e8]/60">
              DOGSRUN is a 501(c)(3) nonprofit. Every dollar goes toward keeping
              the platform running and saving more dogs from euthanasia.
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">
              Scan the QR code with your phone to donate via PayPal.
            </p>
          </div>
          <div className="flex items-center justify-center bg-[#a8583f] p-12">
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

        {/* ── SECONDARY CTA ── */}
        <div className="mt-16 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f8f1e8]/40">
            No money? No problem.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center gap-3 border-b-2 border-[#c08a3e] pb-1 text-sm font-black uppercase tracking-[0.22em] text-[#f8f1e8] transition hover:text-[#c08a3e]"
          >
            Join the network instead →
          </Link>
        </div>
      </main>
    </div>
  );
}
