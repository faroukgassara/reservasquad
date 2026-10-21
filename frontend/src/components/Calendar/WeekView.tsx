'use client';

import type { DragEvent, ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { formatDayLabel, formatDayMonth, formatWeekdayShort, isSameDay } from '@/lib/date-utils';
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
                        } ${isDragOver ? 'bg-primary-25/80 ring-2 ring-inset ring-primary-400' : ''}`}
                        onClick={onCellClick ? () => onCellClick(day) : undefined}
                    >
                        <Div
                            className={`flex items-center justify-between border-b px-3 py-2.5 ${
                                isToday
                                    ? 'border-b-2 border-b-accent-400 bg-accent-50/60'
                                    : 'border-gray-100 bg-gray-25'
                            }`}
                        >
                            <Div>
                                <Label
                                    variant={EVariantLabel.caption}
                                    color={isToday ? 'text-accent-700' : 'text-gray-500'}
                                    className="block uppercase tracking-wide"
                                >
                                    {formatWeekdayShort(day, locale)}
                                </Label>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color={isToday ? 'text-accent-700' : 'text-gray-700'}
                                    className="block font-semibold"
                                >
                                    {formatDayMonth(day, locale)}
                                </Label>
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
