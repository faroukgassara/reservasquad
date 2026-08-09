import { Request } from 'express';
import { AuthUserPayloadDto } from 'src/dto/login/authUserPayload.dto';

interface IJwtUserPayload extends AuthUserPayloadDto {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  refreshToken?: string;
}

interface IRequest extends Request {
  user?: IJwtUserPayload;
}

export { IRequest, IJwtUserPayload };
