'use client';

import { memo, type DragEvent, type MouseEvent } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { formatTime } from '@/lib/date-utils';
import { getEventAccent, type CalendarColorBy } from '@/lib/calendar-event-colors';
import type { ReservationRecord } from '@/lib/reservation-api';

export interface CalendarEventBase {
    id?: string;
    key?: string;
    startAt: string;
    endAt: string;
    title?: string | null;
    isPaid?: boolean;
    price?: number | string | null;
    room?: { id?: string; name: string } | null;
    roomName?: string;
    professor?: { id?: string; firstName?: string; lastName?: string } | null;
    mine?: boolean;
}

export interface EventCardProps<T extends CalendarEventBase = CalendarEventBase> {
    event: T;
    paidLabel: string;
    unpaidLabel: string;
    colorBy?: CalendarColorBy;
    noProfessorLabel?: string;
    busyLabel?: string;
    locale: string;
    draggable?: boolean;
    onEdit?: (event: T) => void;
    onDragStart?: (event: T, e: DragEvent) => void;
    onDragEnd?: () => void;
}

function EventCardInner<T extends CalendarEventBase = CalendarEventBase>({
    event,
    paidLabel,
    unpaidLabel,
    colorBy,
    noProfessorLabel,
    busyLabel = 'Occupé',
    locale,
    draggable,
    onEdit,
    onDragStart,
    onDragEnd,
}: Readonly<EventCardProps<T>>) {
    // If this is an external / non-owned slot (e.g. portal calendar for another professor's booking)
    if (event.mine === false) {
        const roomTitle = event.room?.name || event.roomName || event.title || '';
        return (
            <Div className="ds-hatch rounded-xl border border-gray-200 p-2.5">
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="block font-medium tabular-nums">
                    {`${formatTime(event.startAt, locale)} – ${formatTime(event.endAt, locale)}`}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                    {roomTitle ? `${roomTitle} · ${busyLabel}` : busyLabel}
                </Label>
            </Div>
        );
    }

    const accent = colorBy
        ? getEventAccent(event as unknown as ReservationRecord, colorBy, {
              paid: paidLabel,
              unpaid: unpaidLabel,
              noProfessor: noProfessorLabel ?? '',
          })
        : { borderClass: 'border-s-primary-500', dotClass: 'bg-primary-500' };

    const roomTitle = event.room?.name || event.roomName || event.title || '—';
    const hasPrice = event.price !== undefined && event.price !== null;

    return (
        <Div
            draggable={draggable}
            className={`flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-2.5 transition-[border-color,box-shadow] duration-150 hover:border-gray-300 hover:shadow-sm ${
                onEdit ? 'cursor-pointer' : ''
            } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onEdit?.(event);
            }}
            onDragStart={(e: DragEvent) => {
                e.stopPropagation();
                onDragStart?.(event, e);
            }}
            onDragEnd={onDragEnd}
        >
            <Div className="flex items-center justify-between gap-2">
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="truncate font-medium tabular-nums">
                    {`${formatTime(event.startAt, locale)} – ${formatTime(event.endAt, locale)}`}
                </Label>
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${accent.dotClass}`} />
            </Div>
            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block truncate font-semibold!">
                {roomTitle}
            </Label>
            {event.professor ? (
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                    {event.professor.firstName} {event.professor.lastName}
                </Label>
            ) : null}
            <Div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-dashed border-gray-200 pt-1.5">
                {hasPrice ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-semibold tabular-nums">
                        {formatMoney(Number(event.price) || 0)}
                    </Label>
                ) : null}
                <Label
                    variant={EVariantLabel.caption}
                    color={event.isPaid ? 'text-success-700' : 'text-warning-700'}
                    className="font-medium"
                >
                    {event.isPaid ? paidLabel : unpaidLabel}
                </Label>
            </Div>
        </Div>
    );
}

export const EventCard = memo(EventCardInner) as <T extends CalendarEventBase = CalendarEventBase>(
    props: Readonly<EventCardProps<T>>,
) => React.ReactElement | null;

export default EventCard;
