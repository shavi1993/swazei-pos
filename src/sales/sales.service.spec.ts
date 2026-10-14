import { ConflictException } from '@nestjs/common';
import { SalesService } from './sales.service';

describe('SalesService business rules', () => {
  const prisma: any = {};
  const payment: any = {};
  it('requires an idempotency key', async () => {
    const service = new SalesService(prisma, payment);
    await expect(service.create('merchant','store',undefined,{items:[{productId:'p1',quantity:1}]})).rejects.toThrow('Idempotency-Key');
  });
  it('rejects duplicate product lines so callers combine quantities', async () => {
    prisma.store = { findFirst: jest.fn().mockResolvedValue({ id: 'store' }) };
    const service = new SalesService(prisma, payment);
    await expect(service.create('merchant','store','key-123456',{items:[{productId:'p1',quantity:1},{productId:'p1',quantity:2}]})).rejects.toThrow('Each product may appear only once');
  });
});
