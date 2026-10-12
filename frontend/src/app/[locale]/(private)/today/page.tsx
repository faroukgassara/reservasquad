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
import StatCard from '@/components/Primitives/StatCard/StatCard';
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

function SectionTitle({
    title,
    icon,
    action,
}: Readonly<{
    title: string;
    icon?: IconComponentsEnum;
    action?: ReactNode;
}>) {
    return (
        <Div className="mb-3.5 flex items-center justify-between gap-3">
            <Div className="flex items-center gap-2">
                {icon ? (
                    <Div className="flex size-7 items-center justify-center rounded-lg bg-primary-50">
                        <Icon name={icon} size={ESize.xs} color="text-primary-600" />
                    </Div>
                ) : null}
                <Label variant={EVariantLabel.h6} color="text-gray-900" className="font-semibold">
                    {title}
                </Label>
            </Div>
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
        <Div className="group flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-primary-300 hover:shadow-md">
            <div>
                <Div className="mb-3 flex items-start justify-between gap-2">
                    <Div className="min-w-0 flex items-center gap-2">
                        <Label variant={EVariantLabel.body} color="text-gray-900" className="block truncate font-bold">
                            {room.roomName}
                        </Label>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                            {t('capacity', { count: room.capacity })}
                        </span>
                    </Div>
                    <Badge
                        id={`today-room-status-${room.roomId}`}
                        text={occupied ? t('occupied') : t('free')}
                        type={occupied ? EBadgeType.warning : EBadgeType.success}
                        size={EBadgeSize.small}
                    />
                </Div>

                {occupied && room.current ? (
                    <Div className="rounded-xl bg-warning-50/60 p-2.5">
                        <Div className="flex items-center gap-2">
                            <Div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[11px] font-bold text-warning-800">
                                {room.current.professor?.firstName?.[0] || 'P'}
                            </Div>
                            <Label variant={EVariantLabel.caption} color="text-gray-900" className="block truncate font-semibold">
                                {professorName(room.current.professor)}
                            </Label>
                        </Div>
                        <Div className="mt-1.5 flex items-center justify-between text-xs text-gray-600">
                            <span>{formatRange(room.current.startAt, room.current.endAt)}</span>
                            {room.nextFreeAt ? (
                                <span className="font-medium text-primary-600">
                                    {t('freesAt', { time: formatTime(room.nextFreeAt) })}
                                </span>
                            ) : null}
                        </Div>
                    </Div>
                ) : (
                    <Div className="rounded-xl bg-success-50/40 p-2.5">
                        <Div className="flex items-center justify-between gap-2">
                            {room.freeUntil ? (
                                <span className="text-xs font-semibold text-success-700">
                                    {t('freeUntil', { time: formatTime(room.freeUntil) })}
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-success-700">
                                    {t('freeRestOfDay')}
                                </span>
                            )}
                            {room.nextBusy ? (
                                <span className="text-xs text-gray-500 truncate" title={professorName(room.nextBusy.professor)}>
                                    {t('nextBusy', {
                                        time: formatTime(room.nextBusy.startAt),
                                        who: professorName(room.nextBusy.professor),
                                    })}
                                </span>
                            ) : null}
                        </Div>
                    </Div>
                )}
            </div>
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
                                    iconColor="text-warning-700"
                                    label={t('kpiOccupied')}
                                    value={String(data.counts.roomsOccupied)}
                                    isLoading={isLoading}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.check}
                                    iconBg="bg-success-50"
                                    iconColor="text-success-700"
                                    label={t('kpiFree')}
                                    value={String(data.counts.roomsFree)}
                                    isLoading={isLoading}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.calendar}
                                    iconBg="bg-primary-50"
                                    iconColor="text-primary-600"
                                    label={t('kpiConfirmed')}
                                    value={String(data.counts.confirmedToday)}
                                    isLoading={isLoading}
                                />
                                <StatCard
                                    icon={IconComponentsEnum.bell}
                                    iconBg="bg-danger-50"
                                    iconColor="text-danger-600"
                                    label={t('kpiUnpaid')}
                                    value={String(data.counts.unpaidToday)}
                                    isLoading={isLoading}
                                />
                            </Div>

                            <Div>
                                <SectionTitle title={t('roomsSection')} icon={IconComponentsEnum.home} />
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
                                <SectionTitle title={t('nextFreeSection')} icon={IconComponentsEnum.clock} />
                                {data.nextFreeSlots.length === 0 ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {t('noFreeSlots')}
                                    </Label>
                                ) : (
                                    <Div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
                                        <Div className="divide-y divide-gray-100">
                                            {data.nextFreeSlots.map((slot) => (
                                                <Div
                                                    key={`${slot.roomId}-${slot.availableAt}`}
                                                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-gray-50/80"
                                                >
                                                    <Div className="min-w-0">
                                                        <Label
                                                            variant={EVariantLabel.body}
                                                            color="text-gray-900"
                                                            className="block font-semibold"
                                                        >
                                                            {slot.roomName}
                                                        </Label>
                                                        <Label
                                                            variant={EVariantLabel.caption}
                                                            color="text-gray-500"
                                                            className="block"
                                                        >
                                                            {new Date(slot.availableAt).getTime() <= Date.now() + 1000
                                                                ? t('availableNow')
                                                                : t('availableAt', {
                                                                      time: formatTime(slot.availableAt),
                                                                  })}
                                                        </Label>
                                                    </Div>
                                                    {slot.freeUntil ? (
                                                        <span className="rounded-lg bg-success-50 px-2 py-1 text-xs font-semibold text-success-700">
                                                            {t('freeUntil', { time: formatTime(slot.freeUntil) })}
                                                        </span>
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
                                    icon={IconComponentsEnum.bell}
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
                                    <Div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                            {t('noUnpaid')}
                                        </Label>
                                    </Div>
                                ) : (
                                    <Div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
                                        <Div className="divide-y divide-gray-100">
                                            {data.unpaidToday.map((row) => (
                                                <Div
                                                    key={row.id}
                                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/80"
                                                >
                                                    <Div className="min-w-0 flex-1">
                                                        <Div className="mb-1 flex flex-wrap items-center gap-2">
                                                             <Label
                                                                variant={EVariantLabel.body}
                                                                color="text-gray-900"
                                                                className="font-semibold"
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
                                                            color="text-gray-600"
                                                            className="block font-medium"
                                                        >
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
                                                        <span className="font-bold text-gray-900 tabular-nums">
                                                            {formatMoney(row.price)}
                                                        </span>
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
