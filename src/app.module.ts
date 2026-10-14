import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { StoresController } from './stores/stores.controller';
import { StoresService } from './stores/stores.service';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryService } from './inventory/inventory.service';
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.service';
import { MockPaymentProvider } from './payments/mock-payment.provider';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RedisCacheService } from './common/redis-cache.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.register({})],
  controllers: [AuthController, ProductsController, StoresController, InventoryController, SalesController],
  providers: [PrismaService, AuthService, ProductsService, StoresService, InventoryService, SalesService, MockPaymentProvider, JwtAuthGuard, RedisCacheService],
})
export class AppModule {}
