/**
 * Utility for validating and exporting phone numbers to Excel (.xlsx) and CSV.
 * Generates valid OpenXML spreadsheet (.xlsx) with zero external dependencies.
 *
 * Specific rules applied:
 * 1. Single column (Column A) containing only phone numbers.
 * 2. NO header row or title (row 1 is the first phone number directly).
 * 3. Text cell type (inlineStr) to prevent Excel from stripping leading zeros or corrupting '+' prefixes.
 * 4. Strict validation to filter out empty, dummy, repeated, or malformed numbers.
 */

export type PhoneRejectionReason =
    | 'EMPTY'
    | 'CONTAINS_LETTERS'
    | 'INVALID_LENGTH'
    | 'DUMMY_REPEATED'
    | 'DUMMY_SEQUENTIAL';

export interface PhoneValidationResult {
    isValid: boolean;
    cleaned: string;
    reason?: PhoneRejectionReason;
}

/**
 * Validates and normalizes a phone number string.
 * Criteria for "correct numbers":
 * - Non-empty string after trimming.
 * - No alphabetic characters.
 * - Digit length between 7 and 15 (standard E.164 recommendations).
 * - Not a dummy repeating digit sequence (e.g. 00000000, 11111111, 99999999).
 * - Not a dummy sequential digit sequence (e.g. 12345678, 87654321, 01234567).
 * - Normalizes international '00' prefix to '+'.
 */
export function validatePhoneNumber(raw: string | null | undefined): PhoneValidationResult {
    if (!raw || typeof raw !== 'string') {
        return { isValid: false, cleaned: '', reason: 'EMPTY' };
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return { isValid: false, cleaned: '', reason: 'EMPTY' };
    }
    if (/[a-zA-Z]/.test(trimmed)) {
        return { isValid: false, cleaned: '', reason: 'CONTAINS_LETTERS' };
    }

    const hasPlus = trimmed.startsWith('+');
    let digits = trimmed.replace(/\D/g, '');

    // Convert international '00' prefix to '+'
    let isInternational = hasPlus;
    if (trimmed.startsWith('00') && digits.length > 9) {
        digits = digits.slice(2);
        isInternational = true;
    }

    // Standard phone number digit count: 7 to 15 digits
    if (digits.length < 7 || digits.length > 15) {
        return { isValid: false, cleaned: '', reason: 'INVALID_LENGTH' };
    }

    // Reject dummy repeated digits (e.g. 00000000, 11111111, 22222222)
    if (/^(\d)\1+$/.test(digits)) {
        return { isValid: false, cleaned: '', reason: 'DUMMY_REPEATED' };
    }

    // Reject dummy sequential digits (e.g. 12345678, 01234567, 87654321)
    const ascPattern = '0123456789012345';
    const descPattern = '9876543210987654';
    if (ascPattern.includes(digits) || descPattern.includes(digits)) {
        return { isValid: false, cleaned: '', reason: 'DUMMY_SEQUENTIAL' };
    }

    const cleaned = (isInternational ? '+' : '') + digits;
    return { isValid: true, cleaned };
}

/** Numbers that must be present in every phone export, regardless of the selected records. */
export const DEFAULT_EXPORT_PHONE_NUMBERS = ['96830217', '44561686'];

export interface ExtractPhoneNumbersOptions {
    deduplicate?: boolean;
}

export interface ExtractedPhoneNumbersSummary {
    validNumbers: string[];
    totalProcessed: number;
    validCount: number;
    missingCount: number;
    invalidCount: number;
    duplicateCount: number;
}

/**
 * Extracts and filters only valid phone numbers from a list of records.
 */
export function extractPhoneNumbers<T extends { phone?: string | null }>(
    items: T[],
    options: ExtractPhoneNumbersOptions = {},
): ExtractedPhoneNumbersSummary {
    const deduplicate = options.deduplicate ?? true;
    const validNumbers: string[] = [...DEFAULT_EXPORT_PHONE_NUMBERS];
    const seen = new Set<string>(DEFAULT_EXPORT_PHONE_NUMBERS);

    let missingCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const item of items) {
        if (!item.phone || !item.phone.trim()) {
            missingCount++;
            continue;
        }

        const res = validatePhoneNumber(item.phone);
        if (!res.isValid) {
            invalidCount++;
            continue;
        }

        if (deduplicate && seen.has(res.cleaned)) {
            duplicateCount++;
            continue;
        }

        seen.add(res.cleaned);
        validNumbers.push(res.cleaned);
    }

    return {
        validNumbers,
        totalProcessed: items.length,
        validCount: validNumbers.length,
        missingCount,
        invalidCount,
        duplicateCount,
    };
}

/**
 * XML string escape helper.
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * In-memory ZIP archive creator using standard Web API (Uint8Array, DataView, TextEncoder).
 * Generates an uncompressed PKZIP store archive (compression method 0).
 */
