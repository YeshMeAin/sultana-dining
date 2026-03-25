/**
 * Seed script — populates the DB with sample data for local dev.
 * Safe to re-run: clears existing data before inserting.
 *
 * Usage: pnpm db:seed
 */
import { db, menuCategories, menuItems, clients } from "./index.js";

async function seed() {
  console.log("Seeding database...");

  // Categories
  await db.delete(menuItems);
  await db.delete(menuCategories);
  await db.delete(clients);

  const [starters, mains, desserts, drinks] = await db
    .insert(menuCategories)
    .values([
      { name: "Starters", displayOrder: 1 },
      { name: "Mains", displayOrder: 2 },
      { name: "Desserts", displayOrder: 3 },
      { name: "Drinks", displayOrder: 4 },
    ])
    .returning();

  if (!starters || !mains || !desserts || !drinks) {
    throw new Error("Failed to insert categories");
  }

  // Menu items
  await db.insert(menuItems).values([
    // Starters
    {
      categoryId: starters.id,
      name: "Hummus & Pita",
      description:
        "Smooth chickpea hummus with tahini, olive oil, and warm house-baked pita.",
      price: "38",
    },
    {
      categoryId: starters.id,
      name: "Stuffed Grape Leaves",
      description:
        "Hand-rolled with spiced rice, herbs, and lemon. Served with labneh.",
      price: "45",
    },
    {
      categoryId: starters.id,
      name: "Roasted Eggplant Dip",
      description:
        "Fire-roasted eggplant blended with garlic, lemon, and pomegranate seeds.",
      price: "42",
    },

    // Mains
    {
      categoryId: mains.id,
      name: "Shakshuka",
      description:
        "Eggs poached in a rich tomato and pepper sauce with harissa and fresh herbs.",
      price: "58",
    },
    {
      categoryId: mains.id,
      name: "Chickpea Tagine",
      description:
        "Slow-cooked chickpeas with preserved lemon, olives, and warming spices. Served with couscous.",
      price: "72",
    },
    {
      categoryId: mains.id,
      name: "Stuffed Bell Peppers",
      description:
        "Sweet peppers filled with spiced lentils, pine nuts, and currants.",
      price: "65",
    },
    {
      categoryId: mains.id,
      name: "Lentil & Spinach Dal",
      description:
        "Red lentils simmered with coconut milk, turmeric, and wilted spinach.",
      price: "60",
    },

    // Desserts
    {
      categoryId: desserts.id,
      name: "Date & Walnut Cake",
      description:
        "Dense, moist cake sweetened with Medjool dates. Naturally vegan.",
      price: "35",
    },
    {
      categoryId: desserts.id,
      name: "Tahini Cookies",
      description: "Crisp sesame cookies with a hint of cardamom. Pack of 4.",
      price: "28",
    },

    // Drinks
    {
      categoryId: drinks.id,
      name: "Mint Lemonade",
      description: "Fresh-squeezed lemon with garden mint and a touch of honey.",
      price: "22",
    },
    {
      categoryId: drinks.id,
      name: "Rose Water Lassi",
      description: "Chilled yogurt drink with rose water and crushed pistachios.",
      price: "25",
    },
  ]);

  // Sample clients
  await db.insert(clients).values([
    {
      name: "Sample Client",
      phone: "0501234567",
      whatsapp: "9720501234567",
      notes: "Seed data — replace with real clients.",
    },
  ]);

  console.log("Done. DB seeded with sample menu and a placeholder client.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
