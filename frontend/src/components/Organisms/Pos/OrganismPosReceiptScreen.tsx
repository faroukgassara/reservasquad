'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import OrganismPosReceipt from '@/components/Organisms/Pos/OrganismPosReceipt';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { toAmount, type PosOrderDetail } from '@/lib/pos-api';
import { printPosReceipt } from '@/lib/pos-print';

interface IOrganismPosReceiptScreen {
    order: PosOrderDetail;
    onNewOrder: () => void;
}

export default function OrganismPosReceiptScreen({ order, onNewOrder }: Readonly<IOrganismPosReceiptScreen>) {
    const t = useTranslations('pos.receipt');
    const receiptRef = useRef<HTMLDivElement>(null);
    const change = toAmount(order.change);

    return (
        <Div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-25">
            <Div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 lg:flex-row lg:items-start lg:p-8">
                <Div className="flex flex-1 flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                    <Div className="flex size-14 items-center justify-center rounded-full bg-success-50">
                        <Icon name={IconComponentsEnum.checkCircle} size={ESize.lg} color="text-success-600" />
                    </Div>
                    <Label variant={EVariantLabel.h4} color="text-gray-900">
                        {t('paymentSuccessful')}
                    </Label>
                    {change > 0 ? (
                        <Div className="flex flex-col">
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {t('changeToGive')}
                            </Label>
                            <Label variant={EVariantLabel.h3} color="text-success-600" className="tabular-nums">
                                {formatMoney(change)}
                            </Label>
                        </Div>
                    ) : null}
                    <Div className="flex w-full flex-col gap-2 pt-2">
                        <Button
                            id="pos-receipt-print"
                            type={EButtonType.secondary}
                            size={EButtonSize.large}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.printer, size: ESize.sm, color: 'text-primary-500' }}
                            text={t('print')}
                            onClick={() => printPosReceipt(receiptRef.current)}
                            className="h-12 w-full rounded-lg"
                        />
                        <Button
                            id="pos-receipt-new-order"
                            type={EButtonType.primary}
                            size={EButtonSize.large}
                            iconPosition="right"
                            icon={{ name: IconComponentsEnum.arrowRight, size: ESize.sm, color: 'text-white' }}
                            text={t('newOrder')}
                            onClick={onNewOrder}
                            className="h-12 w-full rounded-lg"
                        />
                    </Div>
                </Div>
                <div ref={receiptRef} className="w-full lg:w-80">
                    <OrganismPosReceipt order={order} />
                </div>
            </Div>
        </Div>
    );
}
