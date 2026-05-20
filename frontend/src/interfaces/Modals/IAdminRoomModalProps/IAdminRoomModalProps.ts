import type { ChangeEvent } from 'react';

export default interface IAdminRoomModalProps {
    isEditing: boolean;
    name: string;
    capacity: number;
    color: string;
    description: string;
    equipment: string;
    pricePerHour: number;
    submitting: boolean;
    onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onCapacityChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onColorChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onEquipmentChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onPricePerHourChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onSubmit: () => void;
}
