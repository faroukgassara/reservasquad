import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

const onValidateImgOrPdf = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedExtensions = /\.(jpeg|png|jpg|svg|pdf)$/i;
  if (!allowedExtensions.test(file.originalname)) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid file type. Only PNG, JPG, JPEG, SVG or PDF are allowed.',
      }),
      false,
    );
  }
  callback(null, true);
};

const validateImgOrPdf = {
  fileFilter: onValidateImgOrPdf,
};

const onValidateImgOnly = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedExtensions = /\.(jpeg|png|jpg|svg)$/i;
  if (!allowedExtensions.test(file.originalname)) {
    return callback(
      new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid image type. Only PNG, JPG, JPEG, or SVG are allowed.',
      }),
      false,
    );
  }
  callback(null, true);
};

const validateImgOnly = {
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

export { validateImgOrPdf, formatClientRegisterFileKey, validateImgOnly, formatUserProfilePhotoKey, formatProductImageKey, formatProductDocumentKey, formatPromoImageKey, formatPromoDocumentKey, formatLogFileKey };