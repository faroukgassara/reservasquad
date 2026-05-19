'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeTab from '@/components/Molecules/MoleculeTab/MoleculeTab';
import type { CalendarViewMode } from '@/types/calendar';
import { EButtonType, ESize, EVariantLabel } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';

type OrganismReservationCalendarToolbarProps = {
    calendarView: CalendarViewMode;
    onCalendarViewChange: (v: CalendarViewMode) => void;
    periodTitle: string;
    viewSubtitle: string;
    navigatePrevLabel: string;
    navigateNextLabel: string;
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    onNewBooking: () => void;
};

export default function OrganismReservationCalendarToolbar({
    calendarView,
    onCalendarViewChange,
    periodTitle,
    viewSubtitle,
    navigatePrevLabel,
    navigateNextLabel,
    onNavigatePrev,
    onNavigateNext,
    onNewBooking,
}: Readonly<OrganismReservationCalendarToolbarProps>) {
    const t = useTranslations();

    return (
        <AtomDiv className="mb-6 flex flex-col gap-4">
            <AtomDiv>
                <AtomLabel variant={EVariantLabel.h3} color="text-primary-900" className="font-semibold tracking-tight">
                    {t('calendar.title')}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.body} color="text-primary-900" className="mt-2 block capitalize">
                    {periodTitle}
                </AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600" className="mt-1 block">
                    {viewSubtitle}
                </AtomLabel>
            </AtomDiv>
            <AtomDiv className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <MoleculeTab
                    size={ESize.lg}
                    buttonClassName="!px-3"
                    options={[
                        { value: 'month', label: t('calendar.views.month') },
                        { value: 'week', label: t('calendar.views.week') },
                        { value: 'day', label: t('calendar.views.day') },
                    ]}
                    value={calendarView}
                    onChange={(v) => onCalendarViewChange(v as CalendarViewMode)}
                />
                <AtomDiv className="flex flex-wrap items-center gap-2">
                    <AtomButton
                        id="calendar-toolbar-nav-prev"
                        type={EButtonType.secondary}
                        className="px-3! py-2! text-sm"
                        onClick={onNavigatePrev}
                        text={navigatePrevLabel}
                    />
                    <AtomButton
                        id="calendar-toolbar-nav-next"
                        type={EButtonType.secondary}
                        className="px-3! py-2! text-sm"
                        onClick={onNavigateNext}
                        text={navigateNextLabel}
                    />
                    <AtomButton
                        id="calendar-toolbar-new-booking"
                        type={EButtonType.primary}
                        className="px-4! py-2! text-sm font-semibold shadow bg-primary-900"
                        onClick={onNewBooking}
                        text={t('calendar.newBooking')}
                    />
                </AtomDiv>
            </AtomDiv>
        </AtomDiv>
    );
}
