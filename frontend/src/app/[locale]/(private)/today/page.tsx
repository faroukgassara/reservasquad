'use client';

import { useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Icon from '@/components/Primitives/Icon/Icon';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import {
    bulkMarkReservationsPaid,
    fetchTodaySnapshot,
    formatMoney,
    type TodayProfessor,
    type TodayRoomRow,
    type TodayUnpaidReservation,
} from '@/lib/reservation-api';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { useToast } from '@/contexts/ToastContext';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRange(startAt: string, endAt: string): string {
    return `${formatTime(startAt)} – ${formatTime(endAt)}`;
}

function professorName(professor: TodayProfessor | null): string {
    if (!professor) return '—';
    return `${professor.firstName} ${professor.lastName}`.trim();
}

function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
}: Readonly<{
    icon: IconComponentsEnum;
    iconBg: string;
    iconColor: ELabelColor;
    label: string;
    value: string;
}>) {
    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="flex items-center gap-3">
                <Div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <Icon name={icon} size={ESize.sm} color={iconColor} />
                </Div>
                <Div className="min-w-0 flex flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {label}
                    </Label>
                    <Label variant={EVariantLabel.h5} color="text-gray-900" className="block">
                        {value}
                    </Label>
                </Div>
            </Div>
        </Div>
    );
}

function SectionTitle({ title, action }: Readonly<{ title: string; action?: ReactNode }>) {
    return (
        <Div className="mb-3 flex items-center justify-between gap-3">
            <Label variant={EVariantLabel.h6} color="text-gray-900">
                {title}
            </Label>
            {action}
        </Div>
    );
}

function RoomStatusCard({
    room,
    t,
}: Readonly<{
    room: TodayRoomRow;
    t: ReturnType<typeof useTranslations<'admin.today'>>;
}>) {
    const occupied = room.status === 'OCCUPIED';
    return (
        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Div className="mb-3 flex items-start justify-between gap-2">
                <Div className="min-w-0 flex items-center gap-2">
                    <Label variant={EVariantLabel.body} color="text-gray-900" className="block truncate">
                        {room.roomName}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('capacity', { count: room.capacity })}
                    </Label>
                </Div>
                <Badge
                    id={`today-room-status-${room.roomId}`}
                    text={occupied ? t('occupied') : t('free')}
                    type={occupied ? EBadgeType.warning : EBadgeType.success}
                    size={EBadgeSize.small}
                />
            </Div>

            {occupied && room.current ? (
                <Div className="space-y-1">
                    <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                        {room.current.title?.trim() || t('untitled')}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {professorName(room.current.professor)}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                        {formatRange(room.current.startAt, room.current.endAt)}
                    </Label>
                    {room.nextFreeAt ? (
                        <Label variant={EVariantLabel.caption} color="text-primary-600" className="block ml-1">
                            {t('freesAt', { time: formatTime(room.nextFreeAt) })}
                        </Label>
                    ) : null}
                </Div>
            ) : (
                <Div className="flex justify-between space-y-1">
                    {room.freeUntil ? (
                        <Label variant={EVariantLabel.caption} color="text-success-600" className="block">
                            {t('freeUntil', { time: formatTime(room.freeUntil) })}
                        </Label>
                    ) : null}
                    {room.nextBusy ? (
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                            {t('nextBusy', {
                                time: formatTime(room.nextBusy.startAt),
                                who: professorName(room.nextBusy.professor),
                            })}
                        </Label>
                    ) : (
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                            {t('freeRestOfDay')}
                        </Label>
                    )}
                </Div>
            )}
        </Div>
    );
}

function timingBadgeType(timing: TodayUnpaidReservation['timing']): EBadgeType {
    if (timing === 'ONGOING') return EBadgeType.warning;
    if (timing === 'ENDED') return EBadgeType.revwarning;
    return EBadgeType.primary;
}

