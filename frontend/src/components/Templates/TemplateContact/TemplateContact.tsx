'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import { EInputType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { submitContactMessage } from '@/lib/contact-api';
import { useToast } from '@/contexts/ToastContext';

const MAP_URL = 'https://maps.app.goo.gl/HhYDoQx8pintRHrB7?g_st=aw';
const MAP_EMBED_URL = 'https://www.google.com/maps?q=34.7416728,10.7476497&z=16&output=embed';

export default function TemplateContact() {
    const t = useTranslations('contact');
    const { openToast } = useToast();

    const mutation = useMutation({
        mutationFn: submitContactMessage,
        onSuccess: () => {
            openToast(t('successTitle'), t('successMessage'), { type: EToastType.SUCCESS });
        },
        onError: (e: Error) => {
            openToast(t('errorTitle'), e.message, { type: EToastType.ERROR });
        },
    });

    const form = useForm({
        defaultValues: { name: '', email: '', message: '' },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync({
                name: value.name.trim(),
                email: value.email.trim(),
                message: value.message.trim(),
            });
            form.reset();
        },
    });

    return (
        <Div className="bg-gray-50 py-12 sm:py-16 lg:py-20">
            <Div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <Div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg sm:p-10 lg:p-14">
                    <Div className="mb-10 text-center lg:mb-14">
                        <Label
                            variant={EVariantLabel.h3}
                            color="text-primary-600"
                            className="inline-block border-b-4 border-accent-500 pb-2 uppercase"
                        >
                            {t('title')}
                        </Label>
                    </Div>

                    <Div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        <Div>
                            <Label variant={EVariantLabel.h5} color="text-gray-900" className="mb-6 block">
                                {t('leaveMessage')}
                            </Label>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit();
                                }}
                                className="flex flex-col gap-5"
                            >
                                <form.Field
                                    name="name"
                                    validators={{
                                        onSubmit: ({ value }) => (value?.trim() ? undefined : t('validation.nameRequired')),
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-name"
                                            label={t('name')}
                                            placeholder={t('placeholders.name')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            hintText={state.meta.errors?.[0]}
                                            error={!!state.meta.errors?.length}
                                        />
                                    )}
                                </form.Field>

                                <form.Field
                                    name="email"
                                    validators={{
                                        onSubmit: ({ value }) => {
                                            const v = value?.trim() ?? '';
                                            if (!v) return t('validation.emailRequired');
                                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t('validation.emailInvalid');
                                            return undefined;
                                        },
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-email"
                                            label={t('email')}
                                            type={EInputType.email}
                                            placeholder={t('placeholders.email')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            hintText={state.meta.errors?.[0]}
                                            error={!!state.meta.errors?.length}
                                        />
                                    )}
                                </form.Field>

                                <form.Field
                                    name="message"
                                    validators={{
                                        onSubmit: ({ value }) =>
                                            (value?.trim().length ?? 0) < 3 ? t('validation.messageTooShort') : undefined,
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-message"
                                            label={t('message')}
                                            placeholder={t('placeholders.message')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            isTextArea
                                            rows={6}
                                            hintText={state.meta.errors?.[0]}
                                            error={!!state.meta.errors?.length}
                                        />
                                    )}
                                </form.Field>

                                <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                                    {([canSubmit, isSubmitting]) => (
                                        <button
                                            id="contact-send"
                                            type="submit"
                                            disabled={!canSubmit || isSubmitting || mutation.isPending}
                                            className="h-12 w-full rounded-lg bg-accent-500 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {mutation.isPending || isSubmitting ? t('sending') : t('send')}
                                        </button>
                                    )}
                                </form.Subscribe>
                            </form>
                        </Div>

                        <Div>
                            <Div className="space-y-4 text-gray-700">
                                <Label variant={EVariantLabel.h6} color="text-gray-900" className="block">
                                    Biblio Squad
                                </Label>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block">
                                    {t('getInTouch')}
                                    <br />
                                    {t('address')}
                                </Label>
                                <a href="tel:+33100000000" className="block">
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-800"
                                        className="underline decoration-gray-300 underline-offset-4 hover:text-primary-600"
                                    >
                                        +216 95275812
                                    </Label>
                                </a>
                                <a href="mailto:contact@bibliosquad.tn" className="block">
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-primary-600"
                                        className="hover:underline"
                                    >
                                        contact@bibliosquad.tn
                                    </Label>
                                </a>
                            </Div>

                            <Div className="mt-8 flex items-center gap-5">
                                <Icon name={IconComponentsEnum.youtube} size={ESize.sm} color="text-gray-900" />
                                <Icon name={IconComponentsEnum.instagram} size={ESize.sm} color="text-gray-900" />
                                <Icon name={IconComponentsEnum.facebook} size={ESize.sm} color="text-gray-900" />
                                <Icon name={IconComponentsEnum.xTwitter} size={ESize.sm} color="text-gray-900" />
                            </Div>

                            <Div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white ring-1 ring-black/5">
                                <iframe
                                    src={MAP_EMBED_URL}
                                    title={t('mapTitle')}
                                    className="h-48 w-full border-0 sm:h-56"
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                                <a
                                    href={MAP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block border-t border-gray-200 px-4 py-3 text-center transition-colors hover:bg-gray-50"
                                >
                                    <Label variant={EVariantLabel.bodySmall} color="text-primary-600">
                                        {t('openMap')}
                                    </Label>
                                </a>
                            </Div>
                        </Div>
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}
