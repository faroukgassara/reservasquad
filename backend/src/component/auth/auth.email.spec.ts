import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService (Email Failure Handling & Logging)', () => {
  let service: AuthService;
  let prismaMock: any;
  let configServiceMock: any;
  let fileUploadMock: any;
  let emailMock: any;
  let commonFunctionMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      professor: {
        findFirst: jest.fn(),
      },
      passwordResetToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      emailActivationToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(prismaMock);
      }),
    };

    configServiceMock = {
      get: jest.fn().mockReturnValue({
        FRONT_URL: 'http://localhost:3000',
        SMTP_SEND: 'noreply@bibliosquad.com',
        HOST: 'localhost',
        PORT: 4000,
      }),
    };

    fileUploadMock = {
      renderTemplate: jest.fn<any>().mockResolvedValue('<html>Email Template</html>'),
    };

    emailMock = {
      sendMail: jest.fn<any>(),
      getBiblioSquadLogoAttachment: jest.fn<any>().mockReturnValue({
        filename: 'logo.png',
        content: Buffer.from('logo'),
        contentType: 'image/png',
        cid: 'bibliosquad-logo',
      }),
    };

    commonFunctionMock = {
      generateResetPasswordToken: jest.fn<any>().mockReturnValue('reset-token-123'),
      hashResetPasswordToken: jest.fn<any>().mockReturnValue('hash-123'),
    };

    service = new AuthService(
      prismaMock,
      configServiceMock,
      fileUploadMock,
      emailMock,
      commonFunctionMock,
    );
  });

  describe('generateResetToken (Password Reset Email)', () => {
    it('awaits sendMail and succeeds when email is sent successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'John' };
      (prismaMock.user.findUnique as any).mockResolvedValue(mockUser);
      (emailMock.sendMail as any).mockResolvedValue({ messageId: 'msg-1' });

      const result = await service.generateResetToken('test@example.com');
      expect(result).toBe(mockUser);
      expect(emailMock.sendMail).toHaveBeenCalledTimes(1);
      expect(emailMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Demande de réinitialisation de mot de passe',
        }),
      );
    });

    it('reports failure with BadRequestException when emailService.sendMail returns null', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'John' };
      (prismaMock.user.findUnique as any).mockResolvedValue(mockUser);
      (emailMock.sendMail as any).mockResolvedValue(null);

      await expect(service.generateResetToken('test@example.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generateResetToken('test@example.com')).rejects.toThrow(
        'The password reset email could not be sent',
      );
    });

    it('reports failure with BadRequestException when emailService.sendMail throws', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'John' };
      (prismaMock.user.findUnique as any).mockResolvedValue(mockUser);
      (emailMock.sendMail as any).mockRejectedValue(new Error('SMTP connection timed out'));

      await expect(service.generateResetToken('test@example.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generateResetToken('test@example.com')).rejects.toThrow(
        'The password reset email could not be sent',
      );
    });
  });

  describe('inviteProfessor (Professor Portal Invitation Email)', () => {
    it('succeeds when invitation email is sent successfully', async () => {
      const mockProfessor = {
        id: 'prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        user: null,
      };
      const mockCreatedUser = {
        id: 'user-prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        status: 'INACTIVE',
      };

      (prismaMock.professor.findFirst as any).mockResolvedValue(mockProfessor);
      (prismaMock.user.findUnique as any).mockResolvedValue(null);
      (prismaMock.user.create as any).mockResolvedValue(mockCreatedUser);
      (emailMock.sendMail as any).mockResolvedValue({ messageId: 'msg-prof-1' });

      const result = await service.inviteProfessor('prof-1');
      expect(result).toEqual({ email: 'jane@example.com', resent: false });
      expect(emailMock.sendMail).toHaveBeenCalledTimes(1);
      expect(emailMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: 'Votre accès au portail professeur Biblio Squad',
        }),
      );
    });

    it('reports failure with BadRequestException when invitation email sending fails', async () => {
      const mockProfessor = {
        id: 'prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        user: null,
      };
      const mockCreatedUser = {
        id: 'user-prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        status: 'INACTIVE',
      };

      (prismaMock.professor.findFirst as any).mockResolvedValue(mockProfessor);
      (prismaMock.user.findUnique as any).mockResolvedValue(null);
      (prismaMock.user.create as any).mockResolvedValue(mockCreatedUser);
      (emailMock.sendMail as any).mockResolvedValue(null);

      await expect(service.inviteProfessor('prof-1')).rejects.toThrow(BadRequestException);
      await expect(service.inviteProfessor('prof-1')).rejects.toThrow(
        'The invitation email could not be sent',
      );
    });

    it('reports failure with BadRequestException when invitation email sending throws', async () => {
      const mockProfessor = {
        id: 'prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        user: null,
      };
      const mockCreatedUser = {
        id: 'user-prof-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        status: 'INACTIVE',
      };

      (prismaMock.professor.findFirst as any).mockResolvedValue(mockProfessor);
      (prismaMock.user.findUnique as any).mockResolvedValue(null);
      (prismaMock.user.create as any).mockResolvedValue(mockCreatedUser);
      (emailMock.sendMail as any).mockRejectedValue(new Error('Network error'));

      await expect(service.inviteProfessor('prof-1')).rejects.toThrow(BadRequestException);
      await expect(service.inviteProfessor('prof-1')).rejects.toThrow(
        'The invitation email could not be sent',
      );
    });
  });
});
