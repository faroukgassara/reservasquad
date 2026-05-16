'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import MoleculeModal from '@/components/Molecules/MoleculeModal/MoleculeModal';
import type IAdminTeacherReservationModalProps from '@/interfaces/Modals/IAdminTeacherReservationModalProps/IAdminTeacherReservationModalProps';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import type { ChangeEvent } from 'react';

function dropdownToString(value: string | number | string[]): string {
    return String(Array.isArray(value) ? value[0] ?? '' : value);
}

export default function AdminTeacherReservationModal({
    teacherOptions,
    roomOptions,
    startOptions,
    endOptions,
    bookTeacherId,
    bookDate,
    bookRoomId,
    bookStart,
    bookEnd,
    bookPeople,
    bookPurpose,
    roomCapacityMax,
    submitting,
    onTeacherIdChange,
    onDateChange,
    onRoomIdChange,
    onStartChange,
    onEndChange,
    onPeopleChange,
    onPurposeChange,
    onClose,
    onSubmit,
}: Readonly<IAdminTeacherReservationModalProps>) {
    return (
        <MoleculeModal
            title=""
            canClose={false}
            canCloseOnClickOutisde={!submitting}
            isDrawer={false}
            className="max-w-lg rounded-2xl bg-white shadow-xl"
            bodyClassName="p-6"
        >
            <AtomDiv className="flex flex-col gap-3 text-sm">
                <AtomLabel variant={EVariantLabel.h4} color="text-gray-900" className="mb-1 block font-semibold">
                    Réservation confirmée (professeur)
                </AtomLabel>
                <MoleculeDropdown
                    label="Professeur"
                    required
                    options={teacherOptions}
                    value={bookTeacherId}
                    onChange={(v) => onTeacherIdChange(dropdownToString(v))}
                />
                <MoleculeInput
                    id="admin-modal-date"
                    label="Date"
                    required
                    type={EInputType.date}
                    value={bookDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onDateChange(e.target.value)}
                />
                <MoleculeDropdown
                    label="Salle"
                    required
                    options={roomOptions}
                    value={bookRoomId}
                    onChange={(v) => onRoomIdChange(dropdownToString(v))}
                />
                <AtomDiv className="flex gap-2">
                    <MoleculeDropdown
                        containerClassName="flex-1"
                        label="Début"
                        options={startOptions}
                        value={bookStart}
                        onChange={(v) => onStartChange(dropdownToString(v))}
                    />
                    <MoleculeDropdown
                        containerClassName="flex-1"
                        label="Fin"
                        options={endOptions}
                        value={bookEnd}
                        onChange={(v) => onEndChange(dropdownToString(v))}
                    />
                </AtomDiv>
                <MoleculeInput
                    id="admin-modal-people"
                    label="Participants"
                    required
                    type={EInputType.intNumber}
                    min={1}
                    max={roomCapacityMax}
                    value={bookPeople}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onPeopleChange(Number(e.target.value))}
                />
                <MoleculeInput
                    id="admin-modal-purpose"
                    label="Motif"
                    required
                    type={EInputType.text}
                    value={bookPurpose}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onPurposeChange(e.target.value)}
                />
                <AtomDiv className="mt-4 flex gap-2">
                    <AtomButton
                        id="admin-modal-close"
                        type={EButtonType.secondary}
                        className="flex-1"
                        disabled={submitting}
                        onClick={onClose}
                        text="Fermer"
                    />
                    <AtomButton
                        id="admin-modal-submit"
                        type={EButtonType.primary}
                        className="flex-1 text-white bg-primary-900"
                        disabled={submitting || !bookTeacherId}
                        ariaBusy={submitting}
                        onClick={() => void onSubmit()}
                        text="Enregistrer"
                    />
                </AtomDiv>
            </AtomDiv>
        </MoleculeModal>
    );
}
