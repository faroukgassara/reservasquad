import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionObject = exception instanceof HttpException ? exception.getResponse() : {
      statusCode: status,
      ...exception,
    }
    response.status(status).send({
      ...exceptionObject,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
