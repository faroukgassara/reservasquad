'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import type { CalendarReservation } from '@/types/calendar';
import { EButtonType, EVariantLabel } from '@/Enum/Enum';
import type { MouseEvent } from 'react';

type Props = Readonly<{
    reservationsSorted: CalendarReservation[];
    loading: boolean;
    dayIso: string;
    onOpenBooking: (isoDate: string) => void;
    onSelectReservation: (r: CalendarReservation) => void;
}>;

export default function OrganismReservationCalendarDayPanel({
    reservationsSorted,
    loading,
    dayIso,
    onOpenBooking,
    onSelectReservation,
}: Props) {
    return (
        <AtomDiv className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <AtomDiv className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-end sm:justify-end">
                <AtomButton
                    id="cal-day-new-booking"
                    type={EButtonType.secondary}
                    className="text-sm!"
                    text="Réserver ce jour"
                    onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        onOpenBooking(dayIso);
                    }}
                />
            </AtomDiv>
            {loading ? (
                <AtomDiv className="p-8 text-center">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                        Chargement...
                    </AtomLabel>
                </AtomDiv>
            ) : reservationsSorted.length === 0 ? (
                <AtomDiv className="px-4 py-10 text-center">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                        Aucune réservation ce jour. Cliquez sur « Réserver ce jour » pour en ajouter une.
                    </AtomLabel>
                </AtomDiv>
            ) : (
                <AtomDiv className="divide-y divide-slate-100">
                    {reservationsSorted.map((r) => (
                        <AtomDiv key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3 hover:bg-slate-50">
                            <AtomDiv className="min-w-[140px]">
                                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold tabular-nums">
                                    {r.startTime} – {r.endTime}
                                </AtomLabel>
                            </AtomDiv>
                            <AtomDiv className="min-w-0 flex-1">
                                <AtomButton
                                    id={`cal-day-row-${r.id}`}
                                    type={EButtonType.gray}
                                    className={[
                                        '!h-auto w-full max-w-md !justify-start !rounded-lg !px-3 !py-2 text-left text-sm',
                                        r.status === 'CANCELLED' ? 'opacity-50 line-through' : '',
                                    ].join(' ')}
                                    style={{
                                        backgroundColor: r.room?.color ? `${r.room.color}26` : 'rgba(37,49,101,0.08)',
                                        borderLeft: `4px solid ${r.room?.color ?? '#253265'}`,
                                    }}
                                    text={`${r.room.name} — ${r.user.name}`}
                                    onClick={() => onSelectReservation(r)}
                                />
                                <AtomLabel variant={EVariantLabel.caption} color="text-gray-500" className="mt-1 line-clamp-2 max-w-xl">
                                    {r.purpose} · {r.numberOfPeople} pers. · {r.status}
                                </AtomLabel>
                            </AtomDiv>
                        </AtomDiv>
                    ))}
                </AtomDiv>
            )}
        </AtomDiv>
    );
}
