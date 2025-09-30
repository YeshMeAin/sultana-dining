import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup.js';
import { createTestUser, createTestClient } from '../fixtures.js';

describe('Client Routes', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe('POST /clients', () => {
    it('should create a new client', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Desert Resort Wedding',
        email: 'contact@desertresort.com',
        phone: '+1-555-0100',
      });

      expect(client.id).toBeDefined();
      expect(client.name).toBe('Desert Resort Wedding');
      expect(client.email).toBe('contact@desertresort.com');
      expect(client.phone).toBe('+1-555-0100');
      expect(client.userId).toBe(testUser.id);
    });

    it('should create client with minimal data', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Simple Client',
      });

      expect(client.name).toBe('Simple Client');
      expect(client.email).toBeNull();
      expect(client.phone).toBeNull();
    });
  });

  describe('GET /clients', () => {
    it('should list all user clients', async () => {
      await createTestClient(testUser.id, {
        name: 'Client 1',
        email: 'client1@example.com',
      });
      await createTestClient(testUser.id, {
        name: 'Client 2',
        phone: '+1-555-0200',
      });

      const clients = await prisma.client.findMany({
        where: { userId: testUser.id },
        orderBy: { name: 'asc' },
      });

      expect(clients).toHaveLength(2);
      expect(clients[0].name).toBe('Client 1');
      expect(clients[1].name).toBe('Client 2');
    });

    it('should only return user own clients', async () => {
      const user2 = await createTestUser('user2@example.com');

      await createTestClient(testUser.id, { name: 'My Client' });
      await createTestClient(user2.id, { name: 'Other Client' });

      const clients = await prisma.client.findMany({
        where: { userId: testUser.id },
      });

      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('My Client');
    });

    it('should search clients by name', async () => {
      await createTestClient(testUser.id, { name: 'Desert Resort' });
      await createTestClient(testUser.id, { name: 'Mountain Lodge' });
      await createTestClient(testUser.id, { name: 'Desert Oasis' });

      const clients = await prisma.client.findMany({
        where: {
          userId: testUser.id,
          name: {
            contains: 'Desert',
            mode: 'insensitive',
          },
        },
      });

      expect(clients).toHaveLength(2);
      expect(clients.every((c) => c.name.includes('Desert'))).toBe(true);
    });
  });

  describe('GET /clients/:id', () => {
    it('should get single client', async () => {
      const created = await createTestClient(testUser.id, {
        name: 'Resort Client',
        email: 'resort@example.com',
      });

      const client = await prisma.client.findUnique({
        where: { id: created.id },
      });

      expect(client).toBeDefined();
      expect(client!.name).toBe('Resort Client');
      expect(client!.email).toBe('resort@example.com');
    });

    it('should return null for non-existent client', async () => {
      const client = await prisma.client.findUnique({
        where: { id: 'non-existent' },
      });

      expect(client).toBeNull();
    });
  });

  describe('PATCH /clients/:id', () => {
    it('should update client details', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Original Name',
        email: 'old@example.com',
      });

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
          name: 'Updated Name',
          email: 'new@example.com',
          phone: '+1-555-0300',
        },
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('new@example.com');
      expect(updated.phone).toBe('+1-555-0300');
    });

    it('should update only specified fields', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Client Name',
        email: 'client@example.com',
      });

      const updated = await prisma.client.update({
        where: { id: client.id },
        data: { phone: '+1-555-0400' },
      });

      expect(updated.name).toBe('Client Name'); // Unchanged
      expect(updated.email).toBe('client@example.com'); // Unchanged
      expect(updated.phone).toBe('+1-555-0400'); // Updated
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete client not in use', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Delete Me',
      });

      await prisma.client.delete({
        where: { id: client.id },
      });

      const found = await prisma.client.findUnique({
        where: { id: client.id },
      });

      expect(found).toBeNull();
    });

    it('should handle cascade delete with events (SetNull)', async () => {
      const client = await createTestClient(testUser.id, {
        name: 'Client with Event',
      });

      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: 'Test Event',
          guestCount: 150,
          userId: testUser.id,
          menuId: menu.id,
          clientId: client.id,
        },
      });

      // Delete client
      await prisma.client.delete({
        where: { id: client.id },
      });

      // Event should still exist but clientId should be null
      const foundEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });

      expect(foundEvent).toBeDefined();
      expect(foundEvent!.clientId).toBeNull();
    });
  });
});
