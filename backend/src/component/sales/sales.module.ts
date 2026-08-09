import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { QuoteService } from './quote.service';
import { InvoiceService } from './invoice.service';
import { DocumentSequenceService } from './document-sequence.service';
import { CustomerBackofficeController } from './customer-backoffice.controller';
import { QuoteBackofficeController } from './quote-backoffice.controller';
import { InvoiceBackofficeController } from './invoice-backoffice.controller';

@Module({
  controllers: [
    CustomerBackofficeController,
    QuoteBackofficeController,
    InvoiceBackofficeController,
  ],
  providers: [
    CustomerService,
    QuoteService,
    InvoiceService,
    DocumentSequenceService,
  ],
  exports: [DocumentSequenceService],
})
export class SalesModule {}
