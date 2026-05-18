'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import type { CalendarReservation } from '@/types/calendar';
import { EButtonType, EVariantLabel } from '@/Enum/Enum';
import { format, isToday } from 'date-fns';
import type { MouseEvent } from 'react';

type Props = Readonly<{
    daysInWeek: Date[];
    rowWeekdayLabels: readonly string[];
    byDay: Record<string, CalendarReservation[]>;
    loading: boolean;
    onOpenBooking: (isoDate: string) => void;
    onSelectReservation: (r: CalendarReservation) => void;
}>;

export default function OrganismReservationCalendarWeekGrid({
    daysInWeek,
    rowWeekdayLabels,
    byDay,
    loading,
    onOpenBooking,
    onSelectReservation,
}: Props) {
    return (
        <AtomDiv className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
                <AtomDiv className="p-8 text-center">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                        Chargement...
                    </AtomLabel>
                </AtomDiv>
            ) : (
                <AtomDiv className="grid min-w-[640px] grid-cols-7 gap-px bg-slate-200 p-px">
                    {daysInWeek.map((day, i) => {
                        const iso = format(day, 'yyyy-MM-dd');
                        const slots = byDay[iso] || [];
                        const todayCell = isToday(day);
                        return (
                            <AtomDiv key={`${iso}-${i}`} className="flex flex-col bg-slate-50">
                                <AtomDiv className="border-b border-slate-200 px-1.5 py-2 text-center">
                                    <AtomLabel variant={EVariantLabel.caption} color="text-gray-600" className="text-xs font-semibold">
                                        {rowWeekdayLabels[i]}
                                    </AtomLabel>
                                    <AtomDiv className={`mt-0.5 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${todayCell ? 'bg-primary-900 text-white' : 'text-gray-900'}`}>
                                        {format(day, 'd')}
                                    </AtomDiv>
                                </AtomDiv>
                                <AtomDiv
                                    className={[
                                        'flex min-h-[220px] flex-1 flex-col bg-white p-1.5 md:min-h-[260px]',
                                        todayCell ? 'ring-2 ring-primary-900 ring-inset' : '',
                                    ].join(' ')}
                                >
                                    <AtomDiv className="mb-1 flex justify-end">
                                        <AtomButton
                                            id={`cal-week-book-${iso}`}
                                            type={EButtonType.iconButton}
                                            className="!h-auto !min-h-0 !px-1 !py-0 text-[11px] text-primary-900"
                                            onClick={(ev: MouseEvent) => {
                                                ev.stopPropagation();
                                                onOpenBooking(iso);
                                            }}
                                            text="+"
                                        />
                                    </AtomDiv>
                                    <AtomDiv className="flex max-h-[200px] flex-col gap-0.5 overflow-y-auto md:max-h-none md:flex-1">
                                        {slots.map((r) => (
                                            <AtomDiv key={r.id} title={r.purpose} className="min-w-0 w-full">
                                                <AtomButton
                                                    id={`cal-week-chip-${r.id}`}
                                                    type={EButtonType.gray}
                                                    className={[
                                                        'w-full !h-auto !min-h-0 !justify-start truncate !rounded-full !px-1.5 !py-0.5 text-left text-[10px] font-medium shadow-sm md:text-[11px]',
                                                        r.status === 'CANCELLED' ? 'opacity-50 line-through' : '',
                                                    ].join(' ')}
                                                    style={{
                                                        backgroundColor: r.room?.color ? `${r.room.color}26` : 'rgba(37,49,101,0.12)',
                                                        borderLeft: `3px solid ${r.room?.color ?? '#253265'}`,
                                                    }}
                                                    onClick={() => onSelectReservation(r)}
                                                    text={`${r.room.name} · ${r.startTime}-${r.endTime}`}
                                                />
                                            </AtomDiv>
                                        ))}
                                    </AtomDiv>
                                </AtomDiv>
                            </AtomDiv>
                        );
                    })}
                </AtomDiv>
            )}
        </AtomDiv>
    );
}
