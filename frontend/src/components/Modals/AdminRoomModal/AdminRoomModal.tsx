'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import MoleculeModal from '@/components/Molecules/MoleculeModal/MoleculeModal';
import type IAdminRoomModalProps from '@/interfaces/Modals/IAdminRoomModalProps/IAdminRoomModalProps';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6})$/;

export default function AdminRoomModal({
    isEditing,
    name,
    capacity,
    color,
    description,
    equipment,
    pricePerHour,
    submitting,
    onNameChange,
    onCapacityChange,
    onColorChange,
    onDescriptionChange,
    onEquipmentChange,
    onPricePerHourChange,
    onClose,
    onSubmit,
}: Readonly<IAdminRoomModalProps>) {
    const t = useTranslations();
    const isValidColor = HEX_COLOR_PATTERN.test(color);
    const canSubmit = Boolean(name.trim()) && capacity >= 1 && isValidColor;

    return (
        <MoleculeModal
            title=""
            canClose={false}
            canCloseOnClickOutisde={!submitting}
            isDrawer={false}
            className="max-w-lg rounded-2xl bg-white shadow-xl"
            bodyClassName="p-6"
        >
            <AtomDiv className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto text-sm">
                <AtomLabel variant={EVariantLabel.h4} color="text-gray-900" className="mb-1 block font-semibold">
                    {isEditing ? t('admin.rooms.editTitle') : t('admin.rooms.newRoom')}
                </AtomLabel>
                <MoleculeInput
                    id="admin-room-name"
                    label={t('admin.rooms.name')}
                    required
                    type={EInputType.text}
                    value={name}
                    onChange={onNameChange}
                />
                <AtomDiv className="flex gap-2">
                    <MoleculeInput
                        id="admin-room-capacity"
                        containerClassName="flex-1"
                        label={t('admin.rooms.capacity')}
                        required
                        type={EInputType.intNumber}
                        min={1}
                        max={200}
                        value={capacity}
                        onChange={onCapacityChange}
                    />
                    <MoleculeInput
                        id="admin-room-price"
                        containerClassName="flex-1"
                        label={t('admin.rooms.pricePerHour')}
                        type={EInputType.number}
                        min={0}
                        step="0.01"
                        value={pricePerHour}
                        onChange={onPricePerHourChange}
                    />
                </AtomDiv>
                <MoleculeInput
                    id="admin-room-color"
                    label={t('admin.rooms.color')}
                    required
                    type={EInputType.text}
                    value={color}
                    onChange={onColorChange}
                    hintText={!isValidColor && color ? t('admin.rooms.colorHint') : undefined}
                />
                <MoleculeInput
                    id="admin-room-description"
                    label={t('admin.rooms.description')}
                    type={EInputType.text}
                    value={description}
                    onChange={onDescriptionChange}
                />
                <MoleculeInput
                    id="admin-room-equipment"
                    label={t('admin.rooms.equipment')}
                    type={EInputType.text}
                    value={equipment}
                    onChange={onEquipmentChange}
                />
                <AtomDiv className="mt-4 flex gap-2">
                    <AtomButton
                        id="admin-room-modal-close"
                        type={EButtonType.secondary}
                        className="flex-1"
                        disabled={submitting}
                        onClick={onClose}
                        text={t('common.close')}
                    />
                    <AtomButton
                        id="admin-room-modal-submit"
                        type={EButtonType.primary}
                        className="flex-1 text-white bg-primary-900"
                        disabled={submitting || !canSubmit}
                        ariaBusy={submitting}
                        onClick={onSubmit}
                        text={isEditing ? t('common.update') : t('common.create')}
                    />
                </AtomDiv>
            </AtomDiv>
        </MoleculeModal>
    );
}
