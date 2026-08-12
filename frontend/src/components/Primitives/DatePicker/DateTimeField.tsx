'use client';

import { EInputSize, EInputStatus, EVariantLabel } from '@/Enum/Enum';
import Label from '../Label/Label';
import Div from '../Div/Div';
import DatePickerField from './DatePickerField';
import TimePickerField from './TimePickerField';

export interface IDateTimeFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    size?: EInputSize;
    status?: EInputStatus;
}

function splitLocalDateTime(value: string): { date: string; time: string } {
    if (!value) return { date: '', time: '' };
    const [date = '', timePart = ''] = value.split('T');
    return { date, time: timePart.slice(0, 5) };
}

function joinLocalDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${date}T${time}`;
}

const DateTimeField = ({
    id,
    label,
    value,
    onChange,
    error,
    disabled,
    size = EInputSize.medium,
    status,
}: IDateTimeFieldProps) => {
    const { date, time } = splitLocalDateTime(value);
    const hasError = Boolean(error);

    return (
        <Div>
            <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="mb-1.5 block">
                {label}
            </Label>
            <Div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-2">
                <DatePickerField
                    id={`${id}-date`}
                    value={date}
                    disabled={disabled}
                    error={hasError}
                    status={status}
                    size={size}
                    onChange={(nextDate) => onChange(joinLocalDateTime(nextDate, time || '00:00'))}
                />
                <TimePickerField
                    id={`${id}-time`}
                    value={time}
                    disabled={disabled}
                    error={hasError}
                    status={status}
                    size={size}
                    onChange={(nextTime) => onChange(joinLocalDateTime(date, nextTime))}
                />
            </Div>
            {error ? (
                <Label variant={EVariantLabel.hint} color="text-danger-500" className="mt-1.5 block">
                    {error}
                </Label>
            ) : null}
        </Div>
    );
};

export default DateTimeField;
