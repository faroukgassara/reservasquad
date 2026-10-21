import { applyDecorators } from '@nestjs/common';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 120;
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
export const PASSWORD_MAX_LENGTH_MESSAGE = `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;
export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one special character';

export interface IsStrongPasswordOptions {
  optional?: boolean;
}

/**
 * Composite class-validator decorator enforcing password complexity rules:
 * - String type
 * - Min length 8
 * - Max length 120
 * - At least one lowercase, one uppercase, and one special character
 */
export function IsStrongPassword(options?: IsStrongPasswordOptions) {
  const decorators: PropertyDecorator[] = [
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE }),
    MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MAX_LENGTH_MESSAGE }),
    Matches(PASSWORD_COMPLEXITY_REGEX, {
      message: PASSWORD_COMPLEXITY_MESSAGE,
    }),
  ];

  if (options?.optional) {
    decorators.unshift(IsOptional());
  } else {
    decorators.unshift(IsNotEmpty());
  }

  return applyDecorators(...decorators);
}
