'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import TimePickerField from '@/components/Primitives/DatePicker/TimePickerField';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, ESize, EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPortalAvailability, toDateInput, toIsoDateTime } from '@/lib/portal-api';

const TITLE_MAX = 120;
const NOTES_MAX = 500;

export interface PortalBookingValues {
    roomId: string;
    startAt: string;
    endAt: string;
    title?: string;
    notes?: string;
}

interface IPortalBookingModal {
    rooms: { id: string; name: string }[];
    defaultRoomId?: string;
    defaultDate: string;
    defaultStart: string;
    defaultEnd: string;
    isLoading?: boolean;
    onConfirm: (values: PortalBookingValues) => void;
}

export default function PortalBookingModal({
    rooms,
    defaultRoomId,
    defaultDate,
    defaultStart,
    defaultEnd,
    isLoading = false,
    onConfirm,
}: Readonly<IPortalBookingModal>) {
    const t = useTranslations('portal.book');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [roomId, setRoomId] = useState(defaultRoomId ?? rooms[0]?.id ?? '');
    const [date, setDate] = useState(defaultDate);
    const [startTime, setStartTime] = useState(defaultStart);
    const [endTime, setEndTime] = useState(defaultEnd);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');

    const startAt = date && startTime ? toIsoDateTime(date, startTime) : '';
    const endAt = date && endTime ? toIsoDateTime(date, endTime) : '';

    let slotError: string | null = null;
    if (!startAt || !endAt) slotError = t('pickSlot');
    else if (new Date(endAt) <= new Date(startAt)) slotError = t('endAfterStart');
    else if (new Date(startAt).getTime() < Date.now()) slotError = t('inPast');

    // Confirms the room is free and returns this professor's own price for the slot.
    const availability = useQuery({
        queryKey: ['portal-availability', startAt, endAt],
        queryFn: () => fetchPortalAvailability(startAt, endAt),
        enabled: !slotError,
    });
    const quote = availability.data?.rooms.find((room) => room.id === roomId);

    const renderStatus = () => {
        if (slotError) {
            return (
                <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                    {slotError}
                </Label>
            );
        }
        if (availability.isLoading) {
            return (
                <Div className="flex items-center gap-2">
                    <Spinner color="text-primary-500" size={ESize.sm} />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                        {t('checking')}
                    </Label>
                </Div>
            );
        }
        if (availability.isError) {
            return (
                <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                    {t('availabilityError')}
                </Label>
            );
        }
        if (!quote) {
            return (
                <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                    {t('roomBusy')}
                </Label>
            );
        }
        return (
            <Div className="flex items-center justify-between gap-3">
                <Label variant={EVariantLabel.bodySmall} color="text-success-700" className="font-medium">
                    {t('roomFree')}
                </Label>
                <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-semibold tabular-nums">
                    {formatMoney(quote.estimatedPrice)}
                </Label>
            </Div>
        );
    };

    return (
        <Modal title={t('confirmTitle')} subTitle={t('confirmSubtitle')} canClose canCloseOnClickOutisde>
            <Div className="space-y-4">
                <Dropdown
                    label={t('room')}
                    options={rooms.map((room) => ({ value: room.id, label: room.name }))}
                    value={roomId}
                    onChange={(value) => {
                        if (typeof value === 'string') setRoomId(value);
                    }}
                />
                <DatePickerField
                    id="portal-booking-date"
                    label={t('date')}
                    required
                    value={date}
                    min={toDateInput(new Date())}
                    onChange={setDate}
                />
                <Div className="grid grid-cols-2 gap-3">
                    <Div className="flex flex-col gap-1.5">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                            {t('start')}
                        </Label>
                        <TimePickerField id="portal-booking-start" value={startTime} onChange={setStartTime} />
                    </Div>
                    <Div className="flex flex-col gap-1.5">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                            {t('end')}
                        </Label>
                        <TimePickerField
                            id="portal-booking-end"
                            value={endTime}
                            error={slotError === t('endAfterStart')}
                            onChange={setEndTime}
                        />
                    </Div>
                </Div>

                <Div className="rounded-xl bg-gray-50 px-4 py-3">{renderStatus()}</Div>

                <Input
                    id="portal-booking-title"
                    label={t('titleLabel')}
                    placeholder={t('titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                />
                <Input
                    id="portal-booking-notes"
                    label={t('notesLabel')}
                    value={notes}
                    isTextArea
                    rows={2}
                    onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                />

                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                    {t('noCancelHint')}
                </Label>

                <Div className="flex gap-3">
                    <Button
                        id="portal-booking-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="portal-booking-confirm"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={t('confirm')}
                        isLoading={isLoading}
                        disabled={!quote || Boolean(slotError)}
                        onClick={() =>
                            onConfirm({
                                roomId,
                                startAt,
                                endAt,
                                title: title.trim() || undefined,
                                notes: notes.trim() || undefined,
                            })
                        }
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}
