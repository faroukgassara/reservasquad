import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isFourDigitNumber', async: false })
@Injectable()
export class IsFourDigitNumberValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // Check if the value is a number and has exactly 4 digits
    return /^\d{4}$/.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a 4-digit number`;
  }
}

export function IsFourDigitNumber(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFourDigitNumberValidator,
    });
  };
}