import { round3 } from './pos-api';

export const NUMPAD_BACKSPACE = 'backspace';
export const NUMPAD_DECIMAL = '.';
export const NUMPAD_SIGN = '+/-';
export const NUMPAD_ADD_PREFIX = '+';

/**
 * Applies a numpad key to the edit buffer. `fresh` means the next digit replaces
 * the current value (Odoo behaviour right after selecting a line or a mode).
 */
export function applyNumpadKey(buffer: string, key: string, fresh: boolean): string {
    const current = fresh ? '' : buffer;

    if (/^\d$/.test(key)) {
        const next = current + key;
        return next.replace(/^(-?)0+(?=\d)/, '$1');
    }
    if (key === NUMPAD_DECIMAL) {
        if (current.includes('.')) return current;
        return current === '' || current === '-' ? `${current}0.` : `${current}.`;
    }
    if (key === NUMPAD_BACKSPACE) {
        return current.slice(0, -1);
    }
    if (key === NUMPAD_SIGN) {
        const base = buffer === '' ? '0' : buffer;
        return base.startsWith('-') ? base.slice(1) : `-${base}`;
    }
    if (key.startsWith(NUMPAD_ADD_PREFIX)) {
        const increment = Number(key.slice(1));
        const base = Number(buffer) || 0;
        return String(round3((fresh ? 0 : base) + increment));
    }
    return buffer;
}

export function parseNumpadBuffer(buffer: string): number {
    if (buffer === '' || buffer === '-' || buffer === '.') return 0;
    const value = Number(buffer);
    return Number.isFinite(value) ? value : 0;
}
