import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
class SaleItemDto { @IsString() productId: string; @IsInt() @Min(1) quantity: number; }
class CreateSaleDto { @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>SaleItemDto) items: SaleItemDto[]; @IsOptional() @IsBoolean() simulatePaymentFailure?: boolean; }
@ApiTags('sales') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('stores/:storeId/sales')
export class SalesController {
 constructor(private readonly service:SalesService) {}
 @Post() create(@CurrentUser() user:any,@Param('storeId') storeId:string,@Headers('idempotency-key') key:string,@Body() dto:CreateSaleDto) { return this.service.create(user.merchantId,storeId,key,dto); }
 @Get() list(@CurrentUser() user:any,@Param('storeId') storeId:string) { return this.service.list(user.merchantId,storeId); }
 @Get(':saleId') get(@CurrentUser() user:any,@Param('storeId') storeId:string,@Param('saleId') saleId:string) { return this.service.get(user.merchantId,storeId,saleId); }
}
