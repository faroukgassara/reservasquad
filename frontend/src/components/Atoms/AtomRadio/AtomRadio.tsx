import { twMerge } from 'tailwind-merge';
import { EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useRadioGroup } from '@/components/Molecules/MoleculeRadioGroup/MoleculeRadioGroup';
import { IAtomRadio } from '@/interfaces/Atoms/IAtomRadio/IAtomRadio';
import AtomIcon from '../AtomIcon/AtomIcon';
import AtomLabel from '../AtomLabel/AtomLabel';

const AtomRadio = ({ value, label, id, disabled: disabledProp, ...props }: IAtomRadio) => {
    const { name, value: groupValue, onChange, disabled: groupDisabled } = useRadioGroup();

    const checked = value === groupValue;
    const disabled = disabledProp ?? groupDisabled ?? false;

    const baseClasses = [
        'appearance-none',
        'h-4 w-4',
        'border border-gray-300',
        'rounded-full',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'hover:border-primary-600 hover:bg-primary-50',
        'outline-none focus-within:border-primary-300 focus:bg-primary-100 focus:border-primary-600 focus-within:ring-4 focus-within:ring-primary-50',
    ];

    if (checked) {
        baseClasses.push('bg-primary-100', 'border-primary-600');
    } else {
        baseClasses.push('border-gray-300');
    }

    const handleChange = () => {
        if (!disabled) {
            onChange(value);
        }
    };

    return (
        <div className='mt-2 flex flex-row items-center'>
            <div className='relative h-4 w-4 shrink-0'>
                <input
                    type='radio'
                    name={name}
                    value={value}
                    checked={checked}
                    id={id}
                    disabled={disabled}
                    className={twMerge(baseClasses, 'absolute inset-0')}
                    onChange={handleChange}
                    role="radio"
                    {...props}
                />
                {checked && (
                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                        <AtomIcon
                            name={IconComponentsEnum.dot}
                            color={'text-primary-500'}
                            size='w-2 h-2'
                        />
                    </div>
                )}
            </div>
            {label && <AtomLabel htmlFor={id} className='ml-2 cursor-pointer' variant={EVariantLabel.hint} color="text-gray-900">{label}</AtomLabel>}
        </div>
    );
};

export default AtomRadio;