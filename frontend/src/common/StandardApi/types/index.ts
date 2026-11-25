import { HttpStatus } from "../interfaces/EHttpStatus";
import { ApiHeaders } from "../interfaces/common";

export type HeaderObject = {
    Authorization: string;
    'Content-Type': string;
    accept: string;
    [key: string]: string;
};
export type RequestHeaders = ApiHeaders | Record<string, string>;
export interface RefreshJson extends Partial<Response> {
    accessToken: string;
    refreshtoken: string;
}
export interface ApiResponse {
    status: HttpStatus;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON boundary; callers outside this module read nested fields without narrowing
    data: any;
    originalResponse?: Response;
}
