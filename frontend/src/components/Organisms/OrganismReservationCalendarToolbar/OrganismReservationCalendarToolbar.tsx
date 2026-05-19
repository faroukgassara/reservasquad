'use client';

import MoleculeTab from '@/components/Molecules/MoleculeTab/MoleculeTab';
import type { CalendarViewMode } from '@/types/calendar';
import { ESize } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';

type OrganismReservationCalendarToolbarProps = {
    calendarView: CalendarViewMode;
    onCalendarViewChange: (v: CalendarViewMode) => void;
};

export default function OrganismReservationCalendarToolbar({
    calendarView,
    onCalendarViewChange,
}: Readonly<OrganismReservationCalendarToolbarProps>) {
    const t = useTranslations();

    return (
        <MoleculeTab
            variant="pill"
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
    );
}
