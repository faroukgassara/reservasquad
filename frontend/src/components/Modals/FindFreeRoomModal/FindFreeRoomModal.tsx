'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerActions, DrawerForm, DrawerScrollContent } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Button from '@/components/Primitives/Button/Button';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import {
    fetchAvailability,
    formatMoney,
    type AvailabilityRoom,
} from '@/lib/reservation-api';

export type FindFreeRoomSelection = {
    roomId: string;
    startAt: string;
    endAt: string;
};

interface FindFreeRoomModalProps {
    onSelect: (selection: FindFreeRoomSelection) => void;
    /** Prefill local `YYYY-MM-DDTHH:mm` values when opened from a calendar day. */
    defaultStartAt?: string;
    defaultEndAt?: string;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function toLocalInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultRange(): { startAt: string; endAt: string } {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return { startAt: toLocalInputValue(start), endAt: toLocalInputValue(end) };
}

function splitLocalDateTime(value: string): { date: string; time: string } {
    if (!value) return { date: '', time: '' };
    const [date = '', timePart = ''] = value.split('T');
    return { date, time: timePart.slice(0, 5) };
}

function joinLocalDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${date}T${time}`;
}

function localInputToIso(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new TypeError('Invalid date');
    }
    return date.toISOString();
}

function DateTimeFields({
    idPrefix,
    label,
    value,
    onChange,
}: Readonly<{
    idPrefix: string;
    label: string;
    value: string;
    onChange: (next: string) => void;
}>) {
    const { date, time } = splitLocalDateTime(value);
    return (
        <Div>
            <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="mb-1.5 block">
                {label}
            </Label>
            <Div className="grid grid-cols-2 gap-2">
                <input
                    id={`${idPrefix}-date`}
                    type="date"
                    lang="fr"
                    className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                    value={date}
                    onChange={(e) => onChange(joinLocalDateTime(e.target.value, time || '00:00'))}
                    required
                />
                <input
                    id={`${idPrefix}-time`}
                    type="time"
                    lang="fr"
                    step={60}
                    className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                    value={time}
                    onChange={(e) => onChange(joinLocalDateTime(date, e.target.value))}
                    required
                />
            </Div>
        </Div>
    );
}

function ResultsList({
    rooms,
    emptyLabel,
    resultsLabel,
    capacityLabel,
    estimatedLabel,
    bookLabel,
    onBook,
}: Readonly<{
    rooms: AvailabilityRoom[];
    emptyLabel: string;
    resultsLabel: string;
    capacityLabel: (count: number) => string;
    estimatedLabel: (price: number) => string;
    bookLabel: string;
    onBook: (room: AvailabilityRoom) => void;
}>) {
    if (rooms.length === 0) {
        return (
            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                {emptyLabel}
            </Label>
        );
    }

    return (
        <Div className="space-y-2">
            <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                {resultsLabel}
            </Label>
            {rooms.map((room) => (
                <Div
                    key={room.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3"
                >
                    <Div className="min-w-0">
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-900"
                            className="font-medium mr-1"
                        >
                            {room.name}
                        </Label>
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-500"
                            className="mt-0.5 block"
                        >
                            {capacityLabel(room.capacity)}
                            {' · '}
                            {estimatedLabel(room.estimatedPrice)}
                        </Label>
                    </Div>
                    <Button
                        id={`find-room-book-${room.id}`}
                        type={EButtonType.primary}
                        size={EButtonSize.small}
                        text={bookLabel}
                        onClick={() => onBook(room)}
                    />
                </Div>
            ))}
        </Div>
    );
}

export default function FindFreeRoomModal({
    onSelect,
    defaultStartAt,
    defaultEndAt,
}: Readonly<FindFreeRoomModalProps>) {
    const t = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const initial = useMemo(() => {
        if (defaultStartAt && defaultEndAt) {
            return { startAt: defaultStartAt, endAt: defaultEndAt };
        }
        return defaultRange();
    }, [defaultStartAt, defaultEndAt]);

    const [startAt, setStartAt] = useState(initial.startAt);
    const [endAt, setEndAt] = useState(initial.endAt);
    const [rooms, setRooms] = useState<AvailabilityRoom[] | null>(null);
    const [error, setError] = useState('');

    const searchMutation = useMutation({
        mutationFn: async () => {
            if (!startAt || !endAt) {
                throw new Error(t('findRoomRangeRequired'));
            }
            const start = new Date(startAt);
            const end = new Date(endAt);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                throw new Error(t('findRoomRangeRequired'));
            }
            if (end <= start) {
                throw new Error(
                    t('endAfterStart', {
                        start: startAt,
                        end: endAt,
                    }),
                );
            }
            return fetchAvailability({
                startAt: localInputToIso(startAt),
                endAt: localInputToIso(endAt),
            });
        },
        onSuccess: (data) => {
            setError('');
            setRooms(data.rooms);
        },
        onError: (err: Error) => {
            setRooms(null);
            setError(err.message);
        },
    });

    return (
        <Modal
            title={t('findRoomTitle')}
            subTitle={t('findRoomSubtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(event) => {
                    event.preventDefault();
                    searchMutation.mutate();
                }}
            >
                <DrawerScrollContent className="gap-0 space-y-4 p-6">
                    <DateTimeFields
                        idPrefix="find-room-start"
                        label={t('startAt')}
                        value={startAt}
                        onChange={setStartAt}
                    />
                    <DateTimeFields
                        idPrefix="find-room-end"
                        label={t('endAt')}
                        value={endAt}
                        onChange={setEndAt}
                    />

                    {error ? (
                        <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                            {error}
                        </Label>
                    ) : null}

                    {rooms ? (
                        <ResultsList
                            rooms={rooms}
                            emptyLabel={t('findRoomEmpty')}
                            resultsLabel={t('findRoomResults', { count: rooms.length })}
                            capacityLabel={(count) => t('findRoomCapacity', { count })}
                            estimatedLabel={(price) =>
                                t('findRoomEstimated', { price: formatMoney(price) })
                            }
                            bookLabel={t('findRoomBook')}
                            onBook={(room) => {
                                onSelect({
                                    roomId: room.id,
                                    startAt,
                                    endAt,
                                });
                            }}
                        />
                    ) : null}
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="find-room-cancel"
                        type={EButtonType.tertiary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="find-room-search"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={t('findRoomSearch')}
                        isLoading={searchMutation.isPending}
                        onClick={() => searchMutation.mutate()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
