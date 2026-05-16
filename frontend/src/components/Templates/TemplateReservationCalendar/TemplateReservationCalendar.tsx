'use client';

import OrganismReservationBookingModal from '@/components/Organisms/OrganismReservationBookingModal/OrganismReservationBookingModal';
import OrganismReservationCalendarBanner from '@/components/Organisms/OrganismReservationCalendarBanner/OrganismReservationCalendarBanner';
import OrganismReservationCalendarMonthGrid from '@/components/Organisms/OrganismReservationCalendarMonthGrid/OrganismReservationCalendarMonthGrid';
import OrganismReservationCalendarToolbar from '@/components/Organisms/OrganismReservationCalendarToolbar/OrganismReservationCalendarToolbar';
import OrganismReservationReadPanel from '@/components/Organisms/OrganismReservationReadPanel/OrganismReservationReadPanel';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import { useReservationCalendar } from '@/hooks/useReservationCalendar';
import { EVariantLabel } from '@/Enum/Enum';
import { addMonths, format } from 'date-fns';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';

export type { CalendarReservation } from '@/types/calendar';

export type TemplateReservationCalendarProps = {
    variant?: 'public' | 'admin';
};

export default function TemplateReservationCalendar({ variant = 'public' }: Readonly<TemplateReservationCalendarProps>) {
    const cal = useReservationCalendar();

    return (
        <AtomDiv className="p-4 lg:p-8">
            <OrganismReservationCalendarBanner variant={variant} />

            <OrganismReservationCalendarToolbar
                onPrevMonth={() => cal.setMonthCursor((d) => addMonths(d, -1))}
                onNextMonth={() => cal.setMonthCursor((d) => addMonths(d, 1))}
                onNewBooking={() => cal.openBooking(format(new Date(), 'yyyy-MM-dd'))}
            />

            {cal.error ? (
                <AtomDiv className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-danger-700">
                        {cal.error}
                    </AtomLabel>
                </AtomDiv>
            ) : null}

            <OrganismReservationCalendarMonthGrid
                monthCursor={cal.monthCursor}
                gridDays={cal.gridDays}
                weekDays={cal.weekDays}
                byDay={cal.byDay}
                loading={cal.loading}
                onOpenBooking={cal.openBooking}
                onSelectReservation={cal.setSelected}
            />

            {cal.selected ?
                <OrganismReservationReadPanel selected={cal.selected} onClose={() => cal.setSelected(null)} />
            : null}

            {cal.showForm ?
                <OrganismReservationBookingModal
                    rooms={cal.rooms}
                    teachers={cal.teachers}
                    bookTeacherId={cal.bookTeacherId}
                    setBookTeacherId={cal.setBookTeacherId}
                    bookDate={cal.bookDate}
                    setBookDate={cal.setBookDate}
                    bookRoomId={cal.bookRoomId}
                    setBookRoomId={cal.setBookRoomId}
                    bookStart={cal.bookStart}
                    setBookStart={cal.setBookStart}
                    bookEnd={cal.bookEnd}
                    setBookEnd={cal.setBookEnd}
                    bookPeople={cal.bookPeople}
                    setBookPeople={cal.setBookPeople}
                    bookPurpose={cal.bookPurpose}
                    setBookPurpose={cal.setBookPurpose}
                    selectedRoomCapacity={cal.selectedRoomCapacity}
                    submitting={cal.submitting}
                    onSubmit={() => void cal.submitBooking()}
                    onClose={() => cal.setShowForm(false)}
                />
            : null}
        </AtomDiv>
    );
}
