import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves the absolute path of a CSV file within the seeder data directory.
 * Searches in multiple locations to ensure compatibility across:
 * - Local development (ts-node / src/)
 * - NestJS compiled output (dist/)
 * - Cloud/CI/CD deployment environments (Docker, Render, etc.)
 */
export function resolveCsvPath(fileName: string): string {
  const candidates = [
    // 1. Same directory as the calling file (works in dev ts-node and when assets are copied to dist)
    path.join(__dirname, fileName),
    // 2. Relative navigate from dist/... to src/...
    path.resolve(__dirname, '../../../../src/component/seeder/data', fileName),
    // 3. Current working directory relative to src
    path.resolve(process.cwd(), 'src/component/seeder/data', fileName),
    // 4. Current working directory relative to backend/src
    path.resolve(process.cwd(), 'backend/src/component/seeder/data', fileName),
    // 5. Current working directory relative to dist
    path.resolve(process.cwd(), 'dist/component/seeder/data', fileName),
    // 6. Current working directory relative to backend/dist
    path.resolve(process.cwd(), 'backend/dist/component/seeder/data', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to the direct __dirname path (calling seeder can log or throw descriptive error)
  return path.join(__dirname, fileName);
}
