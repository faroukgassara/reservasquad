'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeReservationPricingBlock from '@/components/Molecules/MoleculeReservationPricingBlock/MoleculeReservationPricingBlock';
import type { ReservationRoom, TeacherOption } from '@/types/calendar';
import type { ReservationPriceMode } from '@/lib/reservation-pricing';
import { endTimeOptions, startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import { useMemo } from 'react';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import { useTranslations } from 'next-intl';

type OrganismReservationBookingModalProps = {
    rooms: ReservationRoom[];
    teachers: TeacherOption[];
    bookTeacherId: string;
    setBookTeacherId: (v: string) => void;
    bookDate: string;
    setBookDate: (v: string) => void;
    bookRoomId: string;
    setBookRoomId: (v: string) => void;
    bookStart: string;
    setBookStart: (v: string) => void;
    bookEnd: string;
    setBookEnd: (v: string) => void;
    bookPeople: number;
    setBookPeople: (v: number) => void;
    bookPurpose: string;
    setBookPurpose: (v: string) => void;
    bookPriceMode: ReservationPriceMode;
    setBookPriceMode: (v: ReservationPriceMode) => void;
    bookManualPriceTnd: number;
    setBookManualPriceTnd: (v: number) => void;
    computedBookingPriceTnd: number;
    selectedRoomCapacity: number;
    submitting: boolean;
    onSubmit: () => void;
    onClose: () => void;
};

export default function OrganismReservationBookingModal({
    rooms,
    teachers,
    bookTeacherId,
    setBookTeacherId,
    bookDate,
    setBookDate,
    bookRoomId,
    setBookRoomId,
    bookStart,
    setBookStart,
    bookEnd,
    setBookEnd,
    bookPeople,
    setBookPeople,
    bookPurpose,
    setBookPurpose,
    bookPriceMode,
    setBookPriceMode,
    bookManualPriceTnd,
    setBookManualPriceTnd,
    computedBookingPriceTnd,
    selectedRoomCapacity,
    submitting,
    onSubmit,
    onClose,
}: Readonly<OrganismReservationBookingModalProps>) {
    const t = useTranslations();

    const teacherOptions = useMemo(
        () =>
            teachers.length ?
                teachers.map((teacher) => ({ value: teacher.id, label: teacher.name }))
            :   [{ value: '', label: t('reservation.noTeacherAdmin') }],
        [teachers, t],
    );

    const roomOptions = useMemo(
        () =>
            rooms.map((r) => ({
                value: r.id,
                label: t('reservation.roomOption', { name: r.name, capacity: r.capacity }),
            })),
        [rooms, t],
    );

    const startOpts = useMemo(() => startTimeOptions().map((time) => ({ value: time, label: time })), []);
    const endOpts = useMemo(
        () =>
            (bookStart ? validEndsForStart(bookStart) : endTimeOptions()).map((time) => ({
                value: time,
                label: time,
            })),
        [bookStart],
    );

    return (
        <AtomDiv className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <AtomDiv className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <AtomLabel variant={EVariantLabel.h4} color="text-primary-900" className="mb-4 block font-semibold">
                    {t('reservation.newRequest')}
                </AtomLabel>
                <AtomDiv className="flex flex-col gap-3 text-sm">
                    <MoleculeDropdown
                        label={t('reservation.teacher')}
                        required
                        placeholder={teachers.length ? t('reservation.choosePlaceholder') : t('reservation.noTeacherAdmin')}
                        options={teacherOptions}
                        value={bookTeacherId}
                        onChange={(v) => setBookTeacherId(String(v))}
                        hintText={t('reservation.teacherListHint')}
                    />
                    <MoleculeInput
                        id="booking-modal-date"
                        label={t('reservation.date')}
                        required
                        type={EInputType.date}
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                    />
                    <MoleculeDropdown
                        label={t('reservation.room')}
                        required
                        options={roomOptions}
                        value={bookRoomId}
                        onChange={(v) => setBookRoomId(String(v))}
                    />
                    <AtomDiv className="flex gap-3">
                        <MoleculeDropdown
                            containerClassName="flex-1"
                            label={t('reservation.start')}
                            options={startOpts}
                            value={bookStart}
                            onChange={(v) => setBookStart(String(v))}
                        />
                        <MoleculeDropdown
                            containerClassName="flex-1"
                            label={t('reservation.end')}
                            options={endOpts}
                            value={bookEnd}
                            onChange={(v) => setBookEnd(String(v))}
                        />
                    </AtomDiv>
                    <MoleculeInput
                        id="booking-modal-people"
                        label={t('reservation.peopleCount')}
                        required
                        type={EInputType.intNumber}
                        min={1}
                        max={selectedRoomCapacity}
                        value={bookPeople}
                        onChange={(e) => setBookPeople(Number(e.target.value))}
                        hintText={t('reservation.roomCapacityHint', { capacity: selectedRoomCapacity })}
                    />
                    <MoleculeInput
                        id="booking-modal-purpose"
                        label={t('reservation.purpose')}
                        required
                        type={EInputType.text}
                        maxLength={500}
                        value={bookPurpose}
                        onChange={(e) => setBookPurpose(e.target.value)}
                    />
                    <MoleculeReservationPricingBlock
                        priceMode={bookPriceMode}
                        manualPriceTnd={bookManualPriceTnd}
                        computedTotalTnd={computedBookingPriceTnd}
                        onPriceModeChange={setBookPriceMode}
                        onManualPriceChange={setBookManualPriceTnd}
                    />
                    <AtomDiv className="mt-4 flex gap-3">
                        <AtomButton
                            id="booking-modal-cancel"
                            type={EButtonType.secondary}
                            className="flex-1"
                            disabled={submitting}
                            onClick={onClose}
                            text={t('common.cancel')}
                        />
                        <AtomButton
                            id="booking-modal-submit"
                            type={EButtonType.primary}
                            className="flex-1 font-semibold text-white bg-primary-900"
                            disabled={submitting || !bookRoomId || teachers.length === 0}
                            ariaBusy={submitting}
                            onClick={onSubmit}
                            text={submitting ? t('reservation.submitting') : t('reservation.sendRequest')}
                        />
                    </AtomDiv>
                </AtomDiv>
            </AtomDiv>
        </AtomDiv>
    );
}
