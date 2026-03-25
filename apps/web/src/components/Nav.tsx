import Link from "next/link";

export function Nav() {
  const whatsapp = process.env["NEXT_PUBLIC_WHATSAPP_NUMBER"] ?? "";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-warm-brown/10">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl text-aubergine tracking-wide hover:text-terracotta transition-colors"
        >
          Sultana&apos;s Kitchen
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/menu"
            className="text-sm text-warm-brown hover:text-terracotta transition-colors"
          >
            Menu
          </Link>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-terracotta text-cream text-sm px-4 py-2 rounded-full hover:bg-terracotta-dark transition-colors"
            >
              Order Now
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
