import { Request } from 'express';
import { AuthUserPayloadDto } from 'src/dto/login/authUserPayload.dto';

interface IJwtUserPayload extends AuthUserPayloadDto {
  email: string;
  role: string;
  refreshToken?: string;
}

interface IRequest extends Request {
  user?: IJwtUserPayload;
}

export { IRequest, IJwtUserPayload };
