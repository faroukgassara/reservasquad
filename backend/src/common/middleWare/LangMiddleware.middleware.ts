import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { ELang } from 'src/enum/lang.enum';

@Injectable()
export class LangMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const lang = req.params.lang;
    if (lang !== ELang.fr && lang !== ELang.en) {
      throw new BadRequestException('Invalid lang !');
    }
    req.lang = lang;
    next();
  }
}
