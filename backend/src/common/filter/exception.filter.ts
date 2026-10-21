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
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let exceptionObject =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            ...exception,
          };

    if (exception?.name === 'MulterError') {
      status =
        exception.code === 'LIMIT_FILE_SIZE'
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;
      exceptionObject = {
        statusCode: status,
        message:
          exception.code === 'LIMIT_FILE_SIZE'
            ? 'Fichier trop volumineux. La taille maximale autorisée est de 5 Mo.'
            : exception.message || 'Erreur lors du téléversement du fichier',
        error: exception.name,
      };
    }

    response.status(status).send({
      ...(typeof exceptionObject === 'object' ? exceptionObject : { message: exceptionObject }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
