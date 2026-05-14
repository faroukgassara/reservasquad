import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';

@Injectable()
export class DateRangePipe implements PipeTransform<any> {
    async transform(value, metadata: ArgumentMetadata) {
        return {
            ...value,
            startDate: parseInt(value.startDate),
            endDate: parseInt(value.endDate),
        };
    }
}