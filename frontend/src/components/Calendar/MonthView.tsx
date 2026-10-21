'use client';

import type { DragEvent, MouseEvent, ReactNode } from 'react';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import {
    addDays,
    formatDayLabel,
    formatTime,
    formatWeekdayShort,
    isSameDay,
    startOfWeek,
    toIsoDateKey,
} from '@/lib/date-utils';
import { AddDayButton, SkeletonSlot } from './CalendarSlots';
import type { CalendarEventBase } from './EventCard';
import { getEventAccent, type CalendarColorBy } from '@/lib/calendar-event-colors';
import type { ReservationRecord } from '@/lib/reservation-api';

export interface MonthViewProps<T extends CalendarEventBase = CalendarEventBase> {
    days: Date[];
    monthStart?: Date;
    nextMonth?: Date;
    eventsByDay: Map<string, T[]>;
    today: Date;
    anchor?: Date;
    locale: string;
    isLoading?: boolean;
    canManage?: boolean | ((day: Date) => boolean);
    addDayLabel?: string;
    weekdayHeaders?: string[];
    eventsCountLabel?: (count: number) => string;
    moreEventsLabel?: (count: number) => string;
    onAddDay?: (day: Date) => void;
    onCellClick?: (day: Date) => void;
    onSelectDay?: (day: Date) => void;
    // Drag & drop support
    dragOverKey?: string | null;
    onDayDragOver?: (day: Date, e: DragEvent) => void;
    onDayDragLeave?: (day: Date, e: DragEvent) => void;
    onDayDrop?: (day: Date, e: DragEvent) => void;
    onEventDragStart?: (event: T, e: DragEvent) => void;
    onEventDragEnd?: () => void;
    // Event chip rendering or default props
    renderEventChip?: (event: T) => ReactNode;
    colorBy?: CalendarColorBy;
    colorLabels?: { paid: string; unpaid: string; noProfessor: string };
    onEditEvent?: (event: T) => void;
    maxPreview?: number;
}

