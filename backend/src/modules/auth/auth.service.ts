import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    // bcryptjs is used here as a pure-JS hashing library for compatibility across Windows/Linux without native rebuilds.
    const passwordHash = await new Promise<string>((resolve, reject) =>
      bcrypt.hash(dto.password, 12, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      }),
    );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role ?? 'TRAVELER',
        wallet: { create: { balance: 0 } },
      },
    });

    return this.issueTokens(user.id, user.email, user.role ?? 'TRAVELER');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await new Promise<boolean>((resolve) =>
      bcrypt.compare(dto.password, user.passwordHash, (err, result) => resolve(result && !err)),
    );
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('This account has been suspended');

    return this.issueTokens(user.id, user.email, user.role ?? 'TRAVELER');
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, revoked: false },
      orderBy: { createdAt: 'desc' },
    });
    // Compare hashes rather than storing the raw refresh token at rest.
    const refreshTokenMatches = stored
      ? await new Promise<boolean>((resolve) =>
          bcrypt.compare(refreshToken, stored.tokenHash, (err, result) => resolve(result && !err)),
        )
      : false;

    if (!stored || !refreshTokenMatches) {
      throw new UnauthorizedException('Refresh token not recognized — please log in again');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User no longer exists');

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return this.issueTokens(user.id, user.email, user.role ?? 'TRAVELER');
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const tokenHash = await new Promise<string>((resolve, reject) =>
      bcrypt.hash(refreshToken, 12, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      }),
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role },
    };
  }
}