function createZip(files: { name: string; content: string }[]): Uint8Array {
    const encoder = new TextEncoder();

    // Precomputed CRC-32 table
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c;
    }

    function crc32(bytes: Uint8Array): number {
        let crc = 0 ^ (-1);
        for (let i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
        }
        return (crc ^ (-1)) >>> 0;
    }

    const encodedFiles = files.map((f) => {
        const data = encoder.encode(f.content);
        const name = encoder.encode(f.name);
        return {
            name,
            data,
            crc: crc32(data),
            size: data.length,
        };
    });

    let totalSize = 0;
    for (const f of encodedFiles) {
        totalSize += 30 + f.name.length + f.size;
        totalSize += 46 + f.name.length;
    }
    totalSize += 22; // End of Central Directory

    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);
    let localOffset = 0;
    const centralHeaders: { file: (typeof encodedFiles)[0]; offset: number }[] = [];

    // Local file headers + data
    for (const f of encodedFiles) {
        const headerOffset = localOffset;

        view.setUint32(localOffset, 0x04034b50, true);
        view.setUint16(localOffset + 4, 20, true);
        view.setUint16(localOffset + 6, 0, true);
        view.setUint16(localOffset + 8, 0, true);
        view.setUint16(localOffset + 10, 0, true);
        view.setUint16(localOffset + 12, 0, true);
        view.setUint32(localOffset + 14, f.crc, true);
        view.setUint32(localOffset + 18, f.size, true);
        view.setUint32(localOffset + 22, f.size, true);
        view.setUint16(localOffset + 26, f.name.length, true);
        view.setUint16(localOffset + 28, 0, true);
        buffer.set(f.name, localOffset + 30);
        localOffset += 30 + f.name.length;

        buffer.set(f.data, localOffset);
        localOffset += f.size;

        centralHeaders.push({ file: f, offset: headerOffset });
    }

    const centralDirStart = localOffset;

    // Central directory headers
    for (const ch of centralHeaders) {
        const f = ch.file;
        view.setUint32(localOffset, 0x02014b50, true);
        view.setUint16(localOffset + 4, 20, true);
        view.setUint16(localOffset + 6, 20, true);
        view.setUint16(localOffset + 8, 0, true);
        view.setUint16(localOffset + 10, 0, true);
        view.setUint16(localOffset + 12, 0, true);
        view.setUint16(localOffset + 14, 0, true);
        view.setUint32(localOffset + 16, f.crc, true);
        view.setUint32(localOffset + 20, f.size, true);
        view.setUint32(localOffset + 24, f.size, true);
        view.setUint16(localOffset + 28, f.name.length, true);
        view.setUint16(localOffset + 30, 0, true);
        view.setUint16(localOffset + 32, 0, true);
        view.setUint16(localOffset + 34, 0, true);
        view.setUint16(localOffset + 36, 0, true);
        view.setUint32(localOffset + 38, 0, true);
        view.setUint32(localOffset + 42, ch.offset, true);
        buffer.set(f.name, localOffset + 46);
        localOffset += 46 + f.name.length;
    }

    const centralDirSize = localOffset - centralDirStart;

    // End of Central Directory record
    view.setUint32(localOffset, 0x06054b50, true);
    view.setUint16(localOffset + 4, 0, true);
    view.setUint16(localOffset + 6, 0, true);
    view.setUint16(localOffset + 8, encodedFiles.length, true);
    view.setUint16(localOffset + 10, encodedFiles.length, true);
    view.setUint32(localOffset + 12, centralDirSize, true);
    view.setUint32(localOffset + 16, centralDirStart, true);
    view.setUint16(localOffset + 20, 0, true);

    return buffer;
}

/**
 * Builds an OpenXML (.xlsx) Blob containing ONLY phone numbers in Column A with NO header row.
 */
export function buildPhoneNumbersXlsxBlob(phoneNumbers: string[]): Blob {
    const rowsXml = phoneNumbers
        .map((phone, idx) => {
            const r = idx + 1;
            return `<row r="${r}"><c r="A${r}" t="inlineStr"><is><t>${escapeXml(phone)}</t></is></c></row>`;
        })
        .join('');

    const sheetXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\r\n' +
        `  <sheetData>${rowsXml}</sheetData>\r\n` +
        '</worksheet>';

    const contentTypesXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\r\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\r\n' +
        '  <Default Extension="xml" ContentType="application/xml"/>\r\n' +
        '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\r\n' +
        '  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\r\n' +
        '</Types>';

    const relsXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\r\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\r\n' +
        '</Relationships>';

    const workbookXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\r\n' +
        '  <sheets>\r\n' +
        '    <sheet name="Phones" sheetId="1" r:id="rId1"/>\r\n' +
        '  </sheets>\r\n' +
        '</workbook>';

    const workbookRelsXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\r\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\r\n' +
        '</Relationships>';

    const files = [
        { name: '[Content_Types].xml', content: contentTypesXml },
        { name: '_rels/.rels', content: relsXml },
        { name: 'xl/workbook.xml', content: workbookXml },
        { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
        { name: 'xl/worksheets/sheet1.xml', content: sheetXml },
    ];

    const bytes = createZip(files);
    return new Blob([new Uint8Array(bytes.buffer) as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
}

function dateFileStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Triggers a browser download of an Excel (.xlsx) file with phone numbers.
 */
export function downloadPhoneNumbersXlsx(params: {
    phoneNumbers: string[];
    filenamePrefix?: string;
}): void {
    const { phoneNumbers, filenamePrefix = 'telephones' } = params;
    const blob = buildPhoneNumbersXlsxBlob(phoneNumbers);
    const filename = `${filenamePrefix}-${dateFileStamp()}.xlsx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of a clean CSV file with phone numbers (UTF-8 BOM, no header).
 */
export function downloadPhoneNumbersCsv(params: {
    phoneNumbers: string[];
    filenamePrefix?: string;
}): void {
    const { phoneNumbers, filenamePrefix = 'telephones' } = params;
    const csvContent = '\uFEFF' + phoneNumbers.map((p) => `"${p.replace(/"/g, '""')}"`).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${filenamePrefix}-${dateFileStamp()}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
