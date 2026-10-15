'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { searchNewsletterRecipients, type NewsletterSearchRecipientItem } from '@/lib/newsletter-api';
import Icon from '@/components/Primitives/Icon/Icon';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { IconComponentsEnum, ESize } from '@/Enum/Enum';

export interface SelectedRecipient {
    id: string;
    type: 'CLIENT' | 'PROFESSOR' | 'EMAIL';
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string | null;
}

interface NewsletterRecipientPickerProps {
    value: SelectedRecipient[];
    onChange: (recipients: SelectedRecipient[]) => void;
    disabled?: boolean;
    error?: boolean;
    hintText?: string;
}

export default function NewsletterRecipientPicker({
    value = [],
    onChange,
    disabled = false,
    error = false,
    hintText,
}: NewsletterRecipientPickerProps) {
    const t = useTranslations('pos.newsletters');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search term by 250ms
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 250);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Query candidates from backend
    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ['newsletter-search-recipients', debouncedSearch],
        queryFn: () => searchNewsletterRecipients(debouncedSearch),
        enabled: isOpen && !disabled,
        staleTime: 1000 * 30,
    });

    // Handle outside clicks to close dropdown
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Set of selected emails for quick lookup
    const selectedEmailSet = useMemo(() => {
        return new Set(value.map((r) => r.email.trim().toLowerCase()));
    }, [value]);

    // Check if the current search term looks like a valid email
    const trimmedInput = searchTerm.trim().toLowerCase();
    const isValidEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput);
    const isEmailAlreadySelected = selectedEmailSet.has(trimmedInput);

    const handleSelectCandidate = (item: NewsletterSearchRecipientItem) => {
        if (selectedEmailSet.has(item.email.trim().toLowerCase())) return;
        const newRecipient: SelectedRecipient = {
            id: item.id,
            type: item.type,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email.trim(),
            phone: item.phone,
        };
        onChange([...value, newRecipient]);
        setSearchTerm('');
    };

    const handleAddCustomEmail = (email: string) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || selectedEmailSet.has(normalized)) return;
        const newRecipient: SelectedRecipient = {
            id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: 'EMAIL',
            email: normalized,
        };
        onChange([...value, newRecipient]);
        setSearchTerm('');
    };

    const handleRemove = (recipientId: string) => {
        if (disabled) return;
        onChange(value.filter((r) => r.id !== recipientId));
    };

    const handleClearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    return (
        <div ref={containerRef} className="space-y-3">
            {/* Search and Picker Input */}
            <div className="relative">
                <div
                    className={twMerge(
                        'relative flex items-center rounded-xl border bg-white transition-all',
                        error
                            ? 'border-danger-300 ring-2 ring-danger-100'
                            : isOpen
                              ? 'border-primary-500 ring-2 ring-primary-100'
                              : 'border-gray-200 hover:border-gray-300',
                        disabled && 'bg-gray-50 opacity-60 cursor-not-allowed',
                    )}
                >
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                        <Icon name={IconComponentsEnum.search} size={ESize.sm} color="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        disabled={disabled}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (isValidEmailInput && !isEmailAlreadySelected) {
                                    handleAddCustomEmail(trimmedInput);
                                }
                            } else if (e.key === 'Escape') {
                                setIsOpen(false);
                            }
                        }}
                        placeholder={t('specificRecipientsSearchPlaceholder')}
                        className="w-full bg-transparent py-2.5 ps-9 pe-10 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden"
                    />
                    {isLoading && (
                        <div className="absolute inset-y-0 end-3 flex items-center">
                            <Spinner size={ESize.sm} color="text-primary-500" />
                        </div>
                    )}
                </div>

                {/* Dropdown Results */}
                {isOpen && !disabled && (
                    <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100">
                        {/* Custom email option if typed input is a valid email */}
                        {isValidEmailInput && !isEmailAlreadySelected && (
                            <button
                                type="button"
                                onClick={() => handleAddCustomEmail(trimmedInput)}
                                className="flex w-full items-center gap-2.5 border-b border-gray-100 bg-primary-50/50 px-3 py-2 text-start text-xs font-medium text-primary-900 transition-colors hover:bg-primary-100/60 cursor-pointer"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600 text-white">
                                    <Icon name={IconComponentsEnum.plus} size={ESize.xs} color="text-white" />
                                </span>
                                <div className="truncate">
                                    <span className="text-gray-600">{t('specificRecipientsAddCustom')} </span>
                                    <span className="font-bold text-primary-700">{trimmedInput}</span>
                                </div>
                            </button>
                        )}

                        {/* Candidates list */}
                        {candidates.length > 0 ? (
                            candidates.map((candidate) => {
                                const isSelected = selectedEmailSet.has(candidate.email.trim().toLowerCase());
                                return (
                                    <button
                                        key={`${candidate.type}-${candidate.id}`}
                                        type="button"
                                        disabled={isSelected}
                                        onClick={() => handleSelectCandidate(candidate)}
                                        className={twMerge(
                                            'flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-xs transition-colors',
                                            isSelected
                                                ? 'bg-gray-50/70 text-gray-400 cursor-not-allowed'
                                                : 'hover:bg-primary-50/50 cursor-pointer text-gray-700',
                                        )}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span
                                                className={twMerge(
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase',
                                                    candidate.type === 'PROFESSOR'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-primary-100 text-primary-700',
                                                )}
                                            >
                                                <Icon
                                                    name={IconComponentsEnum.user}
                                                    size={ESize.xs}
                                                    color={candidate.type === 'PROFESSOR' ? 'text-accent-700' : 'text-primary-700'}
                                                />
                                            </span>
                                            <div className="min-w-0 truncate">
                                                <div className="flex items-center gap-1.5 font-medium text-gray-900 truncate">
                                                    <span>{candidate.firstName} {candidate.lastName}</span>
                                                    <span
                                                        className={twMerge(
                                                            'rounded-md px-1.5 py-0.2 text-[10px] font-semibold tracking-wider uppercase',
                                                            candidate.type === 'PROFESSOR'
                                                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                : 'bg-primary-50 text-primary-700 border border-primary-200',
                                                        )}
                                                    >
                                                        {candidate.type === 'PROFESSOR'
                                                            ? t('specificRecipientsBadgeProfessor')
                                                            : t('specificRecipientsBadgeClient')}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 truncate">
                                                    {candidate.email}
                                                    {candidate.phone ? ` · ${candidate.phone}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <span className="shrink-0 text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                                <Icon name={IconComponentsEnum.check} size={ESize.xs} color="text-gray-400" />
                                            </span>
                                        ) : (
                                            <span className="shrink-0 text-primary-600">
                                                <Icon name={IconComponentsEnum.plus} size={ESize.xs} color="text-primary-600" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        ) : !isLoading && !isValidEmailInput ? (
                            <div className="px-3 py-4 text-center text-xs text-gray-500">
                                {searchTerm.trim()
                                    ? t('picker.noResults')
                                    : t('picker.typeToSearch')}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Hint / Validation Error Message */}
            {hintText && (
                <p className={twMerge('text-[11px]', error ? 'text-danger-600' : 'text-gray-500')}>
                    {hintText}
                </p>
            )}

            {/* Selected Recipients Container */}
            <div className="rounded-xl border border-gray-150 bg-gray-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700">
                            {t('specificRecipientsLabel')}
                        </span>
                        <span className="inline-flex h-5 items-center justify-center rounded-full bg-primary-100 px-2 text-[11px] font-bold text-primary-700">
                            {value.length}
                        </span>
                    </div>
                    {value.length > 0 && !disabled && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-[11px] font-medium text-gray-500 hover:text-danger-600 transition-colors cursor-pointer"
                        >
                            {t('picker.clearAll')}
                        </button>
                    )}
                </div>

                {value.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white/60 p-3 text-center text-xs text-gray-400">
                        {t('specificRecipientsEmpty')}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-1">
                        {value.map((recipient) => (
                            <div
                                key={recipient.id}
                                className={twMerge(
                                    'inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-xs shadow-2xs transition-all',
                                    recipient.type === 'PROFESSOR'
                                        ? 'border-purple-200 hover:border-purple-300'
                                        : recipient.type === 'EMAIL'
                                          ? 'border-emerald-200 hover:border-emerald-300'
                                          : 'border-primary-200 hover:border-primary-300',
                                )}
                            >
                                <span
                                    className={twMerge(
                                        'rounded-md px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                                        recipient.type === 'PROFESSOR'
                                            ? 'bg-purple-50 text-purple-700'
                                            : recipient.type === 'EMAIL'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-primary-50 text-primary-700',
                                    )}
                                >
                                    {recipient.type === 'PROFESSOR'
                                        ? t('specificRecipientsBadgeProfessor')
                                        : recipient.type === 'EMAIL'
                                          ? t('specificRecipientsBadgeEmail')
                                          : t('specificRecipientsBadgeClient')}
                                </span>

                                <span className="font-medium text-gray-800">
                                    {recipient.firstName || recipient.lastName
                                        ? `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim()
                                        : recipient.email}
                                </span>

                                {(recipient.firstName || recipient.lastName) && (
                                    <span className="text-[11px] text-gray-400">
                                        ({recipient.email})
                                    </span>
                                )}

                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(recipient.id)}
                                        aria-label="Remove recipient"
                                        className="ms-1 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-danger-600 transition-colors cursor-pointer"
                                    >
                                        <Icon name={IconComponentsEnum.close} size={ESize.xs} color="text-gray-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
