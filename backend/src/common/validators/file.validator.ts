import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg)$/i;

export const ALLOWED_DOC_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
];

export const ALLOWED_DOC_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|pdf)$/i;

export function assertValidImageFile(file?: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('Aucun fichier fourni.');
  }

  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.test(file.originalname || '');
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype?.toLowerCase());

  if (!hasValidExt || !hasValidMime) {
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Type d\'image non valide. Seuls les formats PNG, JPG, JPEG, WebP, GIF et SVG sont acceptés.',
    });
  }

  if (file.size && file.size > MAX_IMAGE_SIZE) {
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `La taille du fichier dépasse la limite autorisée (${MAX_IMAGE_SIZE / (1024 * 1024)} Mo).`,
    });
  }
}

export function assertValidDocOrImageFile(file?: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('Aucun fichier fourni.');
  }

  const hasValidExt = ALLOWED_DOC_EXTENSIONS.test(file.originalname || '');
  const hasValidMime = ALLOWED_DOC_MIME_TYPES.includes(file.mimetype?.toLowerCase());

  if (!hasValidExt || !hasValidMime) {
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Type de fichier non valide. Seuls les formats PNG, JPG, JPEG, WebP, GIF, SVG et PDF sont acceptés.',
    });
  }

  if (file.size && file.size > MAX_DOCUMENT_SIZE) {
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `La taille du fichier dépasse la limite autorisée (${MAX_DOCUMENT_SIZE / (1024 * 1024)} Mo).`,
    });
  }
}

const onValidateImgOrPdf = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Aucun fichier fourni.',
      }),
      false,
    );
  }

  const hasValidExt = ALLOWED_DOC_EXTENSIONS.test(file.originalname || '');
  const hasValidMime = ALLOWED_DOC_MIME_TYPES.includes(file.mimetype?.toLowerCase());

  if (!hasValidExt || !hasValidMime) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Type de fichier non valide. Seuls les formats PNG, JPG, JPEG, WebP, GIF, SVG ou PDF sont acceptés.',
      }),
      false,
    );
  }

  if (file.size && file.size > MAX_DOCUMENT_SIZE) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La taille du fichier dépasse la limite autorisée (${MAX_DOCUMENT_SIZE / (1024 * 1024)} Mo).`,
      }),
      false,
    );
  }

  callback(null, true);
};

const validateImgOrPdf: MulterOptions = {
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1,
  },
  fileFilter: onValidateImgOrPdf,
};

const onValidateImgOnly = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Aucun fichier fourni.',
      }),
      false,
    );
  }

  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.test(file.originalname || '');
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype?.toLowerCase());

  if (!hasValidExt || !hasValidMime) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Type d\'image non valide. Seuls les formats PNG, JPG, JPEG, WebP, GIF et SVG sont acceptés.',
      }),
      false,
    );
  }

  if (file.size && file.size > MAX_IMAGE_SIZE) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La taille du fichier dépasse la limite autorisée (${MAX_IMAGE_SIZE / (1024 * 1024)} Mo).`,
      }),
      false,
    );
  }

  callback(null, true);
};

const validateImgOnly: MulterOptions = {
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: onValidateImgOnly,
};

const formatClientRegisterFileKey = (environment: string, fileName: string, userId: string): string => {
  return `${environment}/clientRegisterFiles/${userId}/${fileName}`;
};

const formatUserProfilePhotoKey = (environment: string, fileName: string, userId: string): string => {
  return `${environment}/userProfilePhoto/${userId}/${fileName}`;
};

const formatProductImageKey = (environment: string, fileName: string, productId: string): string => {
  return `${environment}/products/images/${productId}/${fileName}`;
};

const formatProductDocumentKey = (environment: string, fileName: string, productId: string): string => {
  return `${environment}/products/documents/${productId}/${fileName}`;
};

const formatPromoImageKey = (environment: string, fileName: string, productId: string): string => {
  return `${environment}/promos/images/${productId}/${fileName}`;
};

const formatPromoDocumentKey = (environment: string, fileName: string, productId: string): string => {
  return `${environment}/promos/documents/${productId}/${fileName}`;
};

const formatLogFileKey = (environment: string, date: string): string => {
  return `${environment}/logs/${date}.log`;
};

export {
  validateImgOrPdf,
  formatClientRegisterFileKey,
  validateImgOnly,
  formatUserProfilePhotoKey,
  formatProductImageKey,
  formatProductDocumentKey,
  formatPromoImageKey,
  formatPromoDocumentKey,
  formatLogFileKey,
};