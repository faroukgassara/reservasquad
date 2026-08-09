'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Input from '@/components/Primitives/Input/Input';
import StarRating from '@/components/Primitives/StarRating/StarRating';
import { useCurrentModal } from '@/contexts/ModalContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';

interface TestimonialFormModalProps {
    onSubmit: (values: {
        firstName: string;
        lastName: string;
        email: string;
        title: string;
        description: string;
        rating: number;
    }) => Promise<void>;
    isLoading?: boolean;
}

const TestimonialFormModal: React.FC<TestimonialFormModalProps> = ({ onSubmit, isLoading = false }) => {
    const t = useTranslations('testimonialForm');
    const { closeModal } = useCurrentModal();
    const isCompact = useMediaQuery('(max-width: 639px)');

    const form = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            title: '',
            description: '',
            rating: 0,
        },
        onSubmit: async ({ value }) => {
            await onSubmit({
                firstName: value.firstName.trim(),
                lastName: value.lastName.trim(),
                email: value.email.trim(),
                title: value.title.trim(),
                description: value.description.trim(),
                rating: value.rating,
            });
            closeModal();
        },
    });

    return (
        <Modal
            canClose={false}
            canCloseOnClickOutisde
            className="w-[min(94vw,42rem)] max-h-[calc(100dvh-1.5rem)] overflow-hidden"
            bodyClassName="overflow-visible p-0"
        >
            <Div className="flex flex-col">
                <Div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
                    <Div className="min-w-0 flex-1 pr-2">
                        <Label variant={EVariantLabel.h5} color="text-gray-900">
                            {t('title')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-0.5 block">
                            {t('subtitle')}
                        </Label>
                    </Div>
                    <Button
                        id="testimonial-modal-close"
                        type={EButtonType.tertiary}
                        size={EButtonSize.medium}
                        iconPosition="only"
                        icon={{
                            name: IconComponentsEnum.close,
                            size: ESize.sm,
                            color: 'text-gray-600',
                        }}
                        onClick={closeModal}
                        aria-label={t('cancel')}
                    />
                </Div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col gap-3 px-4 py-3 sm:gap-3.5 sm:px-5 sm:py-4"
                >
                    <Div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                        <form.Field
                            name="firstName"
                            validators={{
                                onSubmit: ({ value }) => (!value?.trim() ? t('validation.firstNameRequired') : undefined),
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    id="testimonial-first-name"
                                    label={t('firstName')}
                                    placeholder={t('placeholders.firstName')}
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                    required
                                />
                            )}
                        </form.Field>

                        <form.Field
                            name="lastName"
                            validators={{
                                onSubmit: ({ value }) => (!value?.trim() ? t('validation.lastNameRequired') : undefined),
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    id="testimonial-last-name"
                                    label={t('lastName')}
                                    placeholder={t('placeholders.lastName')}
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                    required
                                />
                            )}
                        </form.Field>
                    </Div>

                    <Div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                        <form.Field
                            name="email"
                            validators={{
                                onSubmit: ({ value }) => {
                                    if (!value?.trim()) return t('validation.emailRequired');
                                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t('validation.emailInvalid');
                                    return undefined;
                                },
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    id="testimonial-email"
                                    label={t('email')}
                                    type={EInputType.email}
                                    placeholder={t('placeholders.email')}
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                    required
                                />
                            )}
                        </form.Field>

                        <form.Field
                            name="title"
                            validators={{
                                onSubmit: ({ value }) => (!value?.trim() ? t('validation.titleRequired') : undefined),
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    id="testimonial-title"
                                    label={t('titleField')}
                                    placeholder={t('placeholders.titleField')}
                                    value={state.value}
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                    required
                                />
                            )}
                        </form.Field>
                    </Div>

                    <form.Field
                        name="description"
                        validators={{
                            onSubmit: ({ value }) => {
                                if (!value?.trim()) return t('validation.descriptionRequired');
                                if (value.trim().length < 10) return t('validation.descriptionMinLength');
                                return undefined;
                            },
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                id="testimonial-description"
                                label={t('description')}
                                placeholder={t('placeholders.description')}
                                value={state.value}
                                onChange={(e) => handleChange(e.target.value)}
                                isTextArea
                                rows={isCompact ? 2 : 3}
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="rating"
                        validators={{
                            onSubmit: ({ value }) => (value < 1 ? t('validation.ratingRequired') : undefined),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 sm:px-4">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                    {t('rating')} <span className="text-danger-500">*</span>
                                </Label>
                                <Div className="flex flex-col items-end gap-1">
                                    <StarRating value={state.value} onChange={handleChange} />
                                    {state.meta.errors?.[0] && (
                                        <Label variant={EVariantLabel.hint} color="text-danger-600">
                                            {state.meta.errors[0]}
                                        </Label>
                                    )}
                                </Div>
                            </Div>
                        )}
                    </form.Field>

                    <Div className="flex gap-2.5 border-t border-gray-100 pt-3 sm:gap-3 sm:pt-4">
                        <Button
                            id="testimonial-form-cancel"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            text={t('cancel')}
                            onClick={closeModal}
                            className="flex-1"
                        />
                        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    id="testimonial-form-submit"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    text={isSubmitting || isLoading ? t('sending') : t('submit')}
                                    disabled={!canSubmit || isSubmitting || isLoading}
                                    onClick={() => form.handleSubmit()}
                                    className="flex-1"
                                />
                            )}
                        </form.Subscribe>
                    </Div>
                </form>
            </Div>
        </Modal>
    );
};

export default TestimonialFormModal;