export default function MonthView<T extends CalendarEventBase = CalendarEventBase>({
    days,
    monthStart,
    nextMonth,
    eventsByDay,
    today,
    anchor,
    locale,
    isLoading = false,
    canManage = false,
    addDayLabel,
    weekdayHeaders,
    eventsCountLabel,
    moreEventsLabel,
    onAddDay,
    onCellClick,
    onSelectDay,
    dragOverKey,
    onDayDragOver,
    onDayDragLeave,
    onDayDrop,
    onEventDragStart,
    onEventDragEnd,
    renderEventChip,
    colorBy,
    colorLabels,
    onEditEvent,
    maxPreview = 3,
}: Readonly<MonthViewProps<T>>) {
    const headers =
        weekdayHeaders ??
        Array.from({ length: 7 }, (_, i) =>
            formatWeekdayShort(addDays(startOfWeek(new Date()), i), locale),
        );

    return (
        <Div>
            <Div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 sm:sticky sm:top-[4.5rem] sm:z-10 lg:top-[4.75rem]">
                {headers.map((label) => (
                    <Div key={label} className="px-2 py-2.5 text-center">
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-500"
                            className="uppercase tracking-wide"
                        >
                            {label}
                        </Label>
                    </Div>
                ))}
            </Div>
            <Div className="grid grid-cols-7">
                {days.map((day) => {
                    const inMonth =
                        !monthStart || !nextMonth || (day >= monthStart && day < nextMonth);
                    const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                    const isToday = isSameDay(day, today);
                    const dayManageable =
                        typeof canManage === 'function' ? canManage(day) : Boolean(canManage);
                    const dayKey = day.toDateString();
                    const isDragOver = dragOverKey === dayKey;

                    return (
                        <Div
                            key={day.toISOString()}
                            data-cal-day={dayKey}
                            tabIndex={anchor && isSameDay(day, anchor) ? 0 : -1}
                            aria-label={
                                eventsCountLabel
                                    ? `${formatDayLabel(day, locale)} · ${eventsCountLabel(dayEvents.length)}`
                                    : formatDayLabel(day, locale)
                            }
                            aria-current={isToday ? 'date' : undefined}
                            onDragOver={onDayDragOver ? (e) => onDayDragOver(day, e) : undefined}
                            onDragLeave={onDayDragLeave ? (e) => onDayDragLeave(day, e) : undefined}
                            onDrop={onDayDrop ? (e) => onDayDrop(day, e) : undefined}
                            className={`group min-h-28 border-b border-e border-gray-100 p-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 ${
                                onCellClick && dayManageable ? 'cursor-pointer' : ''
                            } ${
                                isDragOver
                                    ? 'bg-primary-25/80 ring-2 ring-inset ring-primary-400'
                                    : inMonth
                                      ? 'bg-white hover:bg-primary-25/60'
                                      : 'bg-gray-25/70'
                            }`}
                            onClick={onCellClick ? () => onCellClick(day) : undefined}
                        >
                            <Div className="mb-1.5 flex items-center justify-between">
                                {onSelectDay ? (
                                    <button
                                        type="button"
                                        onClick={(e: MouseEvent) => {
                                            e.stopPropagation();
                                            onSelectDay(day);
                                        }}
                                        aria-label={formatDayLabel(day, locale)}
                                        className={`flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors ${
                                            isToday
                                                ? 'bg-accent-500 text-white'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color={
                                                isToday
                                                    ? 'text-white'
                                                    : inMonth
                                                      ? 'text-gray-700'
                                                      : 'text-gray-300'
                                            }
                                            className="font-semibold"
                                        >
                                            {day.getDate()}
                                        </Label>
                                    </button>
                                ) : isToday ? (
                                    <Div className="flex size-6 items-center justify-center rounded-full bg-accent-500">
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-white"
                                            className="font-semibold"
                                        >
                                            {day.getDate()}
                                        </Label>
                                    </Div>
                                ) : (
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color={inMonth ? 'text-gray-700' : 'text-gray-300'}
                                        className="font-semibold"
                                    >
                                        {day.getDate()}
                                    </Label>
                                )}
                                {dayManageable && onAddDay && inMonth ? (
                                    <AddDayButton
                                        onClick={() => onAddDay(day)}
                                        ariaLabel={addDayLabel ?? 'Add'}
                                    />
                                ) : null}
                            </Div>
                            <Div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                {isLoading ? (
                                    <SkeletonSlot variant="chip" count={2} />
                                ) : (
                                    <>
                                        {dayEvents.slice(0, maxPreview).map((event) => {
                                            if (renderEventChip) {
                                                return (
                                                    <div key={event.id || event.key}>
                                                        {renderEventChip(event)}
                                                    </div>
                                                );
                                            }

                                            const accent =
                                                colorBy && colorLabels
                                                    ? getEventAccent(
                                                          event as unknown as ReservationRecord,
                                                          colorBy,
                                                          colorLabels,
                                                      )
                                                    : {
                                                          dotClass:
                                                              event.mine === false
                                                                  ? 'bg-gray-300'
                                                                  : 'bg-primary-500',
                                                      };

                                            const roomTitle =
                                                event.room?.name ||
                                                event.roomName ||
                                                event.title ||
                                                '';

                                            return (
                                                <Div
                                                    key={event.id || event.key}
                                                    draggable={
                                                        dayManageable && Boolean(onEventDragStart)
                                                    }
                                                    className={`flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-gray-50 ${
                                                        dayManageable && onEventDragStart
                                                            ? 'cursor-grab active:cursor-grabbing'
                                                            : ''
                                                    } ${onEditEvent ? 'cursor-pointer' : ''}`}
                                                    onDragStart={
                                                        onEventDragStart
                                                            ? (e: DragEvent) =>
                                                                  onEventDragStart(event, e)
                                                            : undefined
                                                    }
                                                    onDragEnd={onEventDragEnd}
                                                    onClick={
                                                        onEditEvent
                                                            ? (e: MouseEvent) => {
                                                                  e.stopPropagation();
                                                                  onEditEvent(event);
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <Div
                                                        className={`size-1.5 shrink-0 rounded-full ${accent.dotClass}`}
                                                    />
                                                    <Label
                                                        variant={EVariantLabel.caption}
                                                        color={
                                                            event.mine === false
                                                                ? 'text-gray-400'
                                                                : 'text-gray-700'
                                                        }
                                                        className="block truncate"
                                                    >
                                                        {formatTime(event.startAt, locale)} –{' '}
                                                        {formatTime(event.endAt, locale)}{' '}
                                                        {roomTitle}
                                                    </Label>
                                                </Div>
                                            );
                                        })}
                                        {dayEvents.length > maxPreview ? (
                                            <Button
                                                id={`cal-more-${toIsoDateKey(day)}`}
                                                type={EButtonType.tertiary}
                                                size={EButtonSize.small}
                                                text={
                                                    moreEventsLabel
                                                        ? moreEventsLabel(
                                                              dayEvents.length - maxPreview,
                                                          )
                                                        : `+${dayEvents.length - maxPreview}`
                                                }
                                                aria-label={`${
                                                    moreEventsLabel
                                                        ? moreEventsLabel(
                                                              dayEvents.length - maxPreview,
                                                          )
                                                        : `+${dayEvents.length - maxPreview}`
                                                } — ${formatDayLabel(day, locale)}`}
                                                className="h-auto w-fit px-1 py-0.5 text-xs text-gray-500 hover:text-primary-600"
                                                onClick={(e: MouseEvent) => {
                                                    e.stopPropagation();
                                                    onSelectDay?.(day);
                                                }}
                                            />
                                        ) : null}
                                    </>
                                )}
                            </Div>
                        </Div>
                    );
                })}
            </Div>
        </Div>
    );
}
