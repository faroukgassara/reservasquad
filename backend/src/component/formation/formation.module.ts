import { Module } from '@nestjs/common';
import { FormationService } from './formation.service';
import { FormationBackofficeController } from './formation-backoffice.controller';
import { FormationFrontofficeController } from './formation-frontoffice.controller';
import { CommonServicesModule } from 'src/common/common-services/common-services.module';

@Module({
    imports: [CommonServicesModule],
    controllers: [FormationBackofficeController, FormationFrontofficeController],
    providers: [FormationService],
    exports: [FormationService],
})
export class FormationModule {}
