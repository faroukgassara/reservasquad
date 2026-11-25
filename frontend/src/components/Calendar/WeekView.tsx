'use client';

import type { DragEvent, ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { formatDayLabel, formatMonthShort, formatWeekdayShort, isSameDay } from '@/lib/date-utils';
import { AddDayButton, EmptySlot, SkeletonSlot } from './CalendarSlots';
import EventCard, { type CalendarEventBase } from './EventCard';
import type { CalendarColorBy } from '@/lib/calendar-event-colors';

export interface WeekViewProps<T extends CalendarEventBase = CalendarEventBase> {
    days: Date[];
    eventsByDay: Map<string, T[]>;
    today: Date;
    anchor?: Date;
    locale: string;
    isLoading?: boolean;
    canManage?: boolean | ((day: Date) => boolean);
    addDayLabel?: string;
    dropHereLabel?: string;
    emptyLabel?: string;
    eventsCountLabel?: (count: number) => string;
    onAddDay?: (day: Date) => void;
    onCellClick?: (day: Date) => void;
    // Drag & drop support
    dragOverKey?: string | null;
    onDayDragOver?: (day: Date, e: DragEvent) => void;
    onDayDragLeave?: (day: Date, e: DragEvent) => void;
    onDayDrop?: (day: Date, e: DragEvent) => void;
    onEventDragStart?: (event: T, e: DragEvent) => void;
    onEventDragEnd?: () => void;
    // Event rendering options
    renderEvent?: (event: T) => ReactNode;
    paidLabel?: string;
    unpaidLabel?: string;
    colorBy?: CalendarColorBy;
    noProfessorLabel?: string;
    busyLabel?: string;
    onEditEvent?: (event: T) => void;
}

export default function WeekView<T extends CalendarEventBase = CalendarEventBase>({
    days,
    eventsByDay,
    today,
    anchor,
    locale,
    isLoading = false,
    canManage = false,
    addDayLabel,
    dropHereLabel,
    emptyLabel,
    eventsCountLabel,
    onAddDay,
    onCellClick,
    dragOverKey,
    onDayDragOver,
    onDayDragLeave,
    onDayDrop,
    onEventDragStart,
    onEventDragEnd,
    renderEvent,
    paidLabel,
    unpaidLabel,
    colorBy,
    noProfessorLabel,
    busyLabel,
    onEditEvent,
}: Readonly<WeekViewProps<T>>) {
    return (
        <Div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-7 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
            {days.map((day) => {
                const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                const isToday = isSameDay(day, today);
                const isPast = !isToday && day < today;
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
                        className={`group flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 ${
                            onCellClick && dayManageable ? 'cursor-pointer' : ''
                        } ${isDragOver ? 'bg-primary-25/80 ring-2 ring-inset ring-primary-400' : isPast ? 'bg-gray-25' : ''}`}
                        onClick={onCellClick ? () => onCellClick(day) : undefined}
                    >
                        <Div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                            <Div className="flex items-center gap-2">
                                <Div
                                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-1 ${
                                        isToday ? 'bg-accent-500' : ''
                                    }`}
                                >
                                    <Label
                                        variant={EVariantLabel.h5}
                                        color={isToday ? 'text-white' : isPast ? 'text-gray-400' : 'text-gray-900'}
                                        className="tabular-nums"
                                    >
                                        {day.getDate()}
                                    </Label>
                                </Div>
                                <Div className="flex flex-col">
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color={isToday ? 'text-accent-700' : isPast ? 'text-gray-400' : 'text-gray-700'}
                                        className="block font-semibold capitalize"
                                    >
                                        {formatWeekdayShort(day, locale)}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-400" className="block">
                                        {formatMonthShort(day, locale)}
                                    </Label>
                                </Div>
                            </Div>
                            {dayManageable && onAddDay ? (
                                <AddDayButton
                                    onClick={() => onAddDay(day)}
                                    ariaLabel={addDayLabel ?? 'Add'}
                                />
                            ) : null}
                        </Div>
                        <Div className="min-h-48 flex-1 p-3">
                            {isLoading ? (
                                <SkeletonSlot variant="card" count={2} />
                            ) : dayEvents.length === 0 ? (
                                <EmptySlot
                                    label={
                                        isDragOver && dayManageable
                                            ? (dropHereLabel ?? 'Drop here')
                                            : dayManageable
                                              ? (addDayLabel ?? 'Add')
                                              : (emptyLabel ?? 'Empty')
                                    }
                                    actionable={dayManageable && Boolean(onAddDay)}
                                    droppable={dayManageable && isDragOver}
                                    onClick={
                                        dayManageable && onAddDay ? () => onAddDay(day) : undefined
                                    }
                                />
                            ) : (
                                <Div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                    {dayEvents.map((event) => {
                                        if (renderEvent) {
                                            return (
                                                <div key={event.id || event.key}>
                                                    {renderEvent(event)}
                                                </div>
                                            );
                                        }
                                        return (
                                            <EventCard<T>
                                                key={event.id || event.key}
                                                event={event}
                                                paidLabel={paidLabel ?? 'Payé'}
                                                unpaidLabel={unpaidLabel ?? 'Non payé'}
                                                colorBy={colorBy}
                                                noProfessorLabel={noProfessorLabel}
                                                busyLabel={busyLabel}
                                                locale={locale}
                                                draggable={
                                                    dayManageable && Boolean(onEventDragStart)
                                                }
                                                onDragStart={onEventDragStart}
                                                onDragEnd={onEventDragEnd}
                                                onEdit={onEditEvent}
                                            />
                                        );
                                    })}
                                </Div>
                            )}
                        </Div>
                    </Div>
                );
            })}
        </Div>
    );
}