export default function TodayPage() {
    const t = useTranslations('admin.today');
    const tCommon = useTranslations('common');
    const tPay = useTranslations('admin.reservations');
    const { openToast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['today-snapshot'],
        queryFn: fetchTodaySnapshot,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    const markPaidMutation = useMutation({
        mutationFn: bulkMarkReservationsPaid,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['today-snapshot'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            openToast(tCommon('success'), tPay('bulkPaidSuccess', { count: result.updated }), {
                type: EToastType.SUCCESS,
            });
        },
        onError: (err: Error) =>
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR }),
    });

    const unpaidIds = useMemo(
        () => data?.unpaidToday.map((row) => row.id) ?? [],
        [data?.unpaidToday],
    );

    const updatedLabel = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
          })
        : null;

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            rightActions={
                <Div className="flex items-center gap-2">
                    {updatedLabel ? (
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="hidden sm:block">
                            {t('updatedAt', { time: updatedLabel })}
                        </Label>
                    ) : null}
                    <Button
                        id="today-refresh"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        text={t('refresh')}
                        isLoading={isFetching}
                        onClick={() => refetch()}
                    />
                </Div>
            }
            mainSection={
                <Div className="space-y-8">
                    {isLoading && !data ? (
                        <Div className="flex justify-center py-16">
                            <Spinner color="text-primary-500" size="lg" />
                        </Div>
                    ) : null}

                    {error && !data ? (
                        <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
                            {error instanceof Error ? error.message : tCommon('error')}
                        </Label>
                    ) : null}

                    {data ? (
                        <>
                            <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    icon={IconComponentsEnum.home}
                                    iconBg="bg-warning-50"
                                    iconColor="text-warning-600"
                                    label={t('kpiOccupied')}
                                    value={String(data.counts.roomsOccupied)}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.check}
                                    iconBg="bg-success-50"
                                    iconColor="text-success-600"
                                    label={t('kpiFree')}
                                    value={String(data.counts.roomsFree)}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.calendar}
                                    iconBg="bg-primary-50"
                                    iconColor="text-primary-600"
                                    label={t('kpiConfirmed')}
                                    value={String(data.counts.confirmedToday)}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.bell}
                                    iconBg="bg-danger-50"
                                    iconColor="text-danger-600"
                                    label={t('kpiUnpaid')}
                                    value={String(data.counts.unpaidToday)}
                                />
                            </Div>

                            <Div>
                                <SectionTitle title={t('roomsSection')} />
                                {data.rooms.length === 0 ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {t('noRooms')}
                                    </Label>
                                ) : (
                                    <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {data.rooms.map((room) => (
                                            <RoomStatusCard key={room.roomId} room={room} t={t} />
                                        ))}
                                    </Div>
                                )}
                            </Div>

                            <Div>
                                <SectionTitle title={t('nextFreeSection')} />
                                {data.nextFreeSlots.length === 0 ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {t('noFreeSlots')}
                                    </Label>
                                ) : (
                                    <Div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                        <Div className="divide-y divide-gray-100">
                                            {data.nextFreeSlots.map((slot) => (
                                                <Div
                                                    key={`${slot.roomId}-${slot.availableAt}`}
                                                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                                                >
                                                    <Div className="min-w-0">
                                                        <Label
                                                            variant={EVariantLabel.body}
                                                            color="text-gray-900"
                                                            className="block"
                                                        >
                                                            {slot.roomName}
                                                        </Label>
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color="text-gray-500"
                                                            className="block ml-1"
                                                        >
                                                            {new Date(slot.availableAt).getTime() <= Date.now() + 1000
                                                                ? t('availableNow')
                                                                : t('availableAt', {
                                                                      time: formatTime(slot.availableAt),
                                                                  })}
                                                        </Label>
                                                    </Div>
                                                    {slot.freeUntil ? (
                                                        <Label variant={EVariantLabel.caption} color="text-gray-600">
                                                            {t('freeUntil', { time: formatTime(slot.freeUntil) })}
                                                        </Label>
                                                    ) : null}
                                                </Div>
                                            ))}
                                        </Div>
                                    </Div>
                                )}
                            </Div>

                            <Div>
                                <SectionTitle
                                    title={t('unpaidSection')}
                                    action={
                                        unpaidIds.length > 0 ? (
                                            <Button
                                                id="today-mark-paid"
                                                type={EButtonType.primary}
                                                size={EButtonSize.small}
                                                text={tPay('bulkPaidSelected', { count: unpaidIds.length })}
                                                isLoading={markPaidMutation.isPending}
                                                onClick={() => markPaidMutation.mutate(unpaidIds)}
                                            />
                                        ) : null
                                    }
                                />
                                {data.unpaidToday.length === 0 ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {t('noUnpaid')}
                                    </Label>
                                ) : (
                                    <Div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                        <Div className="divide-y divide-gray-100">
                                            {data.unpaidToday.map((row) => (
                                                <Div
                                                    key={row.id}
                                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                                >
                                                    <Div className="min-w-0 flex-1">
                                                        <Div className="mb-1 flex flex-wrap items-center gap-2">
                                                            <Label
                                                                variant={EVariantLabel.body}
                                                                color="text-gray-900"
                                                            >
                                                                {row.room.name}
                                                            </Label>
                                                            <Badge
                                                                id={`today-unpaid-timing-${row.id}`}
                                                                text={t(`timing.${row.timing}`)}
                                                                type={timingBadgeType(row.timing)}
                                                                size={EBadgeSize.small}
                                                            />
                                                        </Div>
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color="text-gray-500"
                                                            className="block"
                                                        >
                                                            {row.title?.trim() || t('untitled')} ·{' '}
                                                            {professorName(row.professor)}
                                                        </Label>
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color="text-gray-500"
                                                            className="block"
                                                        >
                                                            {formatRange(row.startAt, row.endAt)}
                                                        </Label>
                                                    </Div>
                                                    <Div className="flex items-center gap-3">
                                                        <Label
                                                            variant={EVariantLabel.body}
                                                            color="text-gray-900"
                                                        >
                                                            {formatMoney(row.price)}
                                                        </Label>
                                                        <Link href={Routes.Reservations.index}>
                                                            <Button
                                                                id={`today-open-${row.id}`}
                                                                type={EButtonType.secondary}
                                                                size={EButtonSize.small}
                                                                text={t('openReservations')}
                                                            />
                                                        </Link>
                                                    </Div>
                                                </Div>
                                            ))}
                                        </Div>
                                    </Div>
                                )}
                            </Div>
                        </>
                    ) : null}
                </Div>
            }
        />
    );
}
