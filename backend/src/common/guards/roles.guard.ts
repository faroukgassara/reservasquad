// src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorator/roles.decorator';
import { IS_PUBLIC_KEY, STRATEGY_KEY } from '../decorator/public.decorator';
import { EJwtStrategy } from 'src/enum/common.enum';

/** Roles that may only reach endpoints which list them explicitly in @Roles. */
const RESTRICTED_ROLES = new Set(['PROFESSOR']);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);
    const { user } = context.switchToHttp().getRequest();

    if (!requiredRoles || requiredRoles.length === 0) {
      if (!user?.role || !RESTRICTED_ROLES.has(user.role)) return true;

      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
      const strategy = this.reflector.getAllAndOverride<EJwtStrategy>(STRATEGY_KEY, targets);
      // Refresh-token routes (refresh, logout) must stay reachable for every role.
      if (isPublic === true || strategy === EJwtStrategy.refreshToken) return true;

      throw new ForbiddenException('Access denied: insufficient role.');
    }

    if (!user?.role) {
      throw new ForbiddenException('No user role information found.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied: insufficient role.');
    }

    return true;
  }
}
