import { EInputSize, EInputStatus } from '@/Enum/Enum';

interface DateRangeValue {
    from?: string;
    to?: string;
}

export default interface IDateRange {
    label?: string;
    required?: boolean;
    error?: boolean;
    status?: EInputStatus;
    size?: EInputSize;
    hintText?: string;
    disabled?: boolean;
    containerClassName?: string;
    value?: DateRangeValue;
    onChange?: (value: DateRangeValue) => void;
}
