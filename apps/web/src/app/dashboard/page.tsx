import { db, orders, clients, menuItems } from "@sultana/db";
import { eq, count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [orderStats, clientCount, activeMenuItems, recentOrders] =
    await Promise.all([
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(clients),
      db
        .select({ count: count() })
        .from(menuItems)
        .where(eq(menuItems.active, true)),
      db
        .select({
          id: orders.id,
          status: orders.status,
          total: orders.total,
          eventDate: orders.eventDate,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5),
    ]);

  const stats = [
    { label: "Total Orders", value: orderStats[0]?.count ?? 0 },
    { label: "Clients", value: clientCount[0]?.count ?? 0 },
    { label: "Active Menu Items", value: activeMenuItems[0]?.count ?? 0 },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-warm-brown/15 text-warm-brown",
    confirmed: "bg-olive/15 text-olive-dark",
    completed: "bg-terracotta/15 text-terracotta-dark",
    cancelled: "bg-aubergine/10 text-aubergine/60",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-aubergine mb-1">Overview</h1>
        <p className="text-warm-brown text-sm">Welcome back.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-cream-dark rounded-2xl p-6 border border-warm-brown/10"
          >
            <p className="text-warm-brown text-sm mb-2">{label}</p>
            <p className="font-display text-4xl text-aubergine">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="font-display text-xl text-aubergine mb-4">
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-warm-brown/60 text-sm py-8 text-center bg-cream-dark rounded-2xl">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between bg-cream-dark rounded-xl px-5 py-4 border border-warm-brown/10"
              >
                <div className="flex items-center gap-4">
                  <span className="text-warm-brown/50 text-sm font-mono">
                    #{order.id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      statusColors[order.status] ?? "bg-cream text-warm-brown"
                    }`}
                  >
                    {order.status}
                  </span>
                  {order.eventDate && (
                    <span className="text-warm-brown text-sm">
                      {order.eventDate}
                    </span>
                  )}
                </div>
                {order.total && (
                  <span className="text-terracotta font-medium">
                    ₪{order.total}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
