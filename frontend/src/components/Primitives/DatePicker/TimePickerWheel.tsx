'use client';

import { useCallback, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

const ITEM_HEIGHT = 36;
const VISIBLE_ROWS = 5;
const PADDING_ROWS = Math.floor(VISIBLE_ROWS / 2);
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

interface IWheelColumn {
    id: string;
    items: string[];
    value: string;
    onChange: (value: string) => void;
    'aria-label': string;
}

function WheelColumn({ id, items, value, onChange, 'aria-label': ariaLabel }: IWheelColumn) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProgrammaticRef = useRef(false);

    const scrollToValue = useCallback(
        (nextValue: string, smooth = false) => {
            const scroller = scrollerRef.current;
            if (!scroller) return;
            const index = items.indexOf(nextValue);
            if (index < 0) return;
            isProgrammaticRef.current = true;
            scroller.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: smooth ? 'smooth' : 'auto',
            });
            window.setTimeout(() => {
                isProgrammaticRef.current = false;
            }, smooth ? 200 : 0);
        },
        [items],
    );

    useEffect(() => {
        scrollToValue(value || items[0] || '00');
    }, [scrollToValue, value, items]);

    const handleScrollEnd = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller || isProgrammaticRef.current) return;

        const index = Math.round(scroller.scrollTop / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(items.length - 1, index));
        const nextValue = items[clamped];
        const targetTop = clamped * ITEM_HEIGHT;

        if (Math.abs(scroller.scrollTop - targetTop) > 1) {
            isProgrammaticRef.current = true;
            scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
            window.setTimeout(() => {
                isProgrammaticRef.current = false;
            }, 200);
        }

        if (nextValue && nextValue !== value) {
            onChange(nextValue);
        }
    }, [items, onChange, value]);

    const handleScroll = () => {
        if (isProgrammaticRef.current) return;
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(handleScrollEnd, 100);
    };

    useEffect(
        () => () => {
            if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        },
        [],
    );

    return (
        <div className="relative w-12 shrink-0 overflow-hidden sm:w-14" style={{ height: WHEEL_HEIGHT }}>
            <div
                id={id}
                ref={scrollerRef}
                role="listbox"
                aria-label={ariaLabel}
                tabIndex={0}
                onScroll={handleScroll}
                className={twMerge(
                    'relative z-10 h-full overflow-y-auto overscroll-contain',
                    'snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                )}
                style={{
                    paddingTop: PADDING_ROWS * ITEM_HEIGHT,
                    paddingBottom: PADDING_ROWS * ITEM_HEIGHT,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {items.map((item) => {
                    const selected = item === value;
                    return (
                        <button
                            key={item}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                                onChange(item);
                                scrollToValue(item, true);
                            }}
                            className={twMerge(
                                'flex w-full snap-center items-center justify-center tabular-nums',
                                selected
                                    ? 'text-base font-semibold text-gray-900'
                                    : 'text-sm font-medium text-gray-400',
                            )}
                            style={{ height: ITEM_HEIGHT }}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>

            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 border-y border-gray-200"
                style={{ height: ITEM_HEIGHT }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-linear-to-b from-white to-transparent"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-linear-to-t from-white to-transparent"
            />
        </div>
    );
}

interface ITimePickerWheel {
    hour: string;
    minute: string;
    onChange: (hour: string, minute: string) => void;
    onConfirm?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

const TimePickerWheel = ({ hour, minute, onChange, onConfirm }: ITimePickerWheel) => {
    const safeHour = HOURS.includes(hour) ? hour : '00';
    const safeMinute = MINUTES.includes(minute) ? minute : '00';

    return (
        <div className="w-44 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <div className="flex items-center justify-center gap-1.5">
                <WheelColumn
                    id="time-wheel-hour"
                    aria-label="Heure"
                    items={HOURS}
                    value={safeHour}
                    onChange={(nextHour) => onChange(nextHour, safeMinute)}
                />
                <span className="text-base font-semibold text-gray-900">:</span>
                <WheelColumn
                    id="time-wheel-minute"
                    aria-label="Minute"
                    items={MINUTES}
                    value={safeMinute}
                    onChange={(nextMinute) => onChange(safeHour, nextMinute)}
                />
            </div>
            {onConfirm ? (
                <div className="mt-2 border-t border-gray-100 pt-2">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full rounded-lg py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                        OK
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default TimePickerWheel;
