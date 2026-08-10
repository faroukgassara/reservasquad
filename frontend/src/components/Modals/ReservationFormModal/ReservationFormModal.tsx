'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerActions, DrawerForm, DrawerScrollContent } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Checkbox from '@/components/Primitives/Checkbox/Checkbox';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import type { ReservationRecord, ReservationStatus } from '@/lib/reservation-api';
import { calculateReservationPrice, formatMoney } from '@/lib/reservation-api';
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

function splitLocalDateTime(value: string): { date: string; time: string } {
    if (!value) return { date: '', time: '' };
    const [date = '', timePart = ''] = value.split('T');
    return { date, time: timePart.slice(0, 5) };
}

function joinLocalDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${date}T${time}`;
}

function formatTime24h(value: string): string {
    const { time } = splitLocalDateTime(value);
    return time || '—';
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
        () =>
            professors.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName}`,
            })),
        [professors],
    );

    const form = useForm({
        defaultValues: {
            title: reservation?.title ?? '',
            roomId: reservation?.roomId ?? '',
            professorId: reservation?.professorId ?? '',
            startAt: reservation ? toLocalInputValue(reservation.startAt) : defaultStartAt ?? '',
            endAt: reservation ? toLocalInputValue(reservation.endAt) : defaultEndAt ?? '',
            notes: reservation?.notes ?? '',
            status: (reservation?.status ?? 'CONFIRMED') as ReservationStatus,
            isPaid: reservation?.isPaid ?? false,
            manualPrice: isEdit,
            price: priceToInput(reservation?.price),
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as ReservationFormValues);
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
                                placeholder={t('professor')}
                            />
                        )}
                    </form.Field>
                    <form.Field
                        name="startAt"
                        validators={{
                            onSubmit: ({ value }) => (value ? undefined : t('startAt')),
                        }}
                    >
                        {({ state, handleChange }) => {
                            const { date, time } = splitLocalDateTime(state.value);
                            return (
                                <div>
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-700"
                                        className="mb-1.5 block"
                                    >
                                        {t('startAt')}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            id="reservation-start-date"
                                            type="date"
                                            lang="fr"
                                            className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                            value={date}
                                            onChange={(e) =>
                                                handleChange(joinLocalDateTime(e.target.value, time || '00:00'))
                                            }
                                            required
                                        />
                                        <input
                                            id="reservation-start-time"
                                            type="time"
                                            lang="fr"
                                            step={60}
                                            className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                            value={time}
                                            onChange={(e) =>
                                                handleChange(joinLocalDateTime(date, e.target.value))
                                            }
                                            required
                                        />
                                    </div>
                                    {state.value ? (
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-500"
                                            className="mt-1 block"
                                        >
                                            {t('time24hHint', { time: formatTime24h(state.value) })}
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
                            );
                        }}
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
                        {({ state, handleChange }) => {
                            const { date, time } = splitLocalDateTime(state.value);
                            return (
                                <div>
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-700"
                                        className="mb-1.5 block"
                                    >
                                        {t('endAt')}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            id="reservation-end-date"
                                            type="date"
                                            lang="fr"
                                            className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                            value={date}
                                            onChange={(e) =>
                                                handleChange(joinLocalDateTime(e.target.value, time || '00:00'))
                                            }
                                            required
                                        />
                                        <input
                                            id="reservation-end-time"
                                            type="time"
                                            lang="fr"
                                            step={60}
                                            className="ds-input-field h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900"
                                            value={time}
                                            onChange={(e) =>
                                                handleChange(joinLocalDateTime(date, e.target.value))
                                            }
                                            required
                                        />
                                    </div>
                                    {state.value ? (
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-500"
                                            className="mt-1 block"
                                        >
                                            {t('time24hHint', { time: formatTime24h(state.value) })}
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
                            );
                        }}
                    </form.Field>
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
                                        className="block"
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
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="reservation-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                    />
                    <Button
                        id="reservation-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}
