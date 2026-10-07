'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerScrollContent } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import OrganismPosOrderDetail from '@/components/Organisms/Pos/OrganismPosOrderDetail';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { fetchPosOrders, formatOrderNumber, formatPosDateTime, personName, toAmount } from '@/lib/pos-api';

interface PosSessionOrdersModalProps {
    sessionId: string;
}

export default function PosSessionOrdersModal({ sessionId }: Readonly<PosSessionOrdersModalProps>) {
    const t = useTranslations('pos.orders');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['pos-orders', 'session', sessionId, debouncedSearch],
        queryFn: () =>
            fetchPosOrders({ sessionId, page: 1, perPage: 100, search: debouncedSearch || undefined }),
    });

    const orders = data?.data ?? [];

    return (
        <Modal title={t('sessionTitle')} subTitle={t('sessionSubtitle')} canClose canCloseOnClickOutisde isDrawer>
            <DrawerScrollContent>
                {selectedId ? (
                    <>
                        <Button
                            id="pos-session-orders-back"
                            type={EButtonType.secondary}
                            size={EButtonSize.small}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.sm, color: 'text-primary-500' }}
                            text={t('backToList')}
                            onClick={() => setSelectedId(null)}
                            className="self-start"
                        />
                        <OrganismPosOrderDetail orderId={selectedId} canRefund onOpenOrder={setSelectedId} />
                    </>
                ) : (
                    <>
                        <Input
                            id="pos-session-orders-search"
                            leftIcon="search"
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {isLoading ? (
                            <Div className="flex justify-center py-8">
                                <Spinner size={ESize.lg} color="text-primary-500" />
                            </Div>
                        ) : null}
                        {!isLoading && orders.length === 0 ? (
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="py-6">
                                {t('empty')}
                            </Label>
                        ) : null}
                        <Div className="space-y-1">
                            {orders.map((order) => (
                                <button
                                    key={order.id}
                                    type="button"
                                    onClick={() => setSelectedId(order.id)}
                                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                                >
                                    <Div className="flex min-w-0 flex-col">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                            {t('orderNumber', { number: formatOrderNumber(order.number) })}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                            {order.creditClient
                                                ? `${formatPosDateTime(order.createdAt)} · ${personName(order.creditClient)}`
                                                : formatPosDateTime(order.createdAt)}
                                        </Label>
                                    </Div>
                                    <Div className="flex shrink-0 flex-col items-end gap-1">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                                            {formatMoney(toAmount(order.total))}
                                        </Label>
                                        {order.status === 'REFUND' ? (
                                            <Badge
                                                id={`pos-session-order-status-${order.id}`}
                                                text={t('statusRefund')}
                                                type={EBadgeType.warning}
                                                size={EBadgeSize.small}
                                            />
                                        ) : null}
                                    </Div>
                                </button>
                            ))}
                        </Div>
                    </>
                )}
            </DrawerScrollContent>
        </Modal>
    );
}
