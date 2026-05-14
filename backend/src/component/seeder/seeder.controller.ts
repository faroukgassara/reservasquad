import { Controller, Get, Post, Param } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller()
export class SeederController {
  constructor(
    private readonly seederService: SeederService
  ) { }

  @Post()
  @Roles({ roles: ['ADMIN'] })
  seedAll() {
    return this.seederService.seedAll();
  }

  @Post(':name')
  @Roles({ roles: ['ADMIN'] })
  seedOne(@Param('name') name: string) {
    return this.seederService.seedOne(name);
  }

  @Get()
  @Roles({ roles: ['ADMIN'] })
  listExecuted() {
    return this.seederService.list();
  }
}
