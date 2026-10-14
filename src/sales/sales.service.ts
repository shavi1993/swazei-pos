import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentProvider } from '../payments/mock-payment.provider';
@Injectable()
export class SalesService {
 constructor(private readonly prisma:PrismaService, private readonly payment:MockPaymentProvider) {}
 async create(merchantId:string,storeId:string,key:string|undefined,dto:{items:{productId:string;quantity:number}[];simulatePaymentFailure?:boolean}) {
  if(!key || key.trim().length<8) throw new BadRequestException('Provide an Idempotency-Key header with at least 8 characters');
  const store = await this.prisma.store.findFirst({where:{id:storeId,merchantId}}); if(!store) throw new ForbiddenException('Store is not accessible');
  const normalized=[...dto.items].sort((a,b)=>a.productId.localeCompare(b.productId));
  if(new Set(normalized.map(i=>i.productId)).size!==normalized.length) throw new BadRequestException('Each product may appear only once; combine quantities');
  const requestHash=createHash('sha256').update(JSON.stringify({items:normalized,simulatePaymentFailure:!!dto.simulatePaymentFailure})).digest('hex');
  const existing=await this.prisma.sale.findUnique({where:{storeId_idempotencyKey:{storeId,idempotencyKey:key}},include:{items:true,payment:true}});
  if(existing) { if(existing.requestHash!==requestHash) throw new ConflictException('Idempotency key was already used with a different request'); return existing; }
  let attemptedTotalCents = 0;
  let attemptedLines: {productId:string;quantity:number;unitPriceCents:number}[] = [];
  try {
   return await this.prisma.$transaction(async tx=>{
    const prior=await tx.sale.findUnique({where:{storeId_idempotencyKey:{storeId,idempotencyKey:key}},include:{items:true,payment:true}});
    if(prior) { if(prior.requestHash!==requestHash) throw new ConflictException('Idempotency key was already used with a different request'); return prior; }
    const ids=normalized.map(i=>i.productId);
    const products=await tx.product.findMany({where:{id:{in:ids},merchantId,active:true}});
    if(products.length!==ids.length) throw new NotFoundException('One or more products were not found for this merchant');
    const byId=new Map(products.map(p=>[p.id,p]));
    const lines=normalized.map(i=>({productId:i.productId,quantity:i.quantity,unitPriceCents:byId.get(i.productId)!.priceCents}));
    const totalCents=lines.reduce((sum,l)=>sum+l.quantity*l.unitPriceCents,0);
    attemptedTotalCents = totalCents; attemptedLines = lines;
    if(!Number.isSafeInteger(totalCents) || totalCents<0) throw new BadRequestException('Invalid sale total');
    // Conditional updates avoid overselling under concurrent requests. All updates roll back if any line fails.
    for(const line of lines) {
      const changed=await tx.inventory.updateMany({where:{storeId,productId:line.productId,quantity:{gte:line.quantity}},data:{quantity:{decrement:line.quantity}}});
      if(changed.count!==1) throw new ConflictException(`Insufficient inventory for product ${line.productId}`);
    }
    const result=await this.payment.processPayment({amountCents:totalCents,idempotencyKey:key,simulateFailure:dto.simulatePaymentFailure});
    const status:SaleStatus=result.status==='SUCCESS'?'COMPLETED':'FAILED';
    // Payment failure must not consume stock; transaction rollback is triggered below.
    if(result.status==='FAILED') throw new PaymentFailedRollback();
    const sale=await tx.sale.create({data:{storeId,idempotencyKey:key,requestHash,totalCents,status,items:{create:lines}},include:{items:true}});
    await tx.payment.create({data:{saleId:sale.id,amountCents:totalCents,status:result.status,reference:result.reference}});
    return {...sale,payment:{status:result.status,reference:result.reference,amountCents:totalCents}};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:10000});
  } catch(e:any) {
   if(e instanceof PaymentFailedRollback) {
    // Record a failed attempt after stock updates have been rolled back.
    const pay=await this.payment.processPayment({amountCents:attemptedTotalCents,idempotencyKey:key,simulateFailure:true});
    try { return await this.prisma.sale.create({data:{storeId,idempotencyKey:key,requestHash,totalCents:attemptedTotalCents,status:'FAILED',items:{create:attemptedLines},payment:{create:{amountCents:attemptedTotalCents,status:'FAILED',reference:pay.reference}}},include:{items:true,payment:true}}); }
    catch (recordError:any) { if(recordError.code==='P2002') return this.getByKey(storeId,key); throw recordError; }
   }
   if(e.code==='P2002') { const prior=await this.getByKey(storeId,key); if(prior.requestHash!==requestHash) throw new ConflictException('Idempotency key was already used with a different request'); return prior; }
   if(e.code==='P2034') throw new ConflictException('Concurrent inventory update; please retry with the same idempotency key');
   throw e;
  }
 }
 private getByKey(storeId:string,key:string) { return this.prisma.sale.findUniqueOrThrow({where:{storeId_idempotencyKey:{storeId,idempotencyKey:key}},include:{items:true,payment:true}}); }
 async list(merchantId:string,storeId:string) { await this.checkStore(merchantId,storeId); return this.prisma.sale.findMany({where:{storeId,store:{merchantId}},include:{items:true,payment:true},orderBy:{createdAt:'desc'}}); }
 async get(merchantId:string,storeId:string,saleId:string) { await this.checkStore(merchantId,storeId); const sale=await this.prisma.sale.findFirst({where:{id:saleId,storeId,store:{merchantId}},include:{items:true,payment:true}}); if(!sale) throw new NotFoundException('Sale not found'); return sale; }
 private async checkStore(merchantId:string,storeId:string) { const store=await this.prisma.store.findFirst({where:{id:storeId,merchantId}}); if(!store) throw new ForbiddenException('Store is not accessible'); }
}
class PaymentFailedRollback extends Error {}
