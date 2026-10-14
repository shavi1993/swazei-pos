import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable() export class StoresService { constructor(private readonly prisma: PrismaService) {} list(merchantId: string) { return this.prisma.store.findMany({ where: { merchantId }, orderBy: { name: 'asc' } }); } }
