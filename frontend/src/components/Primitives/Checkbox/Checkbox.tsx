import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';
import { ICheckbox } from '@/interfaces/IPrimitives/ICheckbox/ICheckbox';
import Icon from '../Icon/Icon';
import Label from '../Label/Label';

const Checkbox = ({ id, disabled = false, checked = false, label, onChange, ...props }: ICheckbox) => {
    const baseClasses = [
        'appearance-none',
        'h-5 w-5',
        'rounded-lg',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'outline-none transition duration-150',
        checked ? 'bg-primary-500 border-primary-500 hover:bg-primary-500 hover:border-primary-500' : 'border border-gray-300 hover:border-primary-500 hover:bg-primary-50',
    ];

    return (
        <div className='flex flex-row items-center'>
            <div className='relative h-5 w-5 shrink-0'>
                <input
                    type='checkbox'
                    checked={checked}
                    id={id}
                    className={twMerge(baseClasses, 'absolute inset-0 size-full')}
                    onChange={onChange}
                    disabled={disabled}
                    {...props}
                />
                {checked && (
                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                        <Icon
                            name={IconComponentsEnum.check}
                            size={ESize.xs}
                            color="text-white"
                            className="block"
                        />
                    </div>
                )}
            </div>
            <Label htmlFor={id} className='ml-2 cursor-pointer' variant={EVariantLabel.bodySmall} color="text-gray-900">{label}</Label>
        </div>
    )
}
export default Checkbox
