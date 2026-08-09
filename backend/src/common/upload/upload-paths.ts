import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Persistent upload root — outside `dist/` so files survive rebuilds and server restarts.
 * Override with UPLOAD_DIR in production if using external storage mount.
 */
export function getUploadRoot(): string {
    const root = process.env.UPLOAD_DIR
        ? resolve(process.env.UPLOAD_DIR)
        : join(process.cwd(), 'public');

    if (!existsSync(root)) {
        mkdirSync(root, { recursive: true });
    }

    return root;
}

export function getUploadTypeDir(type: string): string {
    const dir = join(getUploadRoot(), type);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return dir;
}
