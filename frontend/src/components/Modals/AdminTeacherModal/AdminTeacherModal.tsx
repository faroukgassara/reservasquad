'use client';

import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import MoleculeModal from '@/components/Molecules/MoleculeModal/MoleculeModal';
import type IAdminTeacherModalProps from '@/interfaces/Modals/IAdminTeacherModalProps/IAdminTeacherModalProps';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';

export default function AdminTeacherModal({
    isEditing,
    teacherName,
    email,
    phone,
    submitting,
    onNameChange,
    onEmailChange,
    onPhoneChange,
    onClose,
    onSubmit,
}: Readonly<IAdminTeacherModalProps>) {
    const t = useTranslations();

    return (
        <MoleculeModal
            title=""
            canClose={false}
            canCloseOnClickOutisde={!submitting}
            isDrawer={false}
            className="max-w-lg rounded-2xl bg-white shadow-xl"
            bodyClassName="p-6"
        >
            <AtomDiv className="flex flex-col gap-3 text-sm">
                <AtomLabel variant={EVariantLabel.h4} color="text-gray-900" className="mb-1 block font-semibold">
                    {isEditing ? t('admin.teachers.editTitle') : t('admin.teachers.newTeacher')}
                </AtomLabel>
                <MoleculeInput
                    id="admin-teacher-name"
                    label={t('admin.teachers.displayName')}
                    required
                    type={EInputType.text}
                    value={teacherName}
                    onChange={onNameChange}
                />
                <MoleculeInput
                    id="admin-teacher-email"
                    label={t('admin.teachers.emailUnique')}
                    required
                    type={EInputType.email}
                    value={email}
                    onChange={onEmailChange}
                />
                <MoleculeInput
                    id="admin-teacher-phone"
                    label={t('admin.teachers.phone')}
                    type={EInputType.text}
                    placeholder={t('admin.teachers.phonePlaceholder')}
                    value={phone}
                    onChange={onPhoneChange}
                />
                <AtomDiv className="mt-4 flex gap-2">
                    <AtomButton
                        id="admin-teacher-modal-close"
                        type={EButtonType.secondary}
                        className="flex-1"
                        disabled={submitting}
                        onClick={onClose}
                        text={t('common.close')}
                    />
                    <AtomButton
                        id="admin-teacher-modal-submit"
                        type={EButtonType.primary}
                        className="flex-1 text-white bg-primary-900"
                        disabled={submitting || !teacherName.trim() || !email.trim()}
                        ariaBusy={submitting}
                        onClick={onSubmit}
                        text={isEditing ? t('common.update') : t('common.create')}
                    />
                </AtomDiv>
            </AtomDiv>
        </MoleculeModal>
    );
}
