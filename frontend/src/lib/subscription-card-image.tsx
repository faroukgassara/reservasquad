import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { createTranslator } from 'next-intl';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import {
    formatPosDate,
    formatSubscriptionNumber,
    personName,
    type SubscriptionCard,
    type SubscriptionCardState,
} from '@/lib/pos-api';
import fr from '../../locales/fr/common.json';
import en from '../../locales/en/common.json';

type CardLocale = 'fr' | 'en';

const WIDTH = 1080;
const HEIGHT = 1440;
const MESSAGES = { fr, en };

/** Hex equivalents of the theme tokens (`src/theme/colors.ts`): the image renderer does not support oklch. */
const COLOR = {
    white: '#FFFFFF',
    primary100: '#B3B7C9',
    primary500: '#253165',
    primary800: '#1E243B',
    gray25: '#F7F8FA',
    gray100: '#D8DADE',
    gray500: '#4A4F5C',
    gray900: '#21252E',
};

const STATE_COLOR: Record<SubscriptionCardState, { background: string; border: string; text: string }> = {
    VALID: { background: '#ECFDF3', border: '#A4F4C4', text: '#027847' },
    UPCOMING: { background: '#FFFAEB', border: '#FEDF8A', text: '#B54708' },
    EXPIRED: { background: '#FDEDED', border: '#F49EA0', text: '#C8161A' },
    CANCELLED: { background: '#FDEDED', border: '#F49EA0', text: '#C8161A' },
    DRAFT: { background: COLOR.gray25, border: COLOR.gray100, text: COLOR.gray500 },
};

const STATE_ICON: Record<SubscriptionCardState, string> = {
    VALID: 'M7 12.5l3.2 3.2L17 9',
    UPCOMING: 'M12 7v5l3 2',
    EXPIRED: 'M9 9l6 6M15 9l-6 6',
    CANCELLED: 'M9 9l6 6M15 9l-6 6',
    DRAFT: 'M12 11v6M12 7.5v.01',
};

const assetsDir = path.join(process.cwd(), 'src', 'assets');

let assetsPromise: Promise<{ regular: Buffer; semiBold: Buffer; logo: string }> | null = null;

function loadAssets() {
    assetsPromise ??= Promise.all([
        readFile(path.join(assetsDir, 'fonts', 'Poppins-Regular.woff')),
        readFile(path.join(assetsDir, 'fonts', 'Poppins-SemiBold.woff')),
        readFile(path.join(assetsDir, 'images', 'bibliosquad-logo-dark.png')),
    ]).then(([regular, semiBold, logo]) => ({
        regular,
        semiBold,
        logo: `data:image/png;base64,${logo.toString('base64')}`,
    }));
    return assetsPromise;
}

/** Card copy follows the phone language; French otherwise (no Arabic font is bundled for the image). */
export function cardLocale(acceptLanguage: string | null): CardLocale {
    const preferred = acceptLanguage?.split(',')[0]?.trim().toLowerCase() ?? '';
    return preferred.startsWith('en') ? 'en' : 'fr';
}

function StateIcon({ state }: Readonly<{ state: SubscriptionCardState }>) {
    const color = STATE_COLOR[state].text;
    return (
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d={STATE_ICON[state]} />
        </svg>
    );
}

/** Renders the member card as a phone-sized PNG (or a "card not found" image when `card` is null). */
export async function subscriptionCardImage(card: SubscriptionCard | null, locale: CardLocale): Promise<ImageResponse> {
    const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: 'subscriptionCard' });
    const tProducts = createTranslator({ locale, messages: MESSAGES[locale], namespace: 'pos.products' });
    const assets = await loadAssets();
    const fonts = [
        { name: 'Poppins', data: assets.regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Poppins', data: assets.semiBold, weight: 600 as const, style: 'normal' as const },
    ];
    const headers = { 'Cache-Control': 'no-store' };

    if (!card) {
        return new ImageResponse(
            (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 80, background: COLOR.gray25, fontFamily: 'Poppins', textAlign: 'center' }}>
                    <StateIcon state="EXPIRED" />
                    <div style={{ fontSize: 56, fontWeight: 600, color: COLOR.gray900 }}>{t('notFoundTitle')}</div>
                    <div style={{ fontSize: 34, color: COLOR.gray500 }}>{t('notFoundDescription')}</div>
                </div>
            ),
            { width: WIDTH, height: HEIGHT, fonts, headers, status: HttpStatus.NotFound },
        );
    }

    const number = formatSubscriptionNumber(card.number);
    const stateColor = STATE_COLOR[card.state];
    let stateDetail = '';
    if (card.state === 'UPCOMING') stateDetail = t('startsOn', { date: formatPosDate(card.startDate) });
    else if (card.state === 'EXPIRED') stateDetail = t('expiredOn', { date: formatPosDate(card.endDate) });
    const generatedAt = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Africa/Tunis',
    }).format(new Date());
    const duration = tProducts('durationValue', { count: card.duration, unit: tProducts(`unit${card.unit}`) });

    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40, padding: 72, background: COLOR.gray25, fontFamily: 'Poppins' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 56, padding: 64, borderRadius: 48, backgroundImage: `linear-gradient(135deg, ${COLOR.primary500}, ${COLOR.primary800})`, boxShadow: '0 24px 48px rgba(33, 37, 46, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                        <img src={assets.logo} width={271} height={64} />
                        <div style={{ fontSize: 34, fontWeight: 600, color: COLOR.gray25 }}>{number}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', color: COLOR.primary100 }}>{t('title')}</div>
                        <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1.1, color: COLOR.white }}>{personName(card.client)}</div>
                        <div style={{ fontSize: 34, color: COLOR.gray25 }}>{`${card.productName} · ${duration}`}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 48, paddingTop: 40, borderTop: '2px solid rgba(255, 255, 255, 0.15)' }}>
                        {[
                            { label: t('validFrom'), value: formatPosDate(card.startDate) },
                            { label: t('validUntil'), value: formatPosDate(card.endDate) },
                        ].map((item) => (
                            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                <div style={{ fontSize: 28, color: COLOR.primary100 }}>{item.label}</div>
                                <div style={{ fontSize: 44, fontWeight: 600, color: COLOR.white }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '36px 48px', borderRadius: 36, background: stateColor.background, border: `3px solid ${stateColor.border}` }}>
                    <StateIcon state={card.state} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 48, fontWeight: 600, color: stateColor.text }}>{t(`state${card.state}`)}</div>
                        {stateDetail ? <div style={{ fontSize: 34, color: COLOR.gray500 }}>{stateDetail}</div> : null}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 28, color: COLOR.gray500, textAlign: 'center' }}>
                    <div>{t('generatedAt', { date: generatedAt })}</div>
                    <div>{t('showAtReception')}</div>
                </div>
            </div>
        ),
        {
            width: WIDTH,
            height: HEIGHT,
            fonts,
            headers: { ...headers, 'Content-Disposition': `inline; filename="${t('fileName')}-${number}.png"` },
        },
    );
}
