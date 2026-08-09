import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Safely extract a human-readable message from a caught `unknown` value.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
        const response = error.getResponse();
        if (typeof response === 'string') {
            return response;
        }
        if (typeof response === 'object' && response !== null && 'message' in response) {
            const message = (response as { message: unknown }).message;
            return Array.isArray(message) ? message.join(', ') : String(message);
        }
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
    }

    return String(error);
}

/**
 * Safely extract an HTTP status from a caught `unknown` value.
 * Supports Nest `HttpException`, and plain objects with `status` / `statusCode`.
 */
export function getErrorStatus(
    error: unknown,
    fallback: number = HttpStatus.INTERNAL_SERVER_ERROR,
): number {
    if (error instanceof HttpException) {
        return error.getStatus();
    }

    if (typeof error === 'object' && error !== null) {
        const candidate = error as { status?: unknown; statusCode?: unknown };
        if (typeof candidate.statusCode === 'number') {
            return candidate.statusCode;
        }
        if (typeof candidate.status === 'number') {
            return candidate.status;
        }
    }

    return fallback;
}

/**
 * Respond to a controller `catch` with the correct status and payload.
 * - 4xx → `{ statusCode, message }`
 * - 5xx → `{ statusCode, error }`
 */
export function sendCaughtError(res: Response, error: unknown) {
    const statusCode = getErrorStatus(error);
    const message = getErrorMessage(error);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        return res.status(statusCode).json({
            statusCode,
            error: message,
        });
    }

    return res.status(statusCode).json({
        statusCode,
        message,
    });
}
