import { PipeTransform, ArgumentMetadata, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { IsPhoneNumber, validate } from 'class-validator';

@Injectable()
export class PhoneNumberPipe implements PipeTransform<any> {
    private countryKey: string
    private phoneKey: string
    constructor(
        countryKey: string,
        phoneKey: string
    ) {
        this.countryKey = countryKey
        this.phoneKey = phoneKey
    }
    async transform(value, metadata: ArgumentMetadata) {
        if (value[this.countryKey]) {
            class PhoneNumberDto {
                @IsPhoneNumber(value[this.countryKey])
                phoneNumber: string;
            }

            const phoneNumberDto = plainToClass(PhoneNumberDto, { phoneNumber: value[this.phoneKey] });

            const errorsFields = await validate(phoneNumberDto);
            if (errorsFields.length > 0) {
                throw new BadRequestException(errorsFields);
            }
            return {
                ...value,
            };
        }
    }
}
