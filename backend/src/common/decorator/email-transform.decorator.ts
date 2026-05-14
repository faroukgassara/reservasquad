import { Transform } from 'class-transformer';

/**
 * Decorator to transform email to lowercase
 * This ensures email case insensitivity throughout the application
 */
export function EmailTransform() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  });
}
