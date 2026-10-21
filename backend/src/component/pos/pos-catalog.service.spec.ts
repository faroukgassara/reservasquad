import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PosCatalogService } from './pos-catalog.service';

describe('PosCatalogService (Multipart & Base64 Guard)', () => {
  let service: PosCatalogService;
  let prismaMock: any;
  let fileUploadMock: any;
  let auditMock: any;

  beforeEach(() => {
    prismaMock = {
      posProduct: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      posCategory: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    fileUploadMock = {
      upload: jest.fn(),
    };
    auditMock = {
      record: jest.fn(),
    };
    service = new PosCatalogService(prismaMock, fileUploadMock, auditMock);
  });

  it('rejects base64 data URLs on createProduct with BadRequestException', async () => {
    const dto = {
      name: 'Café Espresso',
      price: 2.5,
      type: 'PHYSICAL',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...',
    } as any;

    await expect(service.createProduct(dto, 'user-1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.posProduct.create).not.toHaveBeenCalled();
  });

  it('rejects base64 data URLs on createCategory with BadRequestException', async () => {
    const dto = {
      name: 'Boissons',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    } as any;

    await expect(service.createCategory(dto, 'user-1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.posCategory.create).not.toHaveBeenCalled();
  });

  it('delegates uploadImage to fileUploadService', async () => {
    const fakeFile = { originalname: 'coffee.jpg' } as Express.Multer.File;
    (fileUploadMock.upload as any).mockResolvedValue('pos-products/coffee-123.jpg');

    const result = await service.uploadImage('pos-products', fakeFile);
    expect(result).toBe('pos-products/coffee-123.jpg');
    expect(fileUploadMock.upload).toHaveBeenCalledWith('pos-products', fakeFile);
  });
});
