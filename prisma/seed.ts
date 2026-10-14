import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
 const merchant=await prisma.merchant.upsert({where:{id:'demo-merchant'},update:{},create:{id:'demo-merchant',name:'Demo Merchant'}});
 const store=await prisma.store.upsert({where:{id:'demo-store'},update:{},create:{id:'demo-store',name:'Main Store',merchantId:merchant.id}});
 const passwordHash=await bcrypt.hash('DemoPass123!',10);
 await prisma.user.upsert({where:{email:'owner@example.com'},update:{},create:{email:'owner@example.com',passwordHash,role:UserRole.OWNER,merchantId:merchant.id}});
 const p1=await prisma.product.upsert({where:{merchantId_sku:{merchantId:merchant.id,sku:'COFFEE-001'}},update:{},create:{name:'Coffee',sku:'COFFEE-001',priceCents:500,merchantId:merchant.id}});
 const p2=await prisma.product.upsert({where:{merchantId_sku:{merchantId:merchant.id,sku:'TEA-001'}},update:{},create:{name:'Tea',sku:'TEA-001',priceCents:300,merchantId:merchant.id}});
 await prisma.inventory.upsert({where:{storeId_productId:{storeId:store.id,productId:p1.id}},update:{},create:{storeId:store.id,productId:p1.id,quantity:20}});
 await prisma.inventory.upsert({where:{storeId_productId:{storeId:store.id,productId:p2.id}},update:{},create:{storeId:store.id,productId:p2.id,quantity:15}});
 console.log('Seeded demo data. Login: owner@example.com / DemoPass123!');
}
main().finally(()=>prisma.$disconnect());
