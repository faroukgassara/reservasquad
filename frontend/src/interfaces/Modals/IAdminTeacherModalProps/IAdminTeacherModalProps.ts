import type { ChangeEvent } from 'react';

export default interface IAdminTeacherModalProps {
    isEditing: boolean;
    teacherName: string;
    email: string;
    phone: string;
    submitting: boolean;
    onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onPhoneChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onSubmit: () => void;
}
