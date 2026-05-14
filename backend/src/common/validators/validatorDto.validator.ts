import {
    PipeTransform,
    ArgumentMetadata,
    HttpStatus,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            const finalErros = []
            const getErrors = (list: Array<any>, errors: ValidationError[], parent: string = "") => {
                errors.forEach((err) => {
                    const field = parent + err.property
                    const errorsToShow = Object.values(err.constraints || {})
                    const errorsKeys = Object.keys(err.constraints || {})
                    if (!err.children?.length) {
                        list.push(
                            {
                                field: field,
                                erros: errorsToShow,
                                errorKeys: errorsKeys
                            }
                        )
                    } else {
                        return getErrors(list, err.children, field + ".")
                    }
                })
                return list
            }
            throw new BadRequestException({
                message: 'Validation failed',
                statusCode: HttpStatus.BAD_REQUEST,
                // errors: errors.map((err) => ({
                //   field: err.property,
                //   errors: Object.values(err.constraints || {}),
                // })),
                // errors: errors,
                errors: getErrors(finalErros, errors),
                timestamp: new Date().toISOString(),
                path: metadata.data || 'unknown',
            });
        }
        return value;
    }
    private toValidate(metatype: any): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}