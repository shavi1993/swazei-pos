import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoresService } from './stores.service';
@ApiTags('stores') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('stores')
export class StoresController { constructor(private readonly service: StoresService) {} @Get() list(@CurrentUser() user: any) { return this.service.list(user.merchantId); } }
