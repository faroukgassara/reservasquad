import { describe, it, expect } from '@jest/globals';
import { validate } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './password-rules.constant';

class TestDto {
  @IsStrongPassword()
  password!: string;
}

class TestOptionalDto {
  @IsStrongPassword({ optional: true })
  password?: string;
}

describe('password-rules.constant', () => {
  it('exports consistent constants', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_LENGTH).toBe(120);
    expect(PASSWORD_COMPLEXITY_REGEX).toBeInstanceOf(RegExp);
  });

  describe('IsStrongPassword decorator', () => {
    it('passes for a valid strong password', async () => {
      const dto = new TestDto();
      dto.password = 'P@ssw0rd123';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const dto = new TestDto();
      dto.password = 'P@ss1';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isLength || errors[0].constraints?.minLength).toContain(
        'at least 8 characters',
      );
    });

    it('rejects passwords longer than 120 characters', async () => {
      const dto = new TestDto();
      dto.password = `A1@${'a'.repeat(125)}`;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.maxLength).toContain('cannot exceed 120 characters');
    });

    it('rejects passwords missing lowercase characters', async () => {
      const dto = new TestDto();
      dto.password = 'PASSWORD123!';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.matches).toContain('lowercase letter');
    });

    it('rejects passwords missing uppercase characters', async () => {
      const dto = new TestDto();
      dto.password = 'password123!';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.matches).toContain('uppercase letter');
    });

    it('rejects passwords missing special characters', async () => {
      const dto = new TestDto();
      dto.password = 'Password123';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.matches).toContain('special character');
    });

    it('allows undefined or null when optional: true', async () => {
      const dto = new TestOptionalDto();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
