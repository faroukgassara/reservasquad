import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { RoomService } from './room.service';

describe('RoomService (Multipart & Base64 Guard)', () => {
  let service: RoomService;
  let prismaMock: any;
  let fileUploadMock: any;

  beforeEach(() => {
    prismaMock = {
      room: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    fileUploadMock = {
      upload: jest.fn(),
    };
    service = new RoomService(prismaMock, fileUploadMock);
  });

  it('rejects base64 data URLs on createRoom with BadRequestException', async () => {
    const dto = {
      name: 'Salle 1',
      capacity: 10,
      pricePerHour: 15,
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    await expect(service.createRoom(dto)).rejects.toThrow(BadRequestException);
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it('allows relative image path on createRoom', async () => {
    const dto = {
      name: 'Salle 1',
      capacity: 10,
      pricePerHour: 15,
      imageUrl: 'coworking-rooms/room-uuid.jpg',
    };

    (prismaMock.room.create as any).mockResolvedValue({ id: 'room-1', ...dto });

    const result = await service.createRoom(dto);
    expect(result.id).toBe('room-1');
    expect(prismaMock.room.create).toHaveBeenCalledWith({
      data: {
        name: 'Salle 1',
        capacity: 10,
        pricePerHour: 15,
        imageUrl: 'coworking-rooms/room-uuid.jpg',
      },
    });
  });

  it('rejects base64 data URLs on updateRoom with BadRequestException', async () => {
    (prismaMock.room.findFirst as any).mockResolvedValue({ id: 'room-1', name: 'Salle 1' });

    const dto = {
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
    };

    await expect(service.updateRoom('room-1', dto)).rejects.toThrow(BadRequestException);
    expect(prismaMock.room.update).not.toHaveBeenCalled();
  });

  it('delegates uploadRoomImage to fileUploadService.upload with coworking-rooms type', async () => {
    const fakeFile = { originalname: 'test.jpg' } as Express.Multer.File;
    (fileUploadMock.upload as any).mockResolvedValue('coworking-rooms/abc.jpg');

    const result = await service.uploadRoomImage(fakeFile);
    expect(result).toBe('coworking-rooms/abc.jpg');
    expect(fileUploadMock.upload).toHaveBeenCalledWith('coworking-rooms', fakeFile);
  });
});
