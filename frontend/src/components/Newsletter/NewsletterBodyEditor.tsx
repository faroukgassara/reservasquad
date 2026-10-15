'use client';

import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from 'next-intl';
import { useToast } from '@/contexts/ToastContext';
import { ESize, EToastType } from '@/Enum/Enum';
import { uploadNewsletterMedia } from '@/lib/newsletter-api';
import Spinner from '@/components/Primitives/Spinner/Spinner';

interface NewsletterBodyEditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    hintText?: string;
    readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeToHtml(content: string): string {
    if (!content) return '';
    const isHtml = /<(?:p|div|h[1-6]|ul|ol|li|img|a|strong|b|em|i|u|s|table|thead|tbody|tr|th|td|blockquote|br|hr|span)[^>]*>/i.test(content);
    if (isHtml) return content;
    // Legacy plain text -> wrap into HTML paragraphs
    return content
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
        .join('');
}

export default function NewsletterBodyEditor({
    value,
    onChange,
    error,
    hintText,
    readOnly = false,
}: NewsletterBodyEditorProps) {
    const t = useTranslations('pos.newsletters.editor');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const [mode, setMode] = useState<'visual' | 'code'>('visual');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showImageUrlModal, setShowImageUrlModal] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');

    const visualEditorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastHtmlRef = useRef<string>(value);

    // Keep visual editor in sync with external value changes
    useEffect(() => {
        if (mode === 'visual' && visualEditorRef.current) {
            const htmlValue = normalizeToHtml(value);
            if (visualEditorRef.current.innerHTML !== htmlValue) {
                visualEditorRef.current.innerHTML = htmlValue;
                lastHtmlRef.current = htmlValue;
            }
        }
    }, [value, mode]);

    const handleVisualInput = () => {
        if (!visualEditorRef.current) return;
        const html = visualEditorRef.current.innerHTML;
        lastHtmlRef.current = html;
        onChange(html);
    };

    const execCmd = (command: string, arg?: string) => {
        if (readOnly) return;
        if (mode === 'visual' && visualEditorRef.current) {
            visualEditorRef.current.focus();
            document.execCommand(command, false, arg);
            handleVisualInput();
        }
    };

    const insertHtmlAtCursor = (html: string) => {
        if (readOnly) return;
        if (mode === 'visual' && visualEditorRef.current) {
            visualEditorRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const frag = document.createDocumentFragment();
                let node: ChildNode | null;
                let lastNode: ChildNode | null = null;
                while ((node = tempDiv.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);
                if (lastNode) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            } else {
                visualEditorRef.current.innerHTML += html;
            }
            handleVisualInput();
        } else {
            // In code mode, append or insert at cursor
            onChange((value || '') + '\n' + html);
        }
    };

    // Upload image directly from user computer
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so same file can be selected again
        e.target.value = '';

        if (!file.type.startsWith('image/')) {
            openToast(t('invalidFormat'), t('selectImageFormat'), {
                type: EToastType.ERROR,
            });
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            openToast(t('fileTooLarge'), t('imageMax25Mo'), {
                type: EToastType.ERROR,
            });
            return;
        }

        try {
            setIsUploadingImage(true);
            const result = await uploadNewsletterMedia(file);
            const imgHtml = `<p style="margin:16px 0;text-align:center;"><img src="${result.url}" alt="${result.filename}" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.06);" /></p><p></p>`;
            insertHtmlAtCursor(imgHtml);
            openToast(t('imageInserted'), t('imageInsertedDesc', { filename: result.filename }), {
                type: EToastType.SUCCESS,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('uploadImageError');
            openToast(t('uploadFailed'), message, { type: EToastType.ERROR });
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Upload file / document directly from user computer
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        if (file.size > 25 * 1024 * 1024) {
            openToast(t('fileTooLarge'), t('fileMax25Mo'), {
                type: EToastType.ERROR,
            });
            return;
        }

        try {
            setIsUploadingFile(true);
            const result = await uploadNewsletterMedia(file);
            const sizeStr = formatFileSize(result.size);
            const downloadText = `${t('downloadFileLabel')} ${result.filename} (${sizeStr})`;
            const fileCardHtml = `<p style="margin:16px 0;"><a href="${result.url}" target="_blank" download class="file-attachment-card" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;background-color:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;color:#253165;font-weight:700;text-decoration:none;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">${downloadText}</a></p><p></p>`;
            insertHtmlAtCursor(fileCardHtml);
            openToast(t('fileInserted'), t('fileInsertedDesc', { filename: result.filename }), {
                type: EToastType.SUCCESS,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('uploadFileError');
            openToast(t('uploadFailed'), message, { type: EToastType.ERROR });
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleInsertLink = () => {
        if (!linkUrl.trim()) return;
        const text = linkText.trim() || linkUrl.trim();
        const safeUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
        const linkHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#253165;text-decoration:underline;font-weight:600;">${text}</a>`;
        insertHtmlAtCursor(linkHtml);
        setLinkUrl('');
        setLinkText('');
        setShowLinkModal(false);
    };

    const handleInsertImageUrl = () => {
        if (!imageUrl.trim()) return;
        const safeUrl = imageUrl.trim().startsWith('http') ? imageUrl.trim() : `https://${imageUrl.trim()}`;
        const alt = imageAlt.trim() || t('btnImage');
        const imgHtml = `<p style="margin:16px 0;text-align:center;"><img src="${safeUrl}" alt="${alt}" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;" /></p><p></p>`;
        insertHtmlAtCursor(imgHtml);
        setImageUrl('');
        setImageAlt('');
        setShowImageUrlModal(false);
    };

    const handleInsertCallout = () => {
        const calloutHtml = `<div style="background-color:#EEF2FF;border-left:4px solid #253165;padding:14px 18px;border-radius:8px;margin:18px 0;color:#1E293B;"><strong style="color:#253165;">${t('calloutNoteLabel')}</strong> ${t('calloutPlaceholder')}</div><p></p>`;
        insertHtmlAtCursor(calloutHtml);
    };

    const handleInsertDivider = () => {
        const dividerHtml = `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" /><p></p>`;
        insertHtmlAtCursor(dividerHtml);
    };

    const handleInsertTable = () => {
        const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead style="background:#F8FAFC;"><tr><th style="border:1px solid #E5E7EB;padding:10px 14px;text-align:left;color:#253165;font-weight:700;">${t('tableCol1')}</th><th style="border:1px solid #E5E7EB;padding:10px 14px;text-align:left;color:#253165;font-weight:700;">${t('tableCol2')}</th></tr></thead><tbody><tr><td style="border:1px solid #E5E7EB;padding:10px 14px;">${t('tableInfo1')}</td><td style="border:1px solid #E5E7EB;padding:10px 14px;">${t('tableDetail1')}</td></tr><tr><td style="border:1px solid #E5E7EB;padding:10px 14px;">${t('tableInfo2')}</td><td style="border:1px solid #E5E7EB;padding:10px 14px;">${t('tableDetail2')}</td></tr></tbody></table><p></p>`;
        insertHtmlAtCursor(tableHtml);
    };

    const handleModeToggle = (targetMode: 'visual' | 'code') => {
        if (targetMode === mode) return;
        if (targetMode === 'code') {
            // Sync from visual to code
            if (visualEditorRef.current) {
                const currentHtml = visualEditorRef.current.innerHTML;
                onChange(currentHtml);
            }
        } else {
            // Sync from code to visual
            const htmlValue = normalizeToHtml(value);
            onChange(htmlValue);
            setTimeout(() => {
                if (visualEditorRef.current) {
                    visualEditorRef.current.innerHTML = htmlValue;
                }
            }, 0);
        }
        setMode(targetMode);
    };

    return (
        <div className="space-y-2">
            {/* Hidden file inputs for image and document uploads */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Editor Container with Border */}
            <div
                className={twMerge(
                    'overflow-hidden rounded-2xl border transition-all bg-white shadow-2xs',
                    error ? 'border-danger-500 ring-2 ring-danger-100' : 'border-gray-200 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100',
                )}
            >
                {/* Editor Header: Toolbar & Mode Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2">
                    {/* Formatting Tools (Active in Visual Mode) */}
                    <div className="flex flex-wrap items-center gap-1">
                        {/* Text formatting */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
                            <button
                                type="button"
                                title={t('bold')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('bold')}
                                className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                title={t('italic')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('italic')}
                                className="flex h-8 w-8 items-center justify-center rounded text-sm italic font-serif text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                title={t('underline')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('underline')}
                                className="flex h-8 w-8 items-center justify-center rounded text-sm underline text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                U
                            </button>
                            <button
                                type="button"
                                title={t('strikethrough')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('strikeThrough')}
                                className="flex h-8 w-8 items-center justify-center rounded text-sm line-through text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                S
                            </button>
                        </div>

                        {/* Headings */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
                            <button
                                type="button"
                                title={t('heading1')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('formatBlock', '<h1>')}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                title={t('heading2')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('formatBlock', '<h2>')}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                title={t('paragraph')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('formatBlock', '<p>')}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                ¶
                            </button>
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
                            <button
                                type="button"
                                title={t('unorderedList')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('insertUnorderedList')}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                {t('btnBulletList')}
                            </button>
                            <button
                                type="button"
                                title={t('orderedList')}
                                disabled={readOnly || mode === 'code'}
                                onClick={() => execCmd('insertOrderedList')}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                {t('btnNumberList')}
                            </button>
                        </div>

                        {/* Multimedia & Insertions */}
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
                            {/* Insert Image Button */}
                            <button
                                type="button"
                                title={t('uploadImageTooltip')}
                                disabled={readOnly || isUploadingImage}
                                onClick={() => imageInputRef.current?.click()}
                                className="flex h-8 items-center gap-1.5 rounded px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40 cursor-pointer"
                            >
                                {isUploadingImage ? (
                                    <Spinner size={ESize.sm} color="text-primary-600" />
                                ) : (
                                    <span>🖼️</span>
                                )}
                                <span>{t('btnImage')}</span>
                            </button>

                            {/* Insert Image from URL */}
                            <button
                                type="button"
                                title={t('imageUrlTooltip')}
                                disabled={readOnly}
                                onClick={() => setShowImageUrlModal(true)}
                                className="flex h-8 px-1.5 items-center justify-center rounded text-[11px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                            >
                                URL
                            </button>

                            <div className="h-4 w-px bg-gray-200" />

                            {/* Insert Document / File Button */}
                            <button
                                type="button"
                                title={t('uploadFileTooltip')}
                                disabled={readOnly || isUploadingFile}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-8 items-center gap-1.5 rounded px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40 cursor-pointer"
                            >
                                {isUploadingFile ? (
                                    <Spinner size={ESize.sm} color="text-primary-600" />
                                ) : (
                                    <span>📎</span>
                                )}
                                <span>{t('btnFile')}</span>
                            </button>

                            <div className="h-4 w-px bg-gray-200" />

                            {/* Insert Link Button */}
                            <button
                                type="button"
                                title={t('insertLinkTooltip')}
                                disabled={readOnly}
                                onClick={() => setShowLinkModal(true)}
                                className="flex h-8 items-center gap-1 rounded px-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                <span>🔗</span>
                                <span>{t('btnLink')}</span>
                            </button>
                        </div>

                        {/* Extra Blocks */}
                        <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
                            <button
                                type="button"
                                title={t('calloutTooltip')}
                                disabled={readOnly}
                                onClick={handleInsertCallout}
                                className="flex h-8 items-center gap-1 rounded px-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                <span>💡</span>
                                <span>{t('btnCallout')}</span>
                            </button>
                            <button
                                type="button"
                                title={t('tableTooltip')}
                                disabled={readOnly}
                                onClick={handleInsertTable}
                                className="flex h-8 items-center gap-1 rounded px-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                <span>📊</span>
                                <span>{t('btnTable')}</span>
                            </button>
                            <button
                                type="button"
                                title={t('dividerTooltip')}
                                disabled={readOnly}
                                onClick={handleInsertDivider}
                                className="flex h-8 px-2 items-center justify-center rounded text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                            >
                                ―
                            </button>
                        </div>
                    </div>

                    {/* Mode Toggle: Visual vs HTML Code */}
                    <div className="flex items-center rounded-xl bg-gray-200/80 p-0.5 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => handleModeToggle('visual')}
                            className={twMerge(
                                'flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer',
                                mode === 'visual'
                                    ? 'bg-white text-primary-900 shadow-2xs'
                                    : 'text-gray-600 hover:text-gray-900',
                            )}
                        >
                            <span>✏️ {t('modeVisual')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeToggle('code')}
                            className={twMerge(
                                'flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer',
                                mode === 'code'
                                    ? 'bg-white text-primary-900 shadow-2xs font-mono'
                                    : 'text-gray-600 hover:text-gray-900',
                            )}
                        >
                            <span>&lt;/&gt; {t('modeCode')}</span>
                        </button>
                    </div>
                </div>

                {/* Editor Content Area */}
                {mode === 'visual' ? (
                    <div
                        ref={visualEditorRef}
                        contentEditable={!readOnly}
                        onInput={handleVisualInput}
                        onBlur={handleVisualInput}
                        data-placeholder={t('visualPlaceholder')}
                        className={twMerge(
                            'min-h-[280px] max-h-[580px] overflow-y-auto p-4 text-sm leading-relaxed text-gray-800 outline-none',
                            'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none',
                            '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-primary-950 [&_h1]:my-3',
                            '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary-900 [&_h2]:my-2.5',
                            '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-primary-800 [&_h3]:my-2',
                            '[&_p]:my-2 [&_p]:leading-relaxed',
                            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
                            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
                            '[&_li]:my-1',
                            '[&_a]:text-primary-600 [&_a]:underline [&_a]:font-semibold',
                            '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_img]:shadow-xs',
                            '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3',
                            '[&_th]:border [&_th]:border-gray-200 [&_th]:p-2.5 [&_th]:text-left [&_th]:bg-gray-50',
                            '[&_td]:border [&_td]:border-gray-200 [&_td]:p-2.5 [&_td]:text-left',
                            readOnly && 'bg-gray-50 cursor-not-allowed opacity-80',
                        )}
                    />
                ) : (
                    <div className="relative">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            readOnly={readOnly}
                            rows={14}
                            placeholder={t('codePlaceholder')}
                            className="w-full resize-y bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:ring-0"
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Editor Footer: Character counter & helpers */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        {isUploadingImage || isUploadingFile ? (
                            <div className="flex items-center gap-1.5 text-primary-600 font-medium">
                                <Spinner size={ESize.sm} color="text-primary-600" />
                                <span>{t('uploading')}</span>
                            </div>
                        ) : (
                            <span>
                                {mode === 'visual'
                                    ? t('visualModeActive')
                                    : t('codeModeActive')}
                            </span>
                        )}
                    </div>
                    <div className="font-mono text-gray-400">
                        {value ? value.length.toLocaleString() : 0} / 500 000 {t('characters')}
                    </div>
                </div>
            </div>

            {/* Error or Hint message */}
            {error && hintText ? (
                <p className="text-xs font-semibold text-danger-600">{hintText}</p>
            ) : (
                <p className="text-xs text-gray-500">
                    {t('helpHint')}
                </p>
            )}

            {/* Link insertion mini modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                        <h3 className="mb-3 text-base font-bold text-gray-900">{t('linkModalTitle')}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {t('linkTextLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder={t('linkTextPlaceholder')}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {t('linkUrlLabel')}
                                </label>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowLinkModal(false)}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                {tCommon('cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={!linkUrl.trim()}
                                onClick={handleInsertLink}
                                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-40 cursor-pointer"
                            >
                                {t('insertLinkBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image URL insertion mini modal */}
            {showImageUrlModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                        <h3 className="mb-3 text-base font-bold text-gray-900">{t('imageUrlModalTitle')}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {t('imageUrlLabel')}
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder={t('imageUrlPlaceholder')}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {t('imageAltLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={imageAlt}
                                    onChange={(e) => setImageAlt(e.target.value)}
                                    placeholder={t('imageAltPlaceholder')}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowImageUrlModal(false)}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                {tCommon('cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={!imageUrl.trim()}
                                onClick={handleInsertImageUrl}
                                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-40 cursor-pointer"
                            >
                                {t('insertImageBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
