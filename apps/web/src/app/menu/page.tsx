import { db, menuCategories, menuItems } from "@sultana/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic"; // always fresh — agent edits should show immediately

export default async function MenuPage() {
  const whatsapp = process.env["NEXT_PUBLIC_WHATSAPP_NUMBER"] ?? "";

  const categories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.active, true))
    .orderBy(menuCategories.displayOrder);

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.active, true))
    .orderBy(menuItems.name);

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.categoryId === cat.id),
  }));

  return (
    <div className="pt-24 pb-24">
      {/* Header */}
      <div className="bg-cream-dark py-16 text-center mb-16">
        <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
          What&apos;s cooking
        </p>
        <h1 className="font-display text-5xl text-aubergine mb-4">
          Current Menu
        </h1>
        <p className="text-warm-brown max-w-md mx-auto">
          Seasonal, plant-forward dishes made to order. Reach out on WhatsApp
          to place your order or ask about custom menus.
        </p>
      </div>

      {/* Menu content */}
      <div className="max-w-3xl mx-auto px-6 space-y-16">
        {itemsByCategory.length === 0 ? (
          <p className="text-center text-warm-brown/60 py-20 text-lg">
            Menu coming soon — check back shortly.
          </p>
        ) : (
          itemsByCategory.map(
            (category) =>
              category.items.length > 0 && (
                <section key={category.id}>
                  <h2 className="font-display text-3xl text-aubergine mb-8 pb-3 border-b border-warm-brown/15">
                    {category.name}
                  </h2>
                  <div className="space-y-6">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start gap-6 py-4 border-b border-cream-dark last:border-0"
                      >
                        <div className="flex gap-4 items-start flex-1">
                          {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div>
                            <h3 className="font-display text-xl text-aubergine mb-1">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-warm-brown text-sm leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.price && (
                          <span className="text-terracotta font-medium text-lg flex-shrink-0">
                            ₪{item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ),
          )
        )}

        {/* WhatsApp CTA */}
        {whatsapp && (
          <div className="bg-cream-dark rounded-2xl p-8 text-center mt-12">
            <p className="font-display text-2xl text-aubergine mb-3">
              See something you like?
            </p>
            <p className="text-warm-brown mb-6">
              Reach out on WhatsApp to place your order or ask about catering
              for your event.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-terracotta text-cream px-7 py-3 rounded-full font-medium hover:bg-terracotta-dark transition-colors"
            >
              Order on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
