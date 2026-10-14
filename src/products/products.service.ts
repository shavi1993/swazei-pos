import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../common/redis-cache.service';
@Injectable()
export class ProductsService {
 constructor(private readonly prisma: PrismaService, private readonly cache: RedisCacheService) {}
 async list(merchantId: string) {
  const key = `products:merchant:${merchantId}`;
  const cached = await this.cache.get<any[]>(key);
  if (cached) return cached;
  const products = await this.prisma.product.findMany({ where: { merchantId, active: true }, orderBy: { name: 'asc' } });
  await this.cache.set(key, products, 60);
  return products;
 }
 async create(merchantId: string, dto: {name:string;sku:string;priceCents:number}) {
  try { const product = await this.prisma.product.create({ data: { ...dto, merchantId } }); await this.cache.deleteByPrefix(`products:merchant:${merchantId}`); return product; }
  catch (e: any) { if (e.code === 'P2002') throw new ConflictException('SKU already exists for this merchant'); throw e; }
 }
}
