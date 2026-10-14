import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    const accessToken = await this.jwt.signAsync({ sub: user.id, merchantId: user.merchantId, role: user.role }, { secret: process.env.JWT_SECRET, expiresIn: '8h' });
    return { accessToken, tokenType: 'Bearer', expiresIn: '8h' };
  }
}
