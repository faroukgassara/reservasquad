import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EJwtStrategy } from 'src/enum/common.enum';
import { IJwtUserPayload } from 'src/interface/request/request.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { EStatus } from 'src/generated/prisma/client';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, EJwtStrategy.accessToken) {
  constructor(
    private readonly config: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: IJwtUserPayload) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tokenVersion: true,
        deletedAt: true,
        archivedAt: true,
      },
    });

    if (
      !user ||
      user.deletedAt ||
      user.archivedAt ||
      user.status !== EStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Token invalidated');
    }

    return {
      id: payload.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
