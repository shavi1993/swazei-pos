import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
class CreateProductDto { @IsString() @MinLength(1) name: string; @IsString() sku: string; @IsInt() @Min(0) priceCents: number; }
@ApiTags('products') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('products')
export class ProductsController {
 constructor(private readonly service: ProductsService) {}
 @Get() list(@CurrentUser() user: any) { return this.service.list(user.merchantId); }
 @Post() create(@CurrentUser() user: any, @Body() dto: CreateProductDto) { return this.service.create(user.merchantId, dto); }
}
