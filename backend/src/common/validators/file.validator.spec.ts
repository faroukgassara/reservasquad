import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import {
  assertValidImageFile,
  assertValidDocOrImageFile,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
} from './file.validator';

describe('file.validator', () => {
  describe('assertValidImageFile', () => {
    it('throws if file is missing', () => {
      expect(() => assertValidImageFile(undefined)).toThrow(BadRequestException);
    });

    it('accepts valid images (PNG, JPG, WebP, GIF, SVG)', () => {
      const validFiles: Array<Partial<Express.Multer.File>> = [
        { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 1024 },
        { originalname: 'graphic.png', mimetype: 'image/png', size: 2048 },
        { originalname: 'banner.webp', mimetype: 'image/webp', size: 4096 },
        { originalname: 'anim.gif', mimetype: 'image/gif', size: 1024 },
        { originalname: 'vector.svg', mimetype: 'image/svg+xml', size: 512 },
      ];

      for (const file of validFiles) {
        expect(() => assertValidImageFile(file as Express.Multer.File)).not.toThrow();
      }
    });

    it('rejects files with invalid extensions or mimetypes', () => {
      const invalidFiles: Array<Partial<Express.Multer.File>> = [
        { originalname: 'script.exe', mimetype: 'application/x-msdownload', size: 1024 },
        { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 },
        { originalname: 'fake.png', mimetype: 'application/javascript', size: 1024 },
        { originalname: 'malicious.php', mimetype: 'image/png', size: 1024 },
      ];

      for (const file of invalidFiles) {
        expect(() => assertValidImageFile(file as Express.Multer.File)).toThrow(BadRequestException);
      }
    });

    it('rejects image files exceeding 5 MB', () => {
      const oversizedFile: Partial<Express.Multer.File> = {
        originalname: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: MAX_IMAGE_SIZE + 1,
      };

      expect(() => assertValidImageFile(oversizedFile as Express.Multer.File)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertValidDocOrImageFile', () => {
    it('accepts valid PDFs and images', () => {
      const validPdf: Partial<Express.Multer.File> = {
        originalname: 'invoice.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024,
      };
      expect(() => assertValidDocOrImageFile(validPdf as Express.Multer.File)).not.toThrow();
    });

    it('rejects files exceeding 10 MB', () => {
      const oversizedDoc: Partial<Express.Multer.File> = {
        originalname: 'book.pdf',
        mimetype: 'application/pdf',
        size: MAX_DOCUMENT_SIZE + 10,
      };
      expect(() => assertValidDocOrImageFile(oversizedDoc as Express.Multer.File)).toThrow(
        BadRequestException,
      );
    });
  });
});
