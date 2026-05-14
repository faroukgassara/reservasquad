import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EJwtStrategy } from 'src/enum/common.enum';
import { IJwtUserPayload } from 'src/interface/request/request.interface';
import { Request } from 'express';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, EJwtStrategy.refreshToken) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IJwtUserPayload): Promise<IJwtUserPayload> {
    const authorizationHeader = req.get('authorization') ?? '';
    const refreshToken = authorizationHeader.replace('Bearer', '').trim();
    return {
      ...payload,
      refreshToken,
    };
  }
}
