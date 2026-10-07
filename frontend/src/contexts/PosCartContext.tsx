'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { round3, toAmount, type PosClientRef, type PosProduct } from '@/lib/pos-api';

export interface PosCartLine {
    id: string;
    productId: string | null;
    saleOrderId?: string | null;
    subscriptionId?: string | null;
    creditId?: string | null;
    invoiceId?: string | null;
    creditRemainder?: boolean;
    name: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    discountPct: number;
}

interface PosCartState {
    lines: PosCartLine[];
    selectedLineId: string | null;
    client: PosClientRef | null;
    note: string;
}

interface PosCartContextValue extends PosCartState {
    total: number;
    itemsCount: number;
    addProduct: (product: PosProduct) => void;
    addDocumentLine: (line: {
        saleOrderId?: string;
        subscriptionId?: string;
        creditId?: string;
        invoiceId?: string;
        creditRemainder?: boolean;
        name: string;
        amount: number;
        client: PosClientRef;
    }) => void;
    selectLine: (id: string) => void;
    updateLine: (id: string, patch: Partial<Pick<PosCartLine, 'quantity' | 'discountPct' | 'unitPrice'>>) => void;
    removeLine: (id: string) => void;
    setClient: (client: PosClientRef | null) => void;
    setNote: (note: string) => void;
    clear: () => void;
}

const EMPTY_CART: PosCartState = { lines: [], selectedLineId: null, client: null, note: '' };

const PosCartContext = createContext<PosCartContextValue | null>(null);

export function cartLineTotal(line: Pick<PosCartLine, 'quantity' | 'unitPrice' | 'discountPct'>): number {
    return round3(line.quantity * line.unitPrice * (1 - line.discountPct / 100));
}

function storageKey(sessionId: string) {
    return `pos-cart-${sessionId}`;
}

function readStoredCart(sessionId: string): PosCartState {
    try {
        const raw = globalThis.localStorage?.getItem(storageKey(sessionId));
        if (!raw) return EMPTY_CART;
        const parsed = JSON.parse(raw) as Partial<PosCartState>;
        return {
            lines: Array.isArray(parsed.lines)
                ? parsed.lines.filter((l) => l.productId || l.saleOrderId || l.subscriptionId || l.creditId || l.invoiceId)
                : [],
            selectedLineId: parsed.selectedLineId ?? null,
            client: parsed.client ?? null,
            note: typeof parsed.note === 'string' ? parsed.note : '',
        };
    } catch {
        return EMPTY_CART;
    }
}

export function PosCartProvider({ sessionId, children }: Readonly<{ sessionId: string; children: ReactNode }>) {
    const [state, setState] = useState<PosCartState>(EMPTY_CART);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);

    useEffect(() => {
        setState(readStoredCart(sessionId));
        setLoadedFor(sessionId);
    }, [sessionId]);

    useEffect(() => {
        if (loadedFor !== sessionId) return;
        try {
            globalThis.localStorage?.setItem(storageKey(sessionId), JSON.stringify(state));
        } catch {
            // Storage full or unavailable: the cart still works in memory.
        }
    }, [loadedFor, sessionId, state]);

    const addProduct = useCallback((product: PosProduct) => {
        setState((prev) => {
            const price = toAmount(product.price);
            const existing = prev.lines.find(
                (l) => l.productId === product.id && l.unitPrice === price && l.discountPct === 0,
            );
            if (existing) {
                return {
                    ...prev,
                    selectedLineId: existing.id,
                    lines: prev.lines.map((l) =>
                        l.id === existing.id ? { ...l, quantity: round3(l.quantity + 1) } : l,
                    ),
                };
            }
            const line: PosCartLine = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                unitPrice: price,
                quantity: 1,
                discountPct: 0,
            };
            return { ...prev, lines: [...prev.lines, line], selectedLineId: line.id };
        });
    }, []);

    const addDocumentLine = useCallback<PosCartContextValue['addDocumentLine']>(
        ({ saleOrderId, subscriptionId, creditId, invoiceId, creditRemainder, name, amount, client }) => {
            setState((prev) => {
                const line: PosCartLine = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    productId: null,
                    saleOrderId: saleOrderId ?? null,
                    subscriptionId: subscriptionId ?? null,
                    creditId: creditId ?? null,
                    invoiceId: invoiceId ?? null,
                    creditRemainder,
                    name,
                    imageUrl: null,
                    unitPrice: round3(amount),
                    quantity: 1,
                    discountPct: 0,
                };
                const isSameDocument = (l: PosCartLine) =>
                    (!!saleOrderId && l.saleOrderId === saleOrderId) ||
                    (!!subscriptionId && l.subscriptionId === subscriptionId) ||
                    (!!creditId && l.creditId === creditId) ||
                    (!!invoiceId && l.invoiceId === invoiceId);
                return {
                    ...prev,
                    client,
                    lines: [...prev.lines.filter((l) => !isSameDocument(l)), line],
                    selectedLineId: line.id,
                };
            });
        },
        [],
    );

    const selectLine = useCallback((id: string) => {
        setState((prev) => ({ ...prev, selectedLineId: id }));
    }, []);

    const updateLine = useCallback<PosCartContextValue['updateLine']>((id, patch) => {
        setState((prev) => ({
            ...prev,
            lines: prev.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }));
    }, []);

    const removeLine = useCallback((id: string) => {
        setState((prev) => {
            const index = prev.lines.findIndex((l) => l.id === id);
            const lines = prev.lines.filter((l) => l.id !== id);
            const next = lines[Math.min(index, lines.length - 1)] ?? null;
            return { ...prev, lines, selectedLineId: next?.id ?? null };
        });
    }, []);

    const setClient = useCallback((client: PosClientRef | null) => {
        setState((prev) => ({ ...prev, client }));
    }, []);

    const setNote = useCallback((note: string) => {
        setState((prev) => ({ ...prev, note }));
    }, []);

    const clear = useCallback(() => setState(EMPTY_CART), []);

    const value = useMemo<PosCartContextValue>(() => {
        const total = round3(state.lines.reduce((sum, l) => sum + cartLineTotal(l), 0));
        const itemsCount = round3(state.lines.reduce((sum, l) => sum + l.quantity, 0));
        return {
            ...state,
            total,
            itemsCount,
            addProduct,
            addDocumentLine,
            selectLine,
            updateLine,
            removeLine,
            setClient,
            setNote,
            clear,
        };
    }, [state, addProduct, addDocumentLine, selectLine, updateLine, removeLine, setClient, setNote, clear]);

    return <PosCartContext.Provider value={value}>{children}</PosCartContext.Provider>;
}

export function usePosCart(): PosCartContextValue {
    const context = useContext(PosCartContext);
    if (!context) throw new Error('usePosCart must be used inside PosCartProvider');
    return context;
}
