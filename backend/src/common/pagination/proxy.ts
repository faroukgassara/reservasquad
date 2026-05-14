// prisma-proxy.ts
import { FindManyPaginated, makeFindManyPaginated } from './find-many.proxy'
import { ProxyFunctions } from './types';

/**
 * ProxyPrismaModel
 * 
 * type of a prisma model with custom methods. to date, only findManyPaginated is implemented
 */
type ProxyPrismaModel<F extends ProxyFunctions> = F & FindManyPaginated<F>;


/**
 * ProxyPrismaModel
 * 
 * the factory function that creates a ProxyPrismaModel. to date, only findManyPaginated is implemented.
 */
export function ProxyPrismaModel<F extends ProxyFunctions>(
    model: F,
): ProxyPrismaModel<F> {
    Reflect.set(model, 'findManyPaginated', makeFindManyPaginated(model));
    // Reflect.set(model, 'anotherProxiedMethod', makeAnotherProxyMethod(model));
    // ...
    return model as ProxyPrismaModel<F>;
}

export function paginatedResponse<T>() {
    return class {
        data: T[];
        meta: {
            total: number;
            currentPage: number;
            perPage: number;
            lastPage: number;
            prev: number | null;
            next: number | null;
            hasMore: boolean;
        };

        constructor(data: T[], total: number, hasMore: boolean, totalPages: number, currentPage: number, perPage: number) {
            this.data = data;
            this.meta = {
                total,
                currentPage,
                perPage,
                lastPage: totalPages,
                prev: currentPage > 1 ? currentPage - 1 : null,
                next: hasMore ? currentPage + 1 : null,
                hasMore,
            };
        }
    };
}

export type PaginatedResponse<T> = InstanceType<ReturnType<typeof paginatedResponse<T>>>;