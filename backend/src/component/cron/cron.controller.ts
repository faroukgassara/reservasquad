import { Controller, UseGuards } from '@nestjs/common';

import { ApiTags, } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { CronService } from './cron.service';

@ApiTags('Cron Jobs')
@Controller('cron')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CronController {
    constructor(private cronService: CronService) { }

}
