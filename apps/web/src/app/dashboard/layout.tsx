import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen pt-16 bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Dashboard nav */}
        <nav className="flex gap-1 mb-8 bg-cream-dark rounded-xl p-1 w-fit">
          {[
            { href: "/dashboard", label: "Overview" },
            { href: "/dashboard/orders", label: "Orders" },
            { href: "/dashboard/clients", label: "Clients" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg text-sm text-warm-brown hover:text-aubergine hover:bg-cream transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
