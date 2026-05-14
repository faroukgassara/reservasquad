import { Module } from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';
import { ContactMessageFrontofficeController } from './contact-message-frontoffice.controller';
import { ContactMessageBackofficeController } from './contact-message-backoffice.controller';

@Module({
    controllers: [ContactMessageFrontofficeController, ContactMessageBackofficeController],
    providers: [ContactMessageService],
    exports: [ContactMessageService],
})
export class ContactMessageModule {}
