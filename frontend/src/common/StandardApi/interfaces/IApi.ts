import { ApiResponse, RequestHeaders } from '../types';
import { IRefreshApiResponse } from '@/interfaces';

export interface IApi {
    get(endPoint: string, headers: RequestHeaders, refrechCallback: () => Promise<IRefreshApiResponse>): Promise<ApiResponse>;
    delete(endPoint: string, body: unknown, headers: RequestHeaders, refrechCallback: () => Promise<IRefreshApiResponse>): Promise<ApiResponse>;
    post(endPoint: string, body: unknown, headers: RequestHeaders, refrechCallback: () => Promise<IRefreshApiResponse>): Promise<ApiResponse>;
    put(endPoint: string, body: unknown, headers: RequestHeaders, refrechCallback: () => Promise<IRefreshApiResponse>): Promise<ApiResponse>;
    patch(endPoint: string, body: unknown, headers: RequestHeaders, refrechCallback: () => Promise<IRefreshApiResponse>): Promise<ApiResponse>;
}
