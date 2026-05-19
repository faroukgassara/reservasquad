import { enUS, fr } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function dateFnsLocale(locale: string): Locale {
    return locale.startsWith('fr') ? fr : enUS;
}
