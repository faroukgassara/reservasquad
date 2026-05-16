'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import type { CalendarReservation } from '@/types/calendar';
import { EButtonType, EVariantLabel } from '@/Enum/Enum';
import { format, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MouseEvent } from 'react';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';

type OrganismReservationCalendarMonthGridProps = {
    monthCursor: Date;
    gridDays: Date[];
    weekDays: readonly string[];
    byDay: Record<string, CalendarReservation[]>;
    loading: boolean;
    onOpenBooking: (isoDate: string) => void;
    onSelectReservation: (r: CalendarReservation) => void;
};

export default function OrganismReservationCalendarMonthGrid({
    monthCursor,
    gridDays,
    weekDays,
    byDay,
    loading,
    onOpenBooking,
    onSelectReservation,
}: Readonly<OrganismReservationCalendarMonthGridProps>) {
    return (
        <AtomDiv className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <AtomDiv className="border-b border-slate-100 px-4 py-3 capitalize">
                <AtomLabel variant={EVariantLabel.body} color="text-primary-900" className="font-medium capitalize">
                    {format(monthCursor, 'MMMM yyyy', { locale: fr })}
                </AtomLabel>
            </AtomDiv>
            {loading ? (
                <AtomDiv className="p-8 text-center">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                        Chargement...
                    </AtomLabel>
                </AtomDiv>
            ) : (
                <AtomDiv className="grid grid-cols-7 gap-px bg-slate-200 p-px">
                    {weekDays.map((wd) => (
                        <AtomDiv key={wd} className="bg-slate-50 px-1 py-2 text-center">
                            <AtomLabel variant={EVariantLabel.caption} color="text-gray-600" className="text-xs font-semibold">
                                {wd}
                            </AtomLabel>
                        </AtomDiv>
                    ))}
                    {gridDays.map((day) => {
                        const iso = format(day, 'yyyy-MM-dd');
                        const slots = byDay[iso] || [];
                        const inMonth = isSameMonth(day, monthCursor);
                        return (
                            <AtomDiv
                                key={iso}
                                className={[
                                    'min-h-[112px] bg-white p-1.5 hover:bg-slate-50/80 md:min-h-[128px]',
                                    inMonth ? 'opacity-100' : 'opacity-35',
                                ].join(' ')}
                            >
                                <AtomDiv className="mb-1 flex items-center justify-between">
                                    <AtomLabel variant={EVariantLabel.caption} color="text-gray-700" className="text-xs font-medium">
                                        {format(day, 'd')}
                                    </AtomLabel>
                                    <AtomButton
                                        id={`cal-open-booking-${iso}`}
                                        type={EButtonType.iconButton}
                                        className="!h-auto !min-h-0 !px-1 !py-0 text-[11px] text-primary-900"
                                        onClick={(ev: MouseEvent) => {
                                            ev.stopPropagation();
                                            onOpenBooking(iso);
                                        }}
                                        text="+"
                                    />
                                </AtomDiv>
                                <AtomDiv className="flex max-h-[88px] flex-col gap-0.5 overflow-y-auto">
                                    {slots.map((r) => (
                                        <AtomDiv key={r.id} title={r.purpose} className="min-w-0 w-full">
                                            <AtomButton
                                                id={`cal-reservation-chip-${r.id}`}
                                                type={EButtonType.gray}
                                                className={[
                                                    'w-full !h-auto !min-h-0 !justify-start truncate !rounded-full !px-1.5 !py-0.5 text-left text-[10px] font-medium shadow-sm md:text-[11px]',
                                                    r.status === 'CANCELLED' ? 'opacity-50 line-through' : '',
                                                ].join(' ')}
                                                style={{
                                                    backgroundColor: r.room?.color ? `${r.room.color}26` : 'rgba(37,49,101,0.12)',
                                                    color: 'text-primary-900',
                                                    borderLeft: `3px solid ${r.room?.color ?? 'text-primary-900'}`,
                                                }}
                                                onClick={() => onSelectReservation(r)}
                                                text={`${r.room.name} · ${r.startTime}-${r.endTime}`}
                                            />
                                        </AtomDiv>
                                    ))}
                                </AtomDiv>
                            </AtomDiv>
                        );
                    })}
                </AtomDiv>
            )}
        </AtomDiv>
    );
}
