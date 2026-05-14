import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { EJwtStrategy } from 'src/enum/common.enum';
import { IS_PUBLIC_KEY, STRATEGY_KEY } from '../decorator/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard([EJwtStrategy.accessToken, EJwtStrategy.refreshToken]) {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic === true) return true;

        const strategy = this.reflector.getAllAndOverride<EJwtStrategy>(
            STRATEGY_KEY,
            [context.getHandler(), context.getClass()]
        ) || EJwtStrategy.accessToken;

       
        (this as any).strategies = [strategy];

        return super.canActivate(context) as Promise<boolean>;
    }

    handleRequest(err, user) {
        if (err || !user) throw new UnauthorizedException('Unauthorized');
        return user;
    }
}