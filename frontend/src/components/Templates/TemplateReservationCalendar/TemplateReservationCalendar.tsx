'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismReservationBookingModal from '@/components/Organisms/OrganismReservationBookingModal/OrganismReservationBookingModal';
import OrganismReservationCalendarBanner from '@/components/Organisms/OrganismReservationCalendarBanner/OrganismReservationCalendarBanner';
import OrganismReservationCalendarDayPanel from '@/components/Organisms/OrganismReservationCalendarDayPanel/OrganismReservationCalendarDayPanel';
import OrganismReservationCalendarMonthGrid from '@/components/Organisms/OrganismReservationCalendarMonthGrid/OrganismReservationCalendarMonthGrid';
import OrganismReservationCalendarToolbar from '@/components/Organisms/OrganismReservationCalendarToolbar/OrganismReservationCalendarToolbar';
import OrganismReservationCalendarWeekGrid from '@/components/Organisms/OrganismReservationCalendarWeekGrid/OrganismReservationCalendarWeekGrid';
import OrganismReservationReadPanel from '@/components/Organisms/OrganismReservationReadPanel/OrganismReservationReadPanel';
import { useReservationCalendar } from '@/hooks/useReservationCalendar';
import { EButtonType, EVariantLabel } from '@/Enum/Enum';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

export type { CalendarReservation } from '@/types/calendar';

export type TemplateReservationCalendarProps = {
    variant?: 'public' | 'admin';
};

export default function TemplateReservationCalendar({ variant = 'public' }: Readonly<TemplateReservationCalendarProps>) {
    const cal = useReservationCalendar();
    const t = useTranslations();

    const headerActions = (
        <AtomDiv className="flex flex-wrap items-center gap-2">
            <AtomButton
                id="calendar-toolbar-nav-prev"
                type={EButtonType.secondary}
                className="px-3! py-2! text-sm"
                onClick={cal.navigateCalendarPrev}
                text={cal.navigatePrevLabel}
            />
            <AtomButton
                id="calendar-toolbar-nav-next"
                type={EButtonType.secondary}
                className="px-3! py-2! text-sm"
                onClick={cal.navigateCalendarNext}
                text={cal.navigateNextLabel}
            />
            <AtomButton
                id="calendar-toolbar-new-booking"
                type={EButtonType.primary}
                className="px-4! py-2! text-sm font-semibold shadow bg-primary-600 hover:bg-primary-700"
                onClick={() =>
                    cal.calendarView === 'day' ?
                        cal.openBooking(cal.focusedDayIso)
                    :   cal.openBooking(format(new Date(), 'yyyy-MM-dd'))
                }
                text={t('calendar.newBooking')}
            />
        </AtomDiv>
    );

    return (
        <LayoutWrapper
            title={t('calendar.title')}
            subTitle={`${cal.calendarPeriodTitle} — ${cal.calendarViewSubtitle}`}
            rightActions={headerActions}
            mainSection={
                <>
                    <OrganismReservationCalendarBanner variant={variant} />

                    <AtomDiv className="mb-6">
                        <OrganismReservationCalendarToolbar
                            calendarView={cal.calendarView}
                            onCalendarViewChange={cal.setCalendarView}
                        />
                    </AtomDiv>

                    {cal.error ?
                        <AtomDiv className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
                            <AtomLabel variant={EVariantLabel.bodySmall} color="text-danger-700">
                                {cal.error}
                            </AtomLabel>
                        </AtomDiv>
                    :   null}

                    {cal.calendarView === 'month' ?
                        <OrganismReservationCalendarMonthGrid
                            monthCursor={cal.monthCursor}
                            gridDays={cal.gridDays}
                            weekDays={cal.weekDays}
                            byDay={cal.byDay}
                            loading={cal.loading}
                            onOpenBooking={cal.openBooking}
                            onSelectReservation={cal.setSelected}
                        />
                    : cal.calendarView === 'week' ?
                        <OrganismReservationCalendarWeekGrid
                            daysInWeek={cal.daysInWeek}
                            rowWeekdayLabels={cal.weekDays}
                            byDay={cal.byDay}
                            loading={cal.loading}
                            onOpenBooking={cal.openBooking}
                            onSelectReservation={cal.setSelected}
                        />
                    :   <OrganismReservationCalendarDayPanel
                            reservationsSorted={cal.dayReservationsSorted}
                            loading={cal.loading}
                            dayIso={cal.focusedDayIso}
                            onOpenBooking={cal.openBooking}
                            onSelectReservation={cal.setSelected}
                        />
                    }

                    {cal.selected ?
                        <OrganismReservationReadPanel selected={cal.selected} onClose={() => cal.setSelected(null)} />
                    :   null}

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
                            bookPriceMode={cal.bookPriceMode}
                            setBookPriceMode={cal.setBookPriceMode}
                            bookManualPriceTnd={cal.bookManualPrice}
                            setBookManualPriceTnd={cal.setBookManualPrice}
                            computedBookingPriceTnd={cal.bookPricePreviewTnd}
                            selectedRoomCapacity={cal.selectedRoomCapacity}
                            submitting={cal.submitting}
                            onSubmit={() => void cal.submitBooking()}
                            onClose={() => cal.setShowForm(false)}
                        />
                    :   null}
                </>
            }
        />
    );
}
