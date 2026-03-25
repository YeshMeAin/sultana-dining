import Link from "next/link";
import { Carousel } from "@/components/Carousel";

const CAROUSEL_SLIDES = [
  { alt: "Seasonal mezze spread", label: "Seasonal Mezze" },
  { alt: "Shakshuka in cast iron", label: "Shakshuka" },
  { alt: "Stuffed grape leaves", label: "Grape Leaves" },
  { alt: "Tahini dessert plate", label: "Tahini Desserts" },
];

export default function LandingPage() {
  const whatsapp = process.env["NEXT_PUBLIC_WHATSAPP_NUMBER"] ?? "";

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center bg-hero-texture pt-16">
        <div className="max-w-5xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-4">
              Personal Chef &amp; Catering
            </p>
            <h1 className="font-display text-5xl lg:text-6xl text-aubergine leading-tight text-balance mb-6">
              Food made with <em>love</em> and intention
            </h1>
            <p className="text-warm-brown text-lg leading-relaxed mb-10 max-w-md">
              Home-cooked Mediterranean cuisine with a vegan &amp; vegetarian
              heart. Crafted for gatherings, celebrations, and everyday
              nourishment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="bg-aubergine text-cream px-7 py-3 rounded-full hover:bg-aubergine-light transition-colors font-medium"
              >
                View Menu
              </Link>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-terracotta text-terracotta px-7 py-3 rounded-full hover:bg-terracotta hover:text-cream transition-colors font-medium"
                >
                  Order via WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Carousel */}
          <div className="w-full">
            <Carousel slides={CAROUSEL_SLIDES} />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-warm-brown/50 text-xs tracking-widest">
          <span>SCROLL</span>
          <div className="w-px h-10 bg-warm-brown/20" />
        </div>
      </section>

      {/* About */}
      <section className="bg-cream-dark py-24">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Decorative block */}
          <div className="relative aspect-square max-w-sm mx-auto lg:mx-0">
            <div className="absolute inset-0 bg-terracotta/10 rounded-3xl rotate-3" />
            <div className="absolute inset-0 bg-olive/10 rounded-3xl -rotate-2" />
            <div className="relative h-full rounded-3xl bg-gradient-to-br from-terracotta/20 to-olive/20 flex items-center justify-center">
              <span className="font-display text-7xl text-aubergine/20">S</span>
            </div>
          </div>

          <div>
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-4">
              About
            </p>
            <h2 className="font-display text-4xl text-aubergine mb-6 text-balance">
              A kitchen built on tradition
            </h2>
            <p className="text-warm-brown leading-relaxed mb-4">
              Sultana brings the warmth of Mediterranean home cooking to your
              table. Every dish is prepared with seasonal ingredients, ancient
              recipes, and a deep respect for plant-based cuisine.
            </p>
            <p className="text-warm-brown leading-relaxed">
              Whether it&apos;s an intimate dinner, a family celebration, or a
              weekly meal service — each plate is made with care, and every
              menu is tailored to you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      {whatsapp && (
        <section className="bg-terracotta py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-display text-4xl text-cream mb-4">
              Ready to order?
            </h2>
            <p className="text-cream/70 mb-8 text-lg">
              Browse the current menu and reach out directly on WhatsApp.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/menu"
                className="bg-cream text-terracotta px-7 py-3 rounded-full font-medium hover:bg-cream-dark transition-colors"
              >
                See the Menu
              </Link>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-cream/50 text-cream px-7 py-3 rounded-full font-medium hover:bg-cream/10 transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
