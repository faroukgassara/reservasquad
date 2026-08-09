import { Controller } from '@nestjs/common';
import { IEnv } from './common/env/env';

@Controller()
export class AppController {
  readonly config: IEnv;
  constructor() {}
}
