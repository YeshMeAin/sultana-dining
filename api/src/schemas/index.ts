import { z } from 'zod';

// Auth schemas
export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// User schemas
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
});

// Ingredient schemas
export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(200),
  unit: z.string().min(1, 'Unit is required').max(50),
  category: z.string().max(100).optional(),
  pricePerUnit: z.number().min(0, 'Price must be non-negative'),
});

export const updateIngredientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(50).optional(),
  category: z.string().max(100).optional(),
  pricePerUnit: z.number().min(0).optional(),
});

export const ingredientIdSchema = z.object({
  id: z.string().cuid(),
});

// Dish schemas
export const createDishSchema = z.object({
  name: z.string().min(1, 'Dish name is required').max(200),
  recipeText: z.string().optional(),
  servings: z.number().int().min(1, 'Servings must be at least 1'),
  laborCost: z.number().min(0, 'Labor cost must be non-negative').default(0),
});

export const updateDishSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  recipeText: z.string().optional(),
  servings: z.number().int().min(1).optional(),
  laborCost: z.number().min(0).optional(),
});

export const addDishIngredientSchema = z.object({
  ingredientId: z.string().cuid(),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
});

export const dishIdSchema = z.object({
  id: z.string().cuid(),
});

// Menu schemas
export const menuItemDishInputSchema = z.object({
  dishId: z.string().cuid(),
});

export const menuItemInputSchema = z.object({
  name: z.string().min(1, 'Menu item name is required').max(200),
  servingQuantity: z.number().int().min(1).default(1),
  dishIds: z.array(z.string().cuid()).min(1, 'At least one dish is required'),
});

export const createMenuSchema = z.object({
  title: z.string().min(1, 'Menu title is required').max(200),
  servingCount: z.number().int().min(1, 'Serving count must be at least 1'),
  notes: z.string().optional(),
  isTemplate: z.boolean().default(false),
  items: z.array(menuItemInputSchema).min(1, 'At least one menu item is required'),
});

export const updateMenuSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  servingCount: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  isTemplate: z.boolean().optional(),
  items: z.array(menuItemInputSchema).optional(),
});

export const menuIdSchema = z.object({
  id: z.string().cuid(),
});

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const clientIdSchema = z.object({
  id: z.string().cuid(),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(200),
  clientId: z.string().cuid().optional(),
  menuId: z.string().cuid().optional(),
  eventDate: z.string().datetime().optional(),
  guestCount: z.number().int().min(1).optional(),
  additionalCosts: z.record(z.number()).optional(), // e.g., { "cleaning": 500, "bar": 1000 }
  notes: z.string().optional(),
  status: z.enum(['draft', 'proposal_sent', 'confirmed', 'completed']).default('draft'),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  clientId: z.string().cuid().nullable().optional(),
  menuId: z.string().cuid().nullable().optional(),
  eventDate: z.string().datetime().nullable().optional(),
  guestCount: z.number().int().min(1).nullable().optional(),
  additionalCosts: z.record(z.number()).nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'proposal_sent', 'confirmed', 'completed']).optional(),
});

export const eventIdSchema = z.object({
  id: z.string().cuid(),
});

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type CreateDishInput = z.infer<typeof createDishSchema>;
export type UpdateDishInput = z.infer<typeof updateDishSchema>;
export type AddDishIngredientInput = z.infer<typeof addDishIngredientSchema>;
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
