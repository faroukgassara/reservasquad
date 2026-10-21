'use client';

import { memo, type DragEvent, type MouseEvent } from 'react';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EBadgeSize, EBadgeType, EVariantLabel } from '@/Enum/Enum';
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
    [key: string]: any;
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
            <Div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block tabular-nums">
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

    const eventId = event.id || event.key || 'event';
    const roomTitle = event.room?.name || event.roomName || event.title || '—';

    return (
        <Div
            draggable={draggable}
            className={`rounded-lg border border-gray-100 border-s-2 bg-white ps-3 pe-2.5 py-2 shadow-xs transition-shadow duration-150 hover:shadow-sm ${accent.borderClass} ${
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
            <Div className="flex flex-col gap-1.5">
                <Div className="flex flex-col tabular-nums">
                    <Label variant={EVariantLabel.bodySmall} color="text-primary-700">
                        {formatTime(event.startAt, locale)}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {formatTime(event.endAt, locale)}
                    </Label>
                </Div>
                <Badge
                    id={`cal-paid-${eventId}`}
                    text={event.isPaid ? paidLabel : unpaidLabel}
                    type={event.isPaid ? EBadgeType.success : EBadgeType.warning}
                    size={EBadgeSize.tiny}
                    className="h-auto min-h-6 w-fit max-w-full shrink-0 whitespace-nowrap px-2 py-0.5 leading-none"
                />
            </Div>
            <Div className="mt-1.5 flex flex-col gap-1">
                <Label
                    variant={EVariantLabel.bodySmall}
                    color="text-gray-900"
                    className="block truncate"
                >
                    {roomTitle}
                </Label>
                {event.professor ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block truncate">
                        {event.professor.firstName} {event.professor.lastName}
                    </Label>
                ) : null}
                {event.price !== undefined && event.price !== null ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-600" className="mt-0.5 block">
                        {formatMoney(Number(event.price) || 0)}
                    </Label>
                ) : null}
            </Div>
        </Div>
    );
}

export const EventCard = memo(EventCardInner) as <T extends CalendarEventBase = CalendarEventBase>(
    props: Readonly<EventCardProps<T>>,
) => React.ReactElement | null;

export default EventCard;
