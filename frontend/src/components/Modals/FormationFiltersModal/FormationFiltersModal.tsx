'use client';

import { useState, useEffect } from 'react';
import { Div, Label } from '@/components/Atoms';
import { Button, Input } from '@/components/Molecules';
import MoleculeFormField from '@/components/Molecules/MoleculeFormField/MoleculeFormField';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';

export interface FormationFilters {
    status?: string;
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    durationMin?: number;
    durationMax?: number;
}

interface FormationFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FormationFilters;
    onApply: (filters: FormationFilters) => void;
    categories: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = [
    { label: 'Tous', value: '' },
    { label: 'Actif', value: 'ACTIVE' },
    { label: 'Inactif', value: 'INACTIVE' },
];

export default function FormationFiltersModal({
    isOpen,
    onClose,
    filters,
    onApply,
    categories,
}: FormationFiltersModalProps) {
    const categoryOptions = [
        { label: 'Toutes', value: '' },
        ...categories.map((c) => ({ label: c.name, value: c.id })),
    ];

    const [localStatus, setLocalStatus] = useState(filters.status ?? '');
    const [localCategoryId, setLocalCategoryId] = useState(filters.categoryId ?? '');
    const [localPriceMin, setLocalPriceMin] = useState(filters.priceMin?.toString() ?? '');
    const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax?.toString() ?? '');
    const [localDurationMin, setLocalDurationMin] = useState(filters.durationMin?.toString() ?? '');
    const [localDurationMax, setLocalDurationMax] = useState(filters.durationMax?.toString() ?? '');

    useEffect(() => {
        if (isOpen) {
            setLocalStatus(filters.status ?? '');
            setLocalCategoryId(filters.categoryId ?? '');
            setLocalPriceMin(filters.priceMin?.toString() ?? '');
            setLocalPriceMax(filters.priceMax?.toString() ?? '');
            setLocalDurationMin(filters.durationMin?.toString() ?? '');
            setLocalDurationMax(filters.durationMax?.toString() ?? '');
        }
    }, [isOpen, filters]);

    const handleApply = () => {
        onApply({
            status: localStatus || undefined,
            categoryId: localCategoryId || undefined,
            priceMin: localPriceMin ? Number(localPriceMin) : undefined,
            priceMax: localPriceMax ? Number(localPriceMax) : undefined,
            durationMin: localDurationMin ? Number(localDurationMin) : undefined,
            durationMax: localDurationMax ? Number(localDurationMax) : undefined,
        });
        onClose();
    };

    const handleCancel = () => {
        setLocalStatus(filters.status ?? '');
        setLocalCategoryId(filters.categoryId ?? '');
        setLocalPriceMin(filters.priceMin?.toString() ?? '');
        setLocalPriceMax(filters.priceMax?.toString() ?? '');
        setLocalDurationMin(filters.durationMin?.toString() ?? '');
        setLocalDurationMax(filters.durationMax?.toString() ?? '');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-label="Filtres des formations"
            >
                <div className="flex h-full flex-col p-6">
                    <Label
                        variant={EVariantLabel.h5}
                        color="text-gray-900"
                        className="mb-6 font-bold"
                    >
                        Filtres
                    </Label>

                    <div className="flex flex-1 flex-col gap-5 overflow-auto">
                        <MoleculeFormField label="Statut">
                            <MoleculeDropdown
                                options={STATUS_OPTIONS}
                                value={localStatus}
                                onChange={(v) => setLocalStatus(String(v))}
                                placeholder="Sélectionner"
                                containerClassName="w-full"
                            />
                        </MoleculeFormField>

                        <MoleculeFormField label="Catégorie">
                            <MoleculeDropdown
                                options={categoryOptions}
                                value={localCategoryId}
                                onChange={(v) => setLocalCategoryId(String(v))}
                                placeholder="Sélectionner"
                                containerClassName="w-full"
                            />
                        </MoleculeFormField>

                        <MoleculeFormField label="Prix (€)">
                            <Div className="flex gap-2">
                                <Input
                                    id="filter-price-min"
                                    type="number"
                                    placeholder="Min"
                                    value={localPriceMin}
                                    onChange={(e) => setLocalPriceMin(e.target.value)}
                                    containerClassName="flex-1"
                                    min={0}
                                    step={0.01}
                                />
                                <Input
                                    id="filter-price-max"
                                    type="number"
                                    placeholder="Max"
                                    value={localPriceMax}
                                    onChange={(e) => setLocalPriceMax(e.target.value)}
                                    containerClassName="flex-1"
                                    min={0}
                                    step={0.01}
                                />
                            </Div>
                        </MoleculeFormField>

                        <MoleculeFormField label="Durée (heures)">
                            <Div className="flex gap-2">
                                <Input
                                    id="filter-duration-min"
                                    type="number"
                                    placeholder="Min"
                                    value={localDurationMin}
                                    onChange={(e) => setLocalDurationMin(e.target.value)}
                                    containerClassName="flex-1"
                                    min={0}
                                    step={1}
                                />
                                <Input
                                    id="filter-duration-max"
                                    type="number"
                                    placeholder="Max"
                                    value={localDurationMax}
                                    onChange={(e) => setLocalDurationMax(e.target.value)}
                                    containerClassName="flex-1"
                                    min={0}
                                    step={1}
                                />
                            </Div>
                        </MoleculeFormField>
                    </div>

                    <Div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
                        <Button
                            id="filter-cancel"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            text="Annuler"
                            className="flex-1 !bg-white !border-gray-300"
                            onClick={handleCancel}
                        />
                        <Button
                            id="filter-apply"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text="Appliquer"
                            className="flex-1"
                            onClick={handleApply}
                        />
                    </Div>
                </div>
            </div>
        </>
    );
}
