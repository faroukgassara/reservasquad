import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';

@Injectable()
export class DatePipe implements PipeTransform<any> {
    async transform(value, metadata: ArgumentMetadata) {
        return {
            ...value,
            date: parseInt(value.date),
        };
    }
}