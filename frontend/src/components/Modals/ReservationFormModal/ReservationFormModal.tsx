'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerActions, DrawerForm, DrawerScrollContent } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Checkbox from '@/components/Primitives/Checkbox/Checkbox';
import DateTimeField from '@/components/Primitives/DatePicker/DateTimeField';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import type { AvailabilityRoom, ReservationRecord, ReservationStatus } from '@/lib/reservation-api';
import {
    calculateReservationPrice,
    fetchAvailability,
    formatMoney,
} from '@/lib/reservation-api';
import type { RoomRecord } from '@/lib/room-api';
import type { ProfessorRecord } from '@/lib/professor-api';

export interface ReservationFormValues {
    title: string;
    roomId: string;
    professorId: string;
    startAt: string;
    endAt: string;
    notes: string;
    status: ReservationStatus;
    isPaid: boolean;
    manualPrice: boolean;
    price: string;
    recurring: boolean;
    frequency: 'WEEKLY' | 'MONTHLY';
    until: string;
}

function priceToInput(value?: number | string | null): string {
    if (value === undefined || value === null || value === '') return '';
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return '';
    return String(amount);
}

function isValidPrice(value: string): boolean {
    if (!value.trim()) return false;
    const amount = Number(value);
    return !Number.isNaN(amount) && amount >= 0;
}

