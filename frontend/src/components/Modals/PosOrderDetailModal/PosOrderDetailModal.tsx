'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerScrollContent } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import OrganismPosOrderDetail from '@/components/Organisms/Pos/OrganismPosOrderDetail';

interface PosOrderDetailModalProps {
    orderId: string;
    canRefund: boolean;
}

export default function PosOrderDetailModal({ orderId, canRefund }: Readonly<PosOrderDetailModalProps>) {
    const t = useTranslations('pos.orders');
    const [currentId, setCurrentId] = useState(orderId);

    return (
        <Modal title={t('detailTitle')} subTitle={t('detailSubtitle')} canClose canCloseOnClickOutisde isDrawer>
            <DrawerScrollContent>
                <OrganismPosOrderDetail orderId={currentId} canRefund={canRefund} onOpenOrder={setCurrentId} />
            </DrawerScrollContent>
        </Modal>
    );
}
