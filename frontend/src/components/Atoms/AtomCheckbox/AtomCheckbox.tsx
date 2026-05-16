import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';
import { IAtomCheckbox } from '@/interfaces/Atoms/IAtomCheckbox/IAtomCheckbox';
import AtomIcon from '../AtomIcon/AtomIcon';
import AtomLabel from '../AtomLabel/AtomLabel';

const AtomCheckbox = ({ id, disabled = false, checked = false, label, onChange, ...props }: IAtomCheckbox) => {
    const baseClasses = [
        'appearance-none',
        'h-4 w-4',
        'border border-gray-300',
        'rounded',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'hover:border-primary-600 hover:bg-primary-50',
        'outline-none transition duration-150 focus-within:border-primary-300 focus:border-primary-600 focus-within:ring-4 focus-within:ring-primary-50',
    ];

    if (checked) {
        baseClasses.push('bg-primary-100', 'border-primary-600');
    } else {
        baseClasses.push('border-gray-300 bg-white');
    }

    return (
        <div className='flex flex-row items-center'>
            <div className='relative h-4 w-4 shrink-0'>
                <input
                    type='checkbox'
                    checked={checked}
                    id={id}
                    className={twMerge(baseClasses, 'absolute inset-0')}
                    onChange={onChange}
                    disabled={disabled}
                    {...props}
                />
                {checked && (
                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                        <AtomIcon
                            className='w-2 h-2'
                            name={IconComponentsEnum.check}
                            size={ESize.sm}
                            color={'text-primary-600'}
                        />
                    </div>
                )}
            </div>
            <AtomLabel htmlFor={id} className='ml-2 cursor-pointer' variant={EVariantLabel.bodySmall} color="text-gray-900">{label}</AtomLabel>
        </div>
    )
}

export default AtomCheckbox