'use client';

import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import { EInputType, EVariantLabel } from '@/Enum/Enum';
import {
    formatTnd,
    RESERVATION_PRICE_MODE_OPTIONS,
    type ReservationPriceMode,
} from '@/lib/reservation-pricing';
import type { ChangeEvent } from 'react';

function dropdownToString(value: string | number | string[]): string {
    return String(Array.isArray(value) ? value[0] ?? '' : value);
}

type Props = Readonly<{
    priceMode: ReservationPriceMode;
    manualPriceTnd: number;
    computedTotalTnd: number;
    onPriceModeChange: (mode: ReservationPriceMode) => void;
    onManualPriceChange: (amount: number) => void;
}>;

export default function MoleculeReservationPricingBlock({
    priceMode,
    manualPriceTnd,
    computedTotalTnd,
    onPriceModeChange,
    onManualPriceChange,
}: Props) {
    return (
        <AtomDiv className="flex flex-col gap-3 border-t border-slate-100 pt-3">
            <MoleculeDropdown
                label="Calcul du prix (TND)"
                required
                options={RESERVATION_PRICE_MODE_OPTIONS}
                value={priceMode}
                onChange={(v) => onPriceModeChange(dropdownToString(v) as ReservationPriceMode)}
            />
            {priceMode === 'MANUAL' ?
                <MoleculeInput
                    id="reservation-price-manual"
                    label="Montant (TND)"
                    required
                    type={EInputType.number}
                    min={0}
                    step="0.01"
                    value={manualPriceTnd}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onManualPriceChange(Number(e.target.value))
                    }
                />
            : null}
            <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-600">
                Total estimatif :{' '}
                <span className="font-semibold text-gray-900">
                    {formatTnd(computedTotalTnd)} TND
                </span>
            </AtomLabel>
        </AtomDiv>
    );
}