function toLocalInputValue(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime24h(value: string): string {
    if (!value) return '—';
    const [, timePart = ''] = value.split('T');
    return timePart.slice(0, 5) || '—';
}

function localInputToIso(value: string): string | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function RoomAlternativesPanel({
    preferredRoomId,
    startAt,
    endAt,
    status,
    excludeReservationId,
    onSelectRoom,
}: Readonly<{
    preferredRoomId: string;
    startAt: string;
    endAt: string;
    status: ReservationStatus;
    excludeReservationId?: string;
    onSelectRoom: (roomId: string) => void;
}>) {
    const t = useTranslations('admin.reservations');

    const range = useMemo(() => {
        if (!preferredRoomId || !startAt || !endAt || status !== 'CONFIRMED') {
            return null;
        }
        const start = new Date(startAt);
        const end = new Date(endAt);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return null;
        }
        const startIso = localInputToIso(startAt);
        const endIso = localInputToIso(endAt);
        if (!startIso || !endIso) return null;
        return { startIso, endIso };
    }, [preferredRoomId, startAt, endAt, status]);

    const { data, isFetching } = useQuery({
        queryKey: [
            'room-alternatives',
            range?.startIso,
            range?.endIso,
            preferredRoomId,
            excludeReservationId,
        ],
        queryFn: () =>
            fetchAvailability({
                startAt: range!.startIso,
                endAt: range!.endIso,
                preferredRoomId,
                excludeReservationId,
            }),
        enabled: Boolean(range),
        staleTime: 15_000,
    });

    if (!range) return null;

    const preferredBusy = data?.preferredAvailable === false;
    const alternatives = (data?.alternatives ?? []).slice(0, 5);

    if (!preferredBusy) {
        if (data?.preferredAvailable === true) {
            return (
                <Div className="rounded-xl border border-success-100 bg-success-50 px-3 py-2">
                    <Label variant={EVariantLabel.caption} color="text-success-700">
                        {t('alternatives.roomFree')}
                    </Label>
                </Div>
            );
        }
        return isFetching ? (
            <Label variant={EVariantLabel.caption} color="text-gray-500">
                {t('alternatives.checking')}
            </Label>
        ) : null;
    }

    return (
        <Div className="space-y-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-3">
            <Label variant={EVariantLabel.bodySmall} color="text-warning-800" className="block font-medium">
                {t('alternatives.busyTitle')}
            </Label>
            <Label variant={EVariantLabel.caption} color="text-warning-700" className="block">
                {t('alternatives.busyHint')}
            </Label>
            {alternatives.length === 0 ? (
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="block">
                    {t('alternatives.none')}
                </Label>
            ) : (
                <Div className="space-y-2">
                    {alternatives.map((room: AvailabilityRoom) => (
                        <Div
                            key={room.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning-100 bg-white px-3 py-2"
                        >
                            <Div className="min-w-0">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="block font-medium"
                                >
                                    {room.name}
                                </Label>
                                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                                    {t('findRoomCapacity', { count: room.capacity })}
                                    {' · '}
                                    {t('findRoomEstimated', { price: formatMoney(room.estimatedPrice) })}
                                </Label>
                            </Div>
                            <Button
                                id={`alt-room-${room.id}`}
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={t('alternatives.useRoom')}
                                onClick={() => onSelectRoom(room.id)}
                            />
                        </Div>
                    ))}
                </Div>
            )}
        </Div>
    );
}

interface ReservationFormModalProps {
    mode: 'create' | 'edit';
    reservation?: ReservationRecord | null;
    rooms: RoomRecord[];
    professors: ProfessorRecord[];
    onSubmit: (values: ReservationFormValues) => Promise<void>;
    isLoading?: boolean;
    /** Prefills the create form (e.g. when created from a calendar day click). Local `YYYY-MM-DDTHH:mm` format. */
    defaultStartAt?: string;
    defaultEndAt?: string;
    defaultRoomId?: string;
    onDeleteSeriesFuture?: () => void;
    isDeletingSeries?: boolean;
}

export default function ReservationFormModal({
    mode,
    reservation,
    rooms,
    professors,
    onSubmit,
    isLoading = false,
    defaultStartAt,
    defaultEndAt,
    defaultRoomId,
    onDeleteSeriesFuture,
    isDeletingSeries = false,
}: Readonly<ReservationFormModalProps>) {
    const t = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const roomOptions = useMemo(
        () => rooms.map((room) => ({ value: room.id, label: room.name })),
        [rooms],
    );
    const professorOptions = useMemo(
        () => [
            { value: '', label: t('noProfessor') },
            ...professors.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName}`,
            })),
        ],
        [professors, t],
    );

    const defaultValues: ReservationFormValues = {
        title: reservation?.title ?? '',
        roomId: reservation?.roomId ?? defaultRoomId ?? '',
        professorId: reservation?.professorId ?? '',
        startAt: reservation ? toLocalInputValue(reservation.startAt) : defaultStartAt ?? '',
        endAt: reservation ? toLocalInputValue(reservation.endAt) : defaultEndAt ?? '',
        notes: reservation?.notes ?? '',
        status: (reservation?.status ?? 'CONFIRMED') as ReservationStatus,
        isPaid: reservation?.isPaid ?? false,
        manualPrice: isEdit,
        price: priceToInput(reservation?.price),
        recurring: false,
        frequency: 'WEEKLY',
        until: '',
    };

    const form = useForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            await onSubmit(value);
            closeModal();
        },
    });

    useEffect(() => {
        if (!reservation) return;
        form.setFieldValue('title', reservation.title ?? '');
        form.setFieldValue('roomId', reservation.roomId);
        form.setFieldValue('professorId', reservation.professorId ?? '');
        form.setFieldValue('startAt', toLocalInputValue(reservation.startAt));
        form.setFieldValue('endAt', toLocalInputValue(reservation.endAt));
        form.setFieldValue('notes', reservation.notes ?? '');
        form.setFieldValue('status', reservation.status);
        form.setFieldValue('isPaid', reservation.isPaid);
        form.setFieldValue('manualPrice', true);
        form.setFieldValue('price', priceToInput(reservation.price));
    }, [reservation, form]);

    return (
        <Modal
            title={isEdit ? t('edit') : t('create')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <DrawerScrollContent className="gap-0 space-y-4 p-6">
                    <form.Field name="title">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('titleField')}
                                value={state.value}
                                id="reservation-title"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="roomId"
                        validators={{
                            onSubmit: ({ value }) => (value ? undefined : t('room')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('room')}
                                options={roomOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (typeof value === 'string') handleChange(value);
                                }}
                                placeholder={t('room')}
                            />
                        )}
                    </form.Field>
                    <form.Field name="professorId">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('professor')}
                                options={professorOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (typeof value === 'string') handleChange(value);
                                }}
                                placeholder={t('noProfessor')}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="startAt"
                        validators={{
                            onSubmit: ({ value }) => (value ? undefined : t('startAt')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <DateTimeField
                                id="reservation-start"
                                label={t('startAt')}
                                value={state.value}
                                onChange={handleChange}
                                error={
                                    typeof state.meta.errors?.[0] === 'string'
                                        ? state.meta.errors[0]
                                        : undefined
                                }
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="endAt"
                        validators={{
                            onChangeListenTo: ['startAt'],
                            onSubmit: ({ value, fieldApi }) => {
                                if (!value) return t('endAt');
                                const startAt = fieldApi.form.getFieldValue('startAt');
                                if (startAt && new Date(value) <= new Date(startAt)) {
                                    return t('endAfterStart', {
                                        start: formatTime24h(startAt),
                                        end: formatTime24h(value),
                                    });
                                }
                                return undefined;
                            },
                            onChange: ({ value, fieldApi }) => {
                                if (!value) return undefined;
                                const startAt = fieldApi.form.getFieldValue('startAt');
                                if (startAt && new Date(value) <= new Date(startAt)) {
                                    return t('endAfterStart', {
                                        start: formatTime24h(startAt),
                                        end: formatTime24h(value),
                                    });
                                }
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <DateTimeField
                                id="reservation-end"
                                label={t('endAt')}
                                value={state.value}
                                onChange={handleChange}
                                error={
                                    typeof state.meta.errors?.[0] === 'string'
                                        ? state.meta.errors[0]
                                        : undefined
                                }
                            />
                        )}
                    </form.Field>
                    <form.Subscribe
                        selector={(s) => ({
                            roomId: s.values.roomId,
                            startAt: s.values.startAt,
                            endAt: s.values.endAt,
                            status: s.values.status,
                        })}
                    >
                        {({ roomId, startAt, endAt, status }) => (
                            <RoomAlternativesPanel
                                preferredRoomId={roomId}
                                startAt={startAt}
                                endAt={endAt}
                                status={status}
                                excludeReservationId={isEdit ? reservation?.id : undefined}
                                onSelectRoom={(nextRoomId) => {
                                    form.setFieldValue('roomId', nextRoomId);
                                    if (!form.getFieldValue('manualPrice')) {
                                        const room = rooms.find((r) => r.id === nextRoomId);
                                        const calculated = calculateReservationPrice(
                                            room?.pricePerHour,
                                            startAt,
                                            endAt,
                                        );
                                        if (calculated !== null) {
                                            form.setFieldValue('price', String(calculated));
                                        }
                                    }
                                }}
                            />
                        )}
                    </form.Subscribe>
                    <form.Field name="notes">
                        {({ state, handleChange }) => (
                            <Input
                                label={t('notes')}
                                value={state.value}
                                id="reservation-notes"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="manualPrice">
                        {({ state, handleChange }) => (
                            <Checkbox
                                id="reservation-manual-price"
                                checked={state.value}
                                label={t('manualPrice')}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleChange(checked);
                                    if (checked) {
                                        const roomId = form.getFieldValue('roomId');
                                        const startAt = form.getFieldValue('startAt');
                                        const endAt = form.getFieldValue('endAt');
                                        const room = rooms.find((r) => r.id === roomId);
                                        const calculated = calculateReservationPrice(
                                            room?.pricePerHour,
                                            startAt,
                                            endAt,
                                        );
                                        if (calculated !== null) {
                                            form.setFieldValue('price', String(calculated));
                                        }
                                    }
                                }}
                            />
                        )}
                    </form.Field>
                    <form.Subscribe
                        selector={(s) => ({
                            manualPrice: s.values.manualPrice,
                            roomId: s.values.roomId,
                            startAt: s.values.startAt,
                            endAt: s.values.endAt,
                        })}
                    >
                        {({ manualPrice, roomId, startAt, endAt }) => {
                            const room = rooms.find((r) => r.id === roomId);
                            const calculated = calculateReservationPrice(
                                room?.pricePerHour,
                                startAt,
                                endAt,
                            );
                            const showManualInput = Boolean(manualPrice);

                            if (showManualInput) {
                                return (
                                    <form.Field
                                        name="price"
                                        validators={{
                                            onSubmit: ({ value }) =>
                                                isValidPrice(value) ? undefined : t('priceInvalid'),
                                        }}
                                    >
                                        {({ state, handleChange }) => (
                                            <div>
                                                <Input
                                                    label={t('price')}
                                                    value={state.value}
                                                    id="reservation-price"
                                                    type={EInputType.number}
                                                    onChange={(e) => handleChange(e.target.value)}
                                                />
                                                {room && calculated !== null ? (
                                                    <Label
                                                        variant={EVariantLabel.caption}
                                                        color="text-gray-500"
                                                        className="mt-1 block"
                                                    >
                                                        {t('priceHint', {
                                                            rate: formatMoney(room.pricePerHour),
                                                        })}{' '}
                                                        ({formatMoney(calculated)})
                                                    </Label>
                                                ) : null}
                                                {state.meta.errors?.[0] ? (
                                                    <Label
                                                        variant={EVariantLabel.bodySmall}
                                                        color="text-danger-500"
                                                        className="mt-1 block"
                                                    >
                                                        {state.meta.errors[0]}
                                                    </Label>
                                                ) : null}
                                            </div>
                                        )}
                                    </form.Field>
                                );
                            }

                            return (
                                <Div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-600"
                                        className="block mr-1"
                                    >
                                        {t('price')}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.body}
                                        color="text-primary-700"
                                        className="block font-semibold"
                                    >
                                        {calculated === null ? '—' : formatMoney(calculated)}
                                    </Label>
                                    {room ? (
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-gray-500"
                                            className="mt-1 block"
                                        >
                                            {t('priceHint', {
                                                rate: formatMoney(room.pricePerHour),
                                            })}
                                        </Label>
                                    ) : null}
                                </Div>
                            );
                        }}
                    </form.Subscribe>
                    <form.Field name="isPaid">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('payment')}
                                options={[
                                    { value: 'false', label: t('unpaid') },
                                    { value: 'true', label: t('paid') },
                                ]}
                                value={state.value ? 'true' : 'false'}
                                onChange={(value) => handleChange(value === 'true')}
                            />
                        )}
                    </form.Field>
                    <form.Field name="status">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('status')}
                                options={[
                                    { value: 'CONFIRMED', label: tStatus('confirmed') },
                                    { value: 'CANCELLED', label: tStatus('cancelled') },
                                ]}
                                value={state.value}
                                onChange={(value) => {
                                    if (value === 'CONFIRMED' || value === 'CANCELLED') {
                                        handleChange(value);
                                    }
                                }}
                            />
                        )}
                    </form.Field>
                    {!isEdit ? (
                        <>
                            <form.Field name="recurring">
                                {({ state, handleChange }) => (
                                    <Checkbox
                                        id="reservation-recurring"
                                        checked={state.value}
                                        label={t('recurring')}
                                        onChange={(e) => handleChange(e.target.checked)}
                                    />
                                )}
                            </form.Field>
                            <form.Subscribe selector={(s) => s.values.recurring}>
                                {(recurring) =>
                                    recurring ? (
                                        <Div className="space-y-4">
                                            <form.Field name="frequency">
                                                {({ state, handleChange }) => (
                                                    <Dropdown
                                                        label={t('frequency')}
                                                        options={[
                                                            {
                                                                value: 'WEEKLY',
                                                                label: t('frequencyWeekly'),
                                                            },
                                                            {
                                                                value: 'MONTHLY',
                                                                label: t('frequencyMonthly'),
                                                            },
                                                        ]}
                                                        value={state.value}
                                                        onChange={(value) => {
                                                            if (
                                                                value === 'WEEKLY' ||
                                                                value === 'MONTHLY'
                                                            ) {
                                                                handleChange(value);
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </form.Field>
                                            <form.Field
                                                name="until"
                                                validators={{
                                                    onSubmit: ({ value }) =>
                                                        value ? undefined : t('untilRequired'),
                                                }}
                                            >
                                                {({ state, handleChange }) => (
                                                    <div>
                                                        <Label
                                                            variant={EVariantLabel.bodySmall}
                                                            color="text-gray-700"
                                                            className="mb-1.5 block"
                                                        >
                                                            {t('until')}
                                                        </Label>
                                                        <DatePickerField
                                                            id="reservation-until"
                                                            value={state.value}
                                                            error={!!state.meta.errors?.length}
                                                            onChange={handleChange}
                                                        />
                                                        {state.meta.errors?.[0] ? (
                                                            <Label
                                                                variant={EVariantLabel.hint}
                                                                color="text-danger-500"
                                                                className="mt-1.5 block"
                                                            >
                                                                {state.meta.errors[0]}
                                                            </Label>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </form.Field>
                                        </Div>
                                    ) : null
                                }
                            </form.Subscribe>
                        </>
                    ) : null}
                    {isEdit && reservation?.seriesId ? (
                        <Div className="rounded-lg border border-warning-100 bg-warning-25 px-3 py-2">
                            <Label
                                variant={EVariantLabel.caption}
                                color="text-warning-700"
                                className="mb-2 block"
                            >
                                {t('seriesMemberHint')}
                            </Label>
                            {onDeleteSeriesFuture ? (
                                <Button
                                    id="reservation-delete-series-future"
                                    type={EButtonType.secondary}
                                    size={EButtonSize.small}
                                    text={t('deleteSeriesFuture')}
                                    isLoading={isDeletingSeries}
                                    onClick={onDeleteSeriesFuture}
                                />
                            ) : null}
                        </Div>
                    ) : null}
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="reservation-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="reservation-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
