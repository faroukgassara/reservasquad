import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { IEnv } from '../env/env';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as iconv from 'iconv-lite';
import { ESubAccess } from 'src/interface/seeder/modules.interface';
import { IJwtUserPayload } from 'src/interface/request/request.interface';

@Injectable()
export class CommonFunctionService {
    private readonly logger = new Logger();
    readonly config?: IEnv
    constructor(
        readonly configService: ConfigService,
        readonly prisma: PrismaService,
        readonly jwtService: JwtService,
    ) {
        this.config = this.configService.get<IEnv>('env');
    }

    public formatCode(code: string): string {
        return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
    }

    private parseExpiryToSeconds(expiry: string | number | undefined): number {
        if (!expiry) return 0;
        if (typeof expiry === 'number') return expiry;

        const trimmed = expiry.trim();
        if (/^\d+$/.test(trimmed)) return Number(trimmed);

        const match = trimmed.match(/^(\d+)([smhd])$/i);
        if (!match) return 0;

        const value = Number(match[1]);
        const unit = match[2].toLowerCase();
        const unitMultiplier: Record<string, number> = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        };

        return value * unitMultiplier[unit];
    }

    public generateToken(user, rememberMe: boolean = true) {
        if (!user.role) {
            throw new Error('Token generation requires user.role.');
        }

        const payload: IJwtUserPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            rememberMe,
            tokenVersion: user.tokenVersion ?? 0,
        };

        const accessExpiresIn = this.config.JWT_SECRET_EXPIRES_IN as any;
        const refreshExpiresIn = rememberMe
            ? this.config.JWT_REFRESH_SECRET_EXPIRES_IN as any
            : '1d';

        const access_token = this.jwtService.sign(payload, {
            secret: this.config.JWT_SECRET,
            expiresIn: accessExpiresIn,
        });
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.config.JWT_REFRESH_SECRET,
            expiresIn: refreshExpiresIn,
        });
        return {
            access_token,
            refresh_token,
            rememberMe,
            expires_in: this.parseExpiryToSeconds(accessExpiresIn),
            refresh_expires_in: this.parseExpiryToSeconds(refreshExpiresIn),
        };
    }

    public generateResetPasswordToken(user, jti?: string) {
        const payload = {
            sub: user.id,
            email: user.email,
            jti,
        };
        return this.jwtService.sign(payload, {
            secret: this.config.JWT_RESET_SECRET,
            expiresIn: this.config.JWT_RESET_SECRET_EXPIRES_IN as any,
        });
    }

    public hashResetPasswordToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    public verifyResetPasswordToken(token: string): { sub?: string; email?: string; exp?: number; jti?: string } | null {
        try {
            return this.jwtService.verify(token, {
                secret: this.config.JWT_RESET_SECRET,
            });
        } catch (_) {
            return null;
        }
    }

    public decodeFileNameTwice(fileName: string): string {
        const step1 = (iconv as any).decode(Buffer.from(fileName, 'binary'), 'utf8');
        const step2 = (iconv as any).decode(Buffer.from(step1, 'binary'), 'utf8');
        return step2;
    }

    // public async fetchAndUploadFiles(endpoint: string, id: string, typeFile: EFileType, type: EType, token: string) {
    //     const files = [];
    //     let counter = 1;
    //     try {
    //         const url = `${this.config.ERP_API_URL}/${endpoint}`;
    //         const response = await axios.get(url,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             }
    //         );
    //         if (!Array.isArray(response.data)) return files;
    //         for (const fileData of response.data) {
    //             const hexContent = fileData.hex || fileData.Img || fileData.FileDoss;
    //             const buffer = this.convertHexToBuffer(hexContent);
    //             if (!buffer) {
    //                 this.logger.warn(`Invalid hex content, skipping file.`);
    //                 continue;
    //             }
    //             const fileType = await fileTypeDetector.fromBuffer(buffer);
    //             if (!fileType) {
    //                 this.logger.warn(`Cannot detect file type, skipping file.`);
    //                 continue;
    //             }
    //             const ext = fileType.ext;
    //             const name = typeFile === EFileType.image ? `img${counter}.${ext}` : `doc${counter}.${ext}`;
    //             counter++;
    //             const key = type === EType.product
    //                 ? (typeFile === EFileType.document
    //                     ? formatProductDocumentKey(this.config.ENVIRONMENT, name, id)
    //                     : formatProductImageKey(this.config.ENVIRONMENT, name, id))
    //                 : (typeFile === EFileType.document
    //                     ? formatPromoDocumentKey(this.config.ENVIRONMENT, name, id)
    //                     : formatPromoImageKey(this.config.ENVIRONMENT, name, id));
    //             const uploadStatus = await this.awsS3Service.uploadFile(key, buffer);
    //             if (uploadStatus === 200 || uploadStatus === 201) {
    //                 const fileRecord: any = {
    //                     fileName: name,
    //                     fileSize: `${(buffer.length / 1024).toFixed(2)} Ko`,
    //                     fileFormat: ext,
    //                     fileRef: key,
    //                 };
    //                 files.push(fileRecord);
    //             } else {
    //                 this.logger.warn(`Failed to upload file ${name} to S3`);
    //             }
    //         }
    //     } catch (error) {
    //         this.logger.error(`Error fetching or uploading ERP file from ${endpoint}:`, error);
    //     }
    //     return files;
    // }

    public convertHexToBuffer(hex: string): Buffer | null {
        try {
            if (!hex) return null;
            const cleanedHex = hex.replaceAll(/[^A-Fa-f0-9]/g, '');
            if (cleanedHex.length % 2 !== 0) {
                this.logger.warn('Hex string has an odd length, skipping.');
                return null;
            }
            return Buffer.from(cleanedHex, 'hex');
        } catch (error) {
            this.logger.error('Error while converting hex to buffer:', error);
            return null;
        }
    }
    public static getSubAccessTraduction(key: string) {
        switch (key) {
            case ESubAccess.edit.toString():
                return "Écriture/Modifier"
            case ESubAccess.get.toString():
                return "Lecture"
            case ESubAccess.delete.toString():
                return "Suppression"
            case ESubAccess.inaccessible.toString():
                return "inaccessible"
            default:
                break;
        }
    }

    public parseSorts = (input: any): Array<any> => {
        if (!input) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                console.error(e)
                return [];
            }
        }
        if (Buffer.isBuffer(input)) {
            return JSON.parse(input.toString('utf8'));
        }
        return [];
    };
    public normalizeData(payload: any): { [key: string]: string } {
        const normalized: { [key: string]: string } = {};

        for (const key in payload) {
            if (payload[key] === null || payload[key] === undefined) continue;

            if (typeof payload[key] === 'object') {
                normalized[key] = JSON.stringify(payload[key]);
            } else {
                normalized[key] = String(payload[key]);
            }
        }

        return normalized;
    }

    public capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
  * Formats a UTC date into the Tunisia timezone (Africa/Tunis) 
  * and returns a string like: "Mercredi 04/12/2024 à 15h".
  *
  * @param utcDate - The delivery date in UTC
  * @returns The formatted delivery date string in French locale
  */
    public formatUtcDateToTunisiaString(utcDate: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            timeZone: "Africa/Tunis",
            hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("fr-FR", options);
        const parts = formatter.formatToParts(utcDate);

        const dayName = parts.find(p => p.type === "weekday")?.value;
        const day = parts.find(p => p.type === "day")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const year = parts.find(p => p.type === "year")?.value;
        const hour = parts.find(p => p.type === "hour")?.value;

        return `${this.capitalize(dayName!)} ${day}/${month}/${year} à ${hour}h`;
    }

    public stringToBoolean = (value: string | boolean | null | undefined): boolean => {
        if (typeof value === 'boolean') return value;
        if (!value || value === '') return true;
        return value.toLowerCase() === 'true';
    };
}
