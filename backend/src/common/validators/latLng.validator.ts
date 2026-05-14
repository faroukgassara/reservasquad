import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
export type LatLng = {
    lat: string,
    lng: string
}
@ValidatorConstraint({ name: 'isLatLng', async: false })
export class IsLatLngConstraint implements ValidatorConstraintInterface {
    validate(value: any) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const { lat, lng } = value;
        if (!(typeof lat === 'number' || typeof lat === 'string' && !isNaN(parseFloat(lat)))) {
            return false;
        }

        if (!(typeof lng === 'number' || typeof lng === 'string' && !isNaN(parseFloat(lng)))) {
            return false;
        }
        return true;
    }
    defaultMessage() {
        return 'Invalid LatLng object';
    }
}

export function IsLatLng(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isLatLng',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsLatLngConstraint,
        });
    };
}

export class MyClass {
    @IsLatLng()
    coordinates: LatLng;
} 