'use client';

import { useState } from 'react';
import {
    DropdownContent,
    DropdownItem,
    DropdownRoot,
    DropdownTrigger,
} from '@/components/Atoms/AtomDropdown/AtomDropdownLogic';
import AtomDropdownTrigger from '@/components/Atoms/AtomDropdown/AtomDropdownTrigger';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { Div, Label } from '@/components/Atoms';
import { Input, Button } from '@/components/Molecules';
import { twMerge } from 'tailwind-merge';

interface CategoryOption {
    id: string;
    name: string;
}

interface MoleculeFormationCategorySelectProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void;
    options: CategoryOption[];
    onCategoryAdded: (category: CategoryOption) => void;
    onCreateCategory: (name: string) => Promise<CategoryOption>;
    containerClassName?: string;
    required?: boolean;
    error?: string;
}

export default function MoleculeFormationCategorySelect({
    label,
    placeholder = 'Sélectionner une catégorie',
    value,
    onChange,
    options,
    onCategoryAdded,
    onCreateCategory,
    containerClassName,
    required = false,
    error,
}: Readonly<MoleculeFormationCategorySelectProps>) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const selectedOption = options.find((o) => o.id === value);

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name || isCreating) return;
        setIsCreating(true);
        try {
            const category = await onCreateCategory(name);
            onCategoryAdded(category);
            onChange(category.id);
            setNewCategoryName('');
            setShowAddForm(false);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <DropdownRoot
            value={value}
            onChange={(v) => onChange(String(v))}
            className={twMerge('relative flex flex-col', containerClassName)}
        >
            {label && (
                <Label color="text-gray-900" className="mb-1" variant={EVariantLabel.bodySmall}>
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
            )}
            <Div className="relative">
                <DropdownTrigger className="w-full">
                    <AtomDropdownTrigger
                        error={!!error}
                        disabled={false}
                        placeholder={placeholder}
                        label={selectedOption?.name}
                    />
                </DropdownTrigger>
                {error && (
                    <span className="text-red-500 text-sm mt-1">{error}</span>
                )}
                <DropdownContent>
                    {options.map((opt) => (
                        <DropdownItem key={opt.id} value={opt.id}>
                            <span>{opt.name}</span>
                        </DropdownItem>
                    ))}
                    {showAddForm ? (
                        <Div
                            className="border-t border-gray-100 p-3 space-y-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Input
                                placeholder="Nom de la catégorie"
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                id="new-category-name"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                    if (e.key === 'Escape') {
                                        setShowAddForm(false);
                                        setNewCategoryName('');
                                    }
                                }}
                            />
                            <Div className="flex gap-2">
                                <Button
                                    id="add-category"
                                    type={EButtonType.primary}
                                    size={EButtonSize.small}
                                    text={
                                        isCreating ? 'Création...' : 'Ajouter'
                                    }
                                    disabled={
                                        !newCategoryName.trim() || isCreating
                                    }
                                    onClick={handleAddCategory}
                                />
                                <Button
                                    id="cancel-category-creation"
                                    type={EButtonType.secondary}
                                    size={EButtonSize.small}
                                    text="Annuler"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewCategoryName('');
                                    }}
                                />
                            </Div>
                        </Div>
                    ) : (
                        <Button
                            id="add-category"
                            type={EButtonType.primary}
                            size={EButtonSize.small}
                            text="Ajouter une catégorie"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                setShowAddForm(true);
                            }}
                        />
                    )}
                </DropdownContent>
            </Div>
        </DropdownRoot>
    );
}
