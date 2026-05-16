'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import { EButtonType, EVariantLabel } from '@/Enum/Enum';

type OrganismReservationCalendarToolbarProps = {
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onNewBooking: () => void;
};

export default function OrganismReservationCalendarToolbar({
    onPrevMonth,
    onNextMonth,
    onNewBooking,
}: Readonly<OrganismReservationCalendarToolbarProps>) {
    return (
        <AtomDiv className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AtomDiv>
                <AtomLabel variant={EVariantLabel.h3} color="text-primary-900" className="font-semibold tracking-tight">
                    Planning des salles d&apos;étude
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600" className="mt-1 block">
                    Vue mensuelle — cliquez un créneau pour les détails
                </AtomLabel>
            </AtomDiv>
            <AtomDiv className="flex flex-wrap items-center gap-2">
                <AtomButton
                    id="calendar-toolbar-prev-month"
                    type={EButtonType.secondary}
                    className="px-3! py-2! text-sm"
                    onClick={onPrevMonth}
                    text="← Mois précédent"
                />
                <AtomButton
                    id="calendar-toolbar-next-month"
                    type={EButtonType.secondary}
                    className="px-3! py-2! text-sm"
                    onClick={onNextMonth}
                    text="Mois suivant →"
                />
                <AtomButton
                    id="calendar-toolbar-new-booking"
                    type={EButtonType.primary}
                    className="px-4! py-2! text-sm font-semibold shadow bg-primary-900"
                    onClick={onNewBooking}
                    text="Nouvelle réservation"
                />
            </AtomDiv>
        </AtomDiv>
    );
}
