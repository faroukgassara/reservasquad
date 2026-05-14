// find-many.proxy.ts

import { DEFAULT_QUERY_LIMIT } from '../../config';
import { PaginationData, ProxyFunctions } from './types';
import { paginatedResponse, PaginatedResponse } from './proxy';


/**
 * FindManyPaginated
 * 
 * type of the findManyPaginated method
 */
export type FindManyPaginated<F extends ProxyFunctions> = {
    findManyPaginated: (
        data?: Omit<Parameters<F['findMany']>[0], 'take' | 'skip'>,
        pagination?: PaginationData,
    ) => Promise<any>;
};


/**
 * makeFindManyPaginated
 * 
 * factory function that creates the findManyPaginated method.
 * this method is used to paginate the results of a findMany method.
 * this method implements js proxy to intercept the call to findMany and add the pagination logic.
 */
export function makeFindManyPaginated<T>(model: ProxyFunctions) {
    return new Proxy(model.findMany, {
        apply: async (target, thisArg, [data, paginationInfo]) => {
            const page = paginationInfo?.page || 1;
            const limit =
                paginationInfo?.perPage || paginationInfo?.perPage === 0
                    ? paginationInfo?.perPage
                    : DEFAULT_QUERY_LIMIT;

            const query = data || {};
            query.take = limit === 0 ? undefined : limit;
            const adjustedLimit = limit ?? 0;
            query.skip = (page - 1) * adjustedLimit;

            const [total, docs] = await Promise.all([
                model.count({
                    where: query.where,
                }),
                target.apply(thisArg, [query]),
            ]);

            const totalPages = Math.ceil(total / limit);
            const resolvedTotalPages = totalPages === Infinity ? 1 : totalPages;
            const hasMore = page < resolvedTotalPages;
            const resolvedPerPage = limit === 0 ? docs.length : limit;


            const responseClass = paginatedResponse<T>();
            return new responseClass(docs,
                total,
                hasMore,
                resolvedTotalPages,
                page,
                resolvedPerPage,
            ) as PaginatedResponse<T>;
        },
    });
}