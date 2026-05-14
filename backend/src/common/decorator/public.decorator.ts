import { SetMetadata } from '@nestjs/common';
import { EJwtStrategy } from 'src/enum/common.enum';

export const IS_PUBLIC_KEY = 'isPublic';
export const STRATEGY_KEY = 'strategy';

export const Public = (isPublic: boolean = true, strategy: EJwtStrategy = EJwtStrategy.accessToken) => {
    return (target: any, key?: any, descriptor?: any) => {
        SetMetadata(IS_PUBLIC_KEY, isPublic)(target, key, descriptor);
        SetMetadata(STRATEGY_KEY, strategy)(target, key, descriptor);
    };
};