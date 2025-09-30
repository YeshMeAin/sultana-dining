import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup.js';
import {
  createTestUser,
  createTestIngredient,
  createTestDish,
  addIngredientToDish,
  createTestMenu,
  createTestClient,
  testIngredients,
} from '../fixtures.js';
import { calculateEventProposal } from '../../src/services/calculation.service.js';

describe('Event Routes', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testMenu: Awaited<ReturnType<typeof createTestMenu>>;
  let beef: Awaited<ReturnType<typeof createTestIngredient>>;
  let rice: Awaited<ReturnType<typeof createTestIngredient>>;

  beforeEach(async () => {
    testUser = await createTestUser();
    testClient = await createTestClient(testUser.id, {
      name: 'Desert Resort',
      email: 'resort@example.com',
    });

    // Create ingredients
    beef = await createTestIngredient(testIngredients.beef);
    rice = await createTestIngredient(testIngredients.rice);

    // Create dishes
    const beefDish = await createTestDish(testUser.id, {
      name: 'Beef Stew',
      servings: 4,
      laborCost: 50,
    });
    await addIngredientToDish(beefDish.id, beef.id, 2);

    const riceDish = await createTestDish(testUser.id, {
      name: 'Basmati Rice',
      servings: 4,
      laborCost: 10,
    });
    await addIngredientToDish(riceDish.id, rice.id, 1);

    // Create menu with items
    testMenu = await prisma.menu.create({
      data: {
        title: 'Wedding Menu',
        servingCount: 100,
        userId: testUser.id,
        items: {
          create: [
            {
              name: 'Main Course',
              servingQuantity: 1,
              dishes: {
                create: [
                  {
                    dishId: beefDish.id,
                    ingredients: [{ ingredientId: beef.id, quantity: 2 }],
                  },
                  {
                    dishId: riceDish.id,
                    ingredients: [{ ingredientId: rice.id, quantity: 1 }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });

  describe('POST /events', () => {
    it('should create event with menu and client', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Summer Wedding',
          guestCount: 150,
          userId: testUser.id,
          menuId: testMenu.id,
          clientId: testClient.id,
        },
      });

      expect(event.id).toBeDefined();
      expect(event.title).toBe('Summer Wedding');
      expect(event.guestCount).toBe(150);
      expect(event.menuId).toBe(testMenu.id);
      expect(event.clientId).toBe(testClient.id);
      expect(event.userId).toBe(testUser.id);
      expect(event.additionalCosts).toBeNull();
    });

    it('should create event with additional costs', async () => {
      const additionalCosts = {
        cleaning: 500,
        bar: 1000,
        entertainment: 2000,
      };

      const event = await prisma.event.create({
        data: {
          title: 'Luxury Event',
          guestCount: 200,
          userId: testUser.id,
          menuId: testMenu.id,
          clientId: testClient.id,
          additionalCosts,
        },
      });

      expect(event.additionalCosts).toEqual(additionalCosts);
    });

    it('should create event without client', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'No Client Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      expect(event.clientId).toBeNull();
    });
  });

  describe('GET /events', () => {
    it('should list all user events', async () => {
      await prisma.event.create({
        data: {
          title: 'Event 1',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      await prisma.event.create({
        data: {
          title: 'Event 2',
          guestCount: 150,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      const events = await prisma.event.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(events).toHaveLength(2);
    });

    it('should only return user own events', async () => {
      const user2 = await createTestUser('user2@example.com');
      const menu2 = await createTestMenu(user2.id, {
        title: 'Menu 2',
        servingCount: 50,
      });

      await prisma.event.create({
        data: {
          title: 'My Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      await prisma.event.create({
        data: {
          title: 'Other Event',
          guestCount: 100,
          userId: user2.id,
          menuId: menu2.id,
        },
      });

      const events = await prisma.event.findMany({
        where: { userId: testUser.id },
      });

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('My Event');
    });
  });

  describe('GET /events/:id', () => {
    it('should get event with menu and client details', async () => {
      const created = await prisma.event.create({
        data: {
          title: 'Detailed Event',
          guestCount: 150,
          userId: testUser.id,
          menuId: testMenu.id,
          clientId: testClient.id,
        },
      });

      const event = await prisma.event.findUnique({
        where: { id: created.id },
        include: {
          menu: true,
          client: true,
        },
      });

      expect(event).toBeDefined();
      expect(event!.menu.title).toBe('Wedding Menu');
      expect(event!.client!.name).toBe('Desert Resort');
    });

    it('should return null for non-existent event', async () => {
      const event = await prisma.event.findUnique({
        where: { id: 'non-existent' },
      });

      expect(event).toBeNull();
    });
  });

  describe('PATCH /events/:id', () => {
    it('should update event details', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Original Title',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: {
          title: 'Updated Title',
          guestCount: 150,
        },
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.guestCount).toBe(150);
    });

    it('should update additional costs', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
          additionalCosts: { cleaning: 500 },
        },
      });

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: {
          additionalCosts: {
            cleaning: 750,
            bar: 1500,
          },
        },
      });

      expect(updated.additionalCosts).toEqual({
        cleaning: 750,
        bar: 1500,
      });
    });

    it('should change menu', async () => {
      const menu2 = await createTestMenu(testUser.id, {
        title: 'Alternative Menu',
        servingCount: 80,
      });

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: { menuId: menu2.id },
      });

      expect(updated.menuId).toBe(menu2.id);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Delete Me',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      await prisma.event.delete({
        where: { id: event.id },
      });

      const found = await prisma.event.findUnique({
        where: { id: event.id },
      });

      expect(found).toBeNull();
    });

    it('should not affect menu or client when deleting event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
          clientId: testClient.id,
        },
      });

      await prisma.event.delete({
        where: { id: event.id },
      });

      const foundMenu = await prisma.menu.findUnique({
        where: { id: testMenu.id },
      });
      const foundClient = await prisma.client.findUnique({
        where: { id: testClient.id },
      });

      expect(foundMenu).toBeDefined();
      expect(foundClient).toBeDefined();
    });
  });

  describe('GET /events/:id/proposal - Cost Calculation', () => {
    it('should calculate event proposal with guest count scaling', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Wedding',
          guestCount: 150, // Menu is for 100
          userId: testUser.id,
          menuId: testMenu.id,
          clientId: testClient.id,
          additionalCosts: {
            cleaning: 500,
            bar: 1000,
          },
        },
      });

      // Fetch full event with menu details
      const fullEvent = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          menu: {
            include: {
              items: {
                include: {
                  dishes: {
                    include: {
                      dish: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Create ingredient map
      const ingredientMap = new Map([
        [beef.id, beef],
        [rice.id, rice],
      ]);

      const proposal = calculateEventProposal(fullEvent!, ingredientMap);

      expect(proposal.eventId).toBe(event.id);
      expect(proposal.guestCount).toBe(150);

      // Menu costs: (2kg beef * 25) + (1kg rice * 5) + 50 labor + 10 labor = 115 for 100 servings
      // Cost per serving: 115 / 100 = 1.15
      // For 150 guests: 1.15 * 150 = 172.5
      expect(proposal.menu.totalCost).toBeCloseTo(115, 2);
      expect(proposal.menuCostForEvent).toBeCloseTo(172.5, 2);

      expect(proposal.totalAdditionalCosts).toBe(1500);
      expect(proposal.totalCost).toBe(1672.5); // 172.5 + 1500
      expect(proposal.costPerGuest).toBe(11.15); // 1672.5 / 150
    });

    it('should handle event with no additional costs', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Simple Event',
          guestCount: 100,
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      const fullEvent = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          menu: {
            include: {
              items: {
                include: {
                  dishes: {
                    include: {
                      dish: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const ingredientMap = new Map([
        [beef.id, beef],
        [rice.id, rice],
      ]);

      const proposal = calculateEventProposal(fullEvent!, ingredientMap);

      expect(proposal.totalAdditionalCosts).toBe(0);
      expect(proposal.totalCost).toBeCloseTo(115, 2); // Menu cost only
      expect(proposal.costPerGuest).toBeCloseTo(1.15, 2);
    });

    it('should scale correctly when guest count matches serving count', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Exact Match Event',
          guestCount: 100, // Same as menu serving count
          userId: testUser.id,
          menuId: testMenu.id,
        },
      });

      const fullEvent = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          menu: {
            include: {
              items: {
                include: {
                  dishes: {
                    include: {
                      dish: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const ingredientMap = new Map([
        [beef.id, beef],
        [rice.id, rice],
      ]);

      const proposal = calculateEventProposal(fullEvent!, ingredientMap);

      // No scaling needed
      expect(proposal.menuCostForEvent).toBeCloseTo(115, 2);
      expect(proposal.totalCost).toBeCloseTo(115, 2);
      expect(proposal.costPerGuest).toBeCloseTo(1.15, 2);
    });
  });
});
