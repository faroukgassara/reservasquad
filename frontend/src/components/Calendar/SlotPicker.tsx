'use client';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { SkeletonSlot } from './CalendarSlots';

type SlotState = 'free' | 'selected' | 'busy' | 'past';

export interface SlotPickerProps {
    /** `YYYY-MM-DD`, interpreted in local time. */
    date: string;
    busy: { startAt: string; endAt: string }[];
    startTime: string;
    endTime: string;
    firstHour?: number;
    lastHour?: number;
    isLoading?: boolean;
    labels: { title: string; hint: string; free: string; busy: string; past: string };
    onChange: (start: string, end: string) => void;
}

const pad = (value: number) => String(value).padStart(2, '0');
const toTime = (hour: number) => `${pad(hour)}:00`;
const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const STATE_CLASS: Record<SlotState, string> = {
    free: 'cursor-pointer border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-25',
    selected: 'cursor-pointer border-primary-500 bg-primary-500',
    busy: 'ds-hatch cursor-not-allowed border-gray-200',
    past: 'cursor-not-allowed border-transparent bg-gray-25',
};

const STATE_TEXT: Record<SlotState, 'text-gray-800' | 'text-white' | 'text-gray-400' | 'text-gray-300'> = {
    free: 'text-gray-800',
    selected: 'text-white',
    busy: 'text-gray-400',
    past: 'text-gray-300',
};

export default function SlotPicker({
    date,
    busy,
    startTime,
    endTime,
    firstHour = 8,
    lastHour = 22,
    isLoading = false,
    labels,
    onChange,
}: Readonly<SlotPickerProps>) {
    const [now] = useState(() => Date.now());
    const busyRanges = busy.map((slot) => [new Date(slot.startAt).getTime(), new Date(slot.endAt).getTime()]);
    const selStart = startTime ? toMinutes(startTime) : -1;
    const selEnd = endTime ? toMinutes(endTime) : -1;

    const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
    const stateOf = (hour: number): SlotState => {
        const from = new Date(`${date}T${toTime(hour)}:00`).getTime();
        const to = from + 60 * 60 * 1000;
        if (from < now) return 'past';
        if (busyRanges.some(([busyFrom, busyTo]) => busyFrom < to && busyTo > from)) return 'busy';
        if (hour * 60 >= selStart && (hour + 1) * 60 <= selEnd) return 'selected';
        return 'free';
    };
    const states = new Map(hours.map((hour) => [hour, stateOf(hour)]));

    // A later free hour extends the current booking when nothing taken sits in between; anything else starts over.
    const pick = (hour: number) => {
        const selEndHour = selEnd / 60;
        const canExtend =
            selStart >= 0 &&
            Number.isInteger(selEndHour) &&
            hour >= selEndHour &&
            hours.filter((h) => h >= selEndHour && h <= hour).every((h) => states.get(h) === 'free');
        if (canExtend) onChange(startTime, toTime(hour + 1));
        else onChange(toTime(hour), toTime(hour + 1));
    };

    return (
        <Div className="flex flex-col gap-2">
            <Div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                    {labels.title}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500">
                    {labels.hint}
                </Label>
            </Div>
            {isLoading ? (
                <SkeletonSlot variant="chip" count={3} />
            ) : (
                <Div role="group" aria-label={labels.title} className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                    {hours.map((hour) => {
                        const state = states.get(hour) ?? 'free';
                        const disabled = state === 'busy' || state === 'past';
                        const stateLabel =
                            state === 'busy' ? labels.busy : state === 'past' ? labels.past : labels.free;
                        return (
                            <button
                                key={hour}
                                id={`slot-${date}-${hour}`}
                                type="button"
                                disabled={disabled}
                                aria-pressed={state === 'selected'}
                                aria-label={`${toTime(hour)} – ${toTime(hour + 1)}, ${stateLabel}`}
                                onClick={() => pick(hour)}
                                className={twMerge(
                                    'flex min-h-10 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
                                    STATE_CLASS[state],
                                )}
                            >
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color={STATE_TEXT[state]}
                                    className={twMerge('font-medium tabular-nums', state === 'busy' && 'line-through')}
                                >
                                    {toTime(hour)}
                                </Label>
                            </button>
                        );
                    })}
                </Div>
            )}
        </Div>
    );
}
