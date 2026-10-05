import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type IncomeLineType = 'CHARGE' | 'INVESTMENT' | 'ECOFACTURE' | 'FAROUK' | 'MAJDI';

export const INCOME_LINE_TYPES: IncomeLineType[] = [
    'CHARGE',
    'INVESTMENT',
    'ECOFACTURE',
    'FAROUK',
    'MAJDI',
];

export function isIncomeLineType(value: unknown): value is IncomeLineType {
    return INCOME_LINE_TYPES.includes(value as IncomeLineType);
}

export interface DailyIncomeRecord {
    id: string;
    date: string;
    totalIncome: number | string;
    savings: number | string;
    benefits: number | string;
    savingsForCharges: number | string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    charges?: number;
    investments?: number;
    chargesInvestment?: number;
}

export interface IncomeLineRecord {
    id: string;
    date: string;
    type: IncomeLineType;
    label: string;
    amount: number | string;
    createdAt: string;
    updatedAt: string;
}

export interface DailyIncomeMonthList {
    year: number;
    month: number;
    data: DailyIncomeRecord[];
}

export interface IncomeLinesMonthList {
    year: number;
    month: number;
    data: IncomeLineRecord[];
}

export interface DailyIncomeSummary {
    year: number;
    month: number;
    totalIncome: number;
    totalCharges: number;
    totalInvestments: number;
    totalSavings: number;
    totalBenefits: number;
    totalFarouk: number;
    totalMajdi: number;
    totalSavingsForCharges: number;
    netBalance: number;
    previousMonthRest: number;
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export function formatMoney(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function toDateInputValue(isoOrDate: string): string {
    if (!isoOrDate) return '';
    return isoOrDate.slice(0, 10);
}

export type DailyIncomeScope = 'month' | 'all';

export interface DailyIncomePeriod {
    year: number;
    month: number;
    scope?: DailyIncomeScope;
}

function periodSearchParams(params: DailyIncomePeriod): URLSearchParams {
    if (params.scope === 'all') return new URLSearchParams({ scope: 'all' });
    return new URLSearchParams({
        year: String(params.year),
        month: String(params.month),
    });
}

export async function fetchDailyIncomes(params: DailyIncomePeriod): Promise<DailyIncomeMonthList> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = periodSearchParams(params);
    const res = await api.get(`/api/daily-income?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch daily income');
    return unwrapData<DailyIncomeMonthList>(res.data as { data?: DailyIncomeMonthList });
}

export async function fetchDailyIncomeSummary(
    params: DailyIncomePeriod,
): Promise<DailyIncomeSummary> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = periodSearchParams(params);
    const res = await api.get(`/api/daily-income/summary?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch summary');
    return unwrapData<DailyIncomeSummary>(res.data as { data?: DailyIncomeSummary });
}

export async function fetchIncomeTrend(params: { months?: number }): Promise<DailyIncomeSummary[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.months) sp.set('months', String(params.months));
    const q = sp.toString();
    const path = q ? `/api/daily-income/trend?${q}` : '/api/daily-income/trend';
    const res = await api.get(path, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch income trend');
    return unwrapData<DailyIncomeSummary[]>(res.data as { data?: DailyIncomeSummary[] });
}

export async function setPreviousMonthRest(body: {
    year: number;
    month: number;
    amount: number;
}): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/daily-income/previous-month-rest', body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to save previous month rest');
}

export async function createDailyIncome(body: {
    date: string;
    totalIncome: number;
    notes?: string;
}): Promise<DailyIncomeRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/daily-income', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to create daily income');
    }
    return unwrapData<DailyIncomeRecord>(res.data as { data?: DailyIncomeRecord });
}

export async function updateDailyIncome(
    id: string,
    body: Partial<{ date: string; totalIncome: number; notes: string }>,
): Promise<DailyIncomeRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/daily-income/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update daily income');
    return unwrapData<DailyIncomeRecord>(res.data as { data?: DailyIncomeRecord });
}

export async function deleteDailyIncome(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/daily-income/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to delete daily income');
}

export async function fetchIncomeLines(
    params: DailyIncomePeriod & { type?: IncomeLineType },
): Promise<IncomeLinesMonthList> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = periodSearchParams(params);
    if (params.type) sp.set('type', params.type);
    const res = await api.get(`/api/daily-income/lines?${sp.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to fetch income lines');
    return unwrapData<IncomeLinesMonthList>(res.data as { data?: IncomeLinesMonthList });
}

export async function createIncomeLine(body: {
    date: string;
    type: IncomeLineType;
    label: string;
    amount: number;
}): Promise<IncomeLineRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/daily-income/lines', body, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to create income line');
    }
    return unwrapData<IncomeLineRecord>(res.data as { data?: IncomeLineRecord });
}

export async function updateIncomeLine(
    id: string,
    body: Partial<{ date: string; type: IncomeLineType; label: string; amount: number }>,
): Promise<IncomeLineRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/daily-income/lines/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to update income line');
    return unwrapData<IncomeLineRecord>(res.data as { data?: IncomeLineRecord });
}

export async function deleteIncomeLine(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/daily-income/lines/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw new Error('Failed to delete income line');
}
