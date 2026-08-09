import { twMerge } from 'tailwind-merge';
import { EVariantLabel } from '@/Enum/Enum';
import { IRadio } from '@/interfaces/IPrimitives/IRadio/IRadio';
import { useRadioGroup } from '@/components/Primitives/RadioGroup/RadioGroup';
import Label from '../Label/Label';

const Radio = ({ value, label, id, disabled: disabledProp, ...props }: IRadio) => {
    const { name, value: groupValue, onChange, disabled: groupDisabled } = useRadioGroup();

    const checked = value === groupValue;
    const disabled = disabledProp ?? groupDisabled ?? false;

    const baseClasses = [
        'appearance-none',
        'h-5 w-5',
        'rounded-full',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'outline-none transition duration-150',
        checked ? 'bg-white border border-primary-500 hover:border-primary-500' : 'border border-gray-300 hover:border-primary-500 hover:bg-primary-50',
    ];

    const handleChange = () => {
        if (!disabled) {
            onChange(value);
        }
    };

    return (
        <div className='mt-2 flex flex-row items-center'>
            <div className='relative size-5 shrink-0'>
                <input
                    type='radio'
                    name={name}
                    value={value}
                    checked={checked}
                    id={id}
                    disabled={disabled}
                    className={twMerge(baseClasses, 'absolute inset-0 size-full')}
                    onChange={handleChange}
                    {...props}
                />
                {checked && (
                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                        <span className='block size-3 rounded-full bg-primary-500' aria-hidden />
                    </div>
                )}
            </div>
            {label && <Label htmlFor={id} className='ml-2 cursor-pointer' variant={EVariantLabel.hint} color="text-gray-900">{label}</Label>}
        </div>
    );
};

export default Radio;