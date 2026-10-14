import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';
class SetStockDto { @IsInt() @Min(0) quantity: number; }
@ApiTags('inventory') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('stores/:storeId/inventory')
export class InventoryController {
 constructor(private readonly service: InventoryService) {}
 @Get() list(@CurrentUser() user:any, @Param('storeId') storeId:string) { return this.service.list(user.merchantId, storeId); }
 @Put(':productId') set(@CurrentUser() user:any, @Param('storeId') storeId:string, @Param('productId') productId:string, @Body() dto:SetStockDto) { return this.service.set(user.merchantId, storeId, productId, dto.quantity); }
}
