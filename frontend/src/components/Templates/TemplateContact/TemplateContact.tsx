'use client';

import type { ReactNode } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Div, Label } from '@/components/Atoms';
import { Input } from '@/components/Molecules';
import { EToastType, EVariantLabel } from '@/Enum/Enum';
import { submitContactMessage } from '@/lib/contact-api';
import { useToast } from '@/contexts/ToastContext';

const MAP_IMG =
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=640&q=80';

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-gray-900 transition-opacity hover:opacity-70"
        >
            {children}
        </a>
    );
}

export default function TemplateContact() {
    const { openToast } = useToast();

    const mutation = useMutation({
        mutationFn: submitContactMessage,
        onSuccess: () => {
            openToast('Merci', 'Votre message a bien été envoyé.', { type: EToastType.SUCCESS });
        },
        onError: (e: Error) => {
            openToast('Erreur', e.message, { type: EToastType.ERROR });
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
                            color="text-success-600"
                            className="inline-block border-b-4 border-success-600 pb-2 text-lg font-bold uppercase tracking-wide sm:text-xl"
                        >
                            Contact Us
                        </Label>
                    </Div>

                    <Div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        <Div>
                            <Label variant={EVariantLabel.h5} color="text-gray-900" className="mb-6 block font-semibold">
                                Leave us a message
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
                                        onSubmit: ({ value }) => (!value?.trim() ? 'Le nom est requis' : undefined),
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-name"
                                            label="Name"
                                            placeholder="First_Name Last_Name"
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
                                            if (!v) return 'L’email est requis';
                                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email invalide';
                                            return undefined;
                                        },
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-email"
                                            label="Email Address"
                                            type="email"
                                            placeholder="Email Address"
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
                                            (value?.trim().length ?? 0) < 3 ? 'Message trop court' : undefined,
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="contact-message"
                                            label="Message"
                                            placeholder="Your Message"
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
                                            className="h-12 w-full rounded-lg bg-success-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {mutation.isPending || isSubmitting ? 'Envoi…' : 'Send'}
                                        </button>
                                    )}
                                </form.Subscribe>
                            </form>
                        </Div>

                        <Div>
                            <Div className="space-y-4 text-gray-700">
                                <Label variant={EVariantLabel.bodyLarge} color="text-gray-900" className="block font-bold">
                                    Nexera
                                </Label>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block leading-relaxed">
                                    Nexera Learning Center
                                    <br />
                                    Digital Campus — Training &amp; UX programs
                                    <br />
                                    Paris, France
                                </Label>
                                <a href="tel:+33100000000" className="block">
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-800"
                                        className="font-medium underline decoration-gray-300 underline-offset-4 hover:text-success-600"
                                    >
                                        +33 1 00 00 00 00
                                    </Label>
                                </a>
                                <a href="mailto:hello@nexera.com" className="block">
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-success-600"
                                        className="font-medium hover:underline"
                                    >
                                        hello@nexera.com
                                    </Label>
                                </a>
                            </Div>

                            <Div className="mt-8 flex items-center gap-5">
                                <SocialLink href="https://youtube.com" label="YouTube">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </SocialLink>
                                <SocialLink href="https://instagram.com" label="Instagram">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                                    </svg>
                                </SocialLink>
                                <SocialLink href="https://facebook.com" label="Facebook">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </SocialLink>
                                <SocialLink href="https://twitter.com" label="Twitter">
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </SocialLink>
                            </Div>

                            <Div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 ring-1 ring-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={MAP_IMG} alt="" className="h-48 w-full object-cover sm:h-56" />
                            </Div>
                        </Div>
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}
