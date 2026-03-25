import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  date,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url", { length: 500 }),
  active: boolean("active").notNull().default(true),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  ingredients: json("ingredients").$type<string[]>().notNull().default([]),
  steps: text("steps"),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  items: json("items")
    .$type<Array<{ name: string; quantity: number; price: string }>>()
    .notNull()
    .default([]),
  total: numeric("total", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 })
    .$type<OrderStatus>()
    .notNull()
    .default("pending"),
  eventDate: date("event_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  recipes: many(recipes),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [recipes.menuItemId],
    references: [menuItems.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
}));
