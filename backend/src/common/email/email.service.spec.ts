import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as ejs from 'ejs';

describe('emailService', () => {
  let service: EmailService;
  const mockEjs = {
    renderFile: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ejs,
          useValue: mockEjs,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should send mail', async () => {
    const spy = jest.spyOn(service, 'sendMail');
    await service.sendMail({
      to: 'reciever',
      from: 'sender',
      subject: 'object',
      attachement: [],
      template: 'template',
    });
    expect(spy).toBeCalled();
  });
  it('should render template', async () => {
    ejs.renderFile = mockEjs.renderFile.mockResolvedValueOnce('filePath');
    const spy = jest.spyOn(service, 'renderTemplate');
    await service.renderTemplate('comtent', 'template name');
    expect(spy).toBeCalled();
  });
});
