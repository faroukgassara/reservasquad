'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import type { ReservationRoom, TeacherOption } from '@/types/calendar';
import { endTimeOptions, startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import { useMemo } from 'react';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';

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
    selectedRoomCapacity,
    submitting,
    onSubmit,
    onClose,
}: Readonly<OrganismReservationBookingModalProps>) {
    const teacherOptions = useMemo(
        () =>
            teachers.length ?
                teachers.map((t) => ({ value: t.id, label: t.name }))
            :   [{ value: '', label: 'Aucun professeur (admin)' }],
        [teachers],
    );

    const roomOptions = useMemo(
        () => rooms.map((r) => ({ value: r.id, label: `${r.name} (${r.capacity} pers.)` })),
        [rooms],
    );

    const startOpts = useMemo(() => startTimeOptions().map((t) => ({ value: t, label: t })), []);
    const endOpts = useMemo(
        () =>
            (bookStart ? validEndsForStart(bookStart) : endTimeOptions()).map((t) => ({
                value: t,
                label: t,
            })),
        [bookStart],
    );

    return (
        <AtomDiv className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <AtomDiv className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <AtomLabel variant={EVariantLabel.h4} color="text-primary-900" className="mb-4 block font-semibold">
                    Nouvelle demande de réservation
                </AtomLabel>
                <AtomDiv className="flex flex-col gap-3 text-sm">
                    <MoleculeDropdown
                        label="Professeur"
                        required
                        placeholder={teachers.length ? '— Choisir —' : 'Aucun professeur (admin)'}
                        options={teacherOptions}
                        value={bookTeacherId}
                        onChange={(v) => setBookTeacherId(String(v))}
                        hintText="La liste est mise à jour par l’administration."
                    />
                    <MoleculeInput
                        id="booking-modal-date"
                        label="Date"
                        required
                        type={EInputType.date}
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                    />
                    <MoleculeDropdown
                        label="Salle"
                        required
                        options={roomOptions}
                        value={bookRoomId}
                        onChange={(v) => setBookRoomId(String(v))}
                    />
                    <AtomDiv className="flex gap-3">
                        <MoleculeDropdown
                            containerClassName="flex-1"
                            label="Début"
                            options={startOpts}
                            value={bookStart}
                            onChange={(v) => setBookStart(String(v))}
                        />
                        <MoleculeDropdown
                            containerClassName="flex-1"
                            label="Fin"
                            options={endOpts}
                            value={bookEnd}
                            onChange={(v) => setBookEnd(String(v))}
                        />
                    </AtomDiv>
                    <MoleculeInput
                        id="booking-modal-people"
                        label="Nombre de personnes"
                        required
                        type={EInputType.intNumber}
                        min={1}
                        max={selectedRoomCapacity}
                        value={bookPeople}
                        onChange={(e) => setBookPeople(Number(e.target.value))}
                        hintText={`Capacité max ${selectedRoomCapacity} pour cette salle`}
                    />
                    <MoleculeInput
                        id="booking-modal-purpose"
                        label="Objet / description"
                        required
                        type={EInputType.text}
                        maxLength={500}
                        value={bookPurpose}
                        onChange={(e) => setBookPurpose(e.target.value)}
                    />
                    <AtomDiv className="mt-4 flex gap-3">
                        <AtomButton
                            id="booking-modal-cancel"
                            type={EButtonType.secondary}
                            className="flex-1"
                            disabled={submitting}
                            onClick={onClose}
                            text="Annuler"
                        />
                        <AtomButton
                            id="booking-modal-submit"
                            type={EButtonType.primary}
                            className="flex-1 font-semibold text-white bg-primary-900"
                            disabled={submitting || !bookRoomId || teachers.length === 0}
                            ariaBusy={submitting}
                            onClick={onSubmit}
                            text={submitting ? 'Envoi…' : 'Envoyer la demande'}
                        />
                    </AtomDiv>
                </AtomDiv>
            </AtomDiv>
        </AtomDiv>
    );
}
