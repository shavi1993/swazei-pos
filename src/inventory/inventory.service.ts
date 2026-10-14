import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable() export class InventoryService {
 constructor(private readonly prisma: PrismaService) {}
 private async checkStore(merchantId:string, storeId:string) { const store = await this.prisma.store.findFirst({where:{id:storeId,merchantId}}); if(!store) throw new ForbiddenException('Store is not accessible'); }
 async list(merchantId:string, storeId:string) { await this.checkStore(merchantId,storeId); return this.prisma.inventory.findMany({where:{storeId,store:{merchantId}},include:{product:true}}); }
 async set(merchantId:string, storeId:string, productId:string, quantity:number) {
  await this.checkStore(merchantId,storeId);
  const product = await this.prisma.product.findFirst({where:{id:productId,merchantId,active:true}}); if(!product) throw new NotFoundException('Product not found');
  return this.prisma.inventory.upsert({where:{storeId_productId:{storeId,productId}},create:{storeId,productId,quantity},update:{quantity}});
 }
}
