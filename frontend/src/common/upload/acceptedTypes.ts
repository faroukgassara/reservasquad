
import type { FileType } from "@/interfaces/Molecules/IMoleculeFileUploadItem/IMoleculeFileUploadItem";

const FILE_SIGNATURES: { hex: string; mime: string }[] = [
  { hex: 'ffd8ffe0', mime: 'image/jpeg' },
  { hex: 'ffd8ffe1', mime: 'image/jpeg' },
  { hex: 'ffd8ffe2', mime: 'image/jpeg' },
  { hex: 'ffd8ffe3', mime: 'image/jpeg' },
  { hex: 'ffd8ffe8', mime: 'image/jpeg' },
  { hex: '89504e47', mime: 'image/png' },
  { hex: '47494638', mime: 'image/gif' },
  { hex: '52494646', mime: 'image/webp' },  
  { hex: '424d',     mime: 'image/bmp' },
  { hex: '00000100', mime: 'image/ico' },
  { hex: '49492a00', mime: 'image/tiff' },  
  { hex: '4d4d002a', mime: 'image/tiff' }, 
  { hex: '25504446', mime: 'application/pdf' }, 
  { hex: '000000186674797', mime: 'video/mp4' }, 
  { hex: '000000206674797', mime: 'video/mp4' },
  { hex: '1a45dfa3',        mime: 'video/webm' },
  { hex: '4f676753',        mime: 'video/ogg' },
  { hex: '000001ba',        mime: 'video/mpeg' },
  { hex: '504b0304', mime: 'application/zip' },
  { hex: 'd0cf11e0', mime: 'application/msword' },

];

const TEXT_BASED_TYPES = new Set([
  'text/plain',
  'text/csv',
  'text/html',
  'text/xml',
  'application/csv',
  'image/svg+xml',
]);

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: 'mime_rejected' | 'signature_mismatch' | 'unreadable' };

function readFileHeader(file: File, bytes = 4): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target!.result as ArrayBuffer).subarray(0, bytes);
      const header = Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      resolve(header);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}

function isReadableText(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(!text.includes('\u0000'));
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file.slice(0, 1024));
  });
}
export async function getMimeTypeFromFile(file: File): Promise<string> {
  const header = await readFileHeader(file, 4);
  const match = FILE_SIGNATURES.find((sig) => header.startsWith(sig.hex));

  if (!match) return 'unknown';
  return match.mime;
}

export async function isFileTypeAllowed(
  file: File,
  allowedMimes: string[]
): Promise<ValidationResult> {
  const detectedMime = await getMimeTypeFromFile(file);
  const reportedMime = file.type;

  if (detectedMime === 'unknown') {
    if (TEXT_BASED_TYPES.has(reportedMime)) {
      const readable = await isReadableText(file);
      return readable ? { valid: true } : { valid: false, reason: 'unreadable' };
    }
    return { valid: false, reason: 'signature_mismatch' };
  }

  const reportedCategory = reportedMime.split('/')[0];
  const detectedCategory = detectedMime.split('/')[0];

  if (reportedCategory !== detectedCategory) {
    return { valid: false, reason: 'signature_mismatch' };
  }

  const allowed = allowedMimes.some((rule) => {
    if (rule.endsWith('/*')) {
      return detectedMime.startsWith(rule.replace('/*', '/'));
    }
    return detectedMime === rule;
  });

  return allowed ? { valid: true } : { valid: false, reason: 'mime_rejected' };
}

export async function validateFileSignature(file: File): Promise<ValidationResult> {
  const allAllowedMimes = Object.values(ACCEPTED_TYPES).flat();
  return isFileTypeAllowed(file, allAllowedMimes);
}

export const ACCEPTED_TYPES: Record<FileType, string[]> = {
  image: ['image/*'],
  video: ['video/*'],
  pdf:   ['application/pdf'],
  file: [
    'text/*',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'application/csv',
  ],
};