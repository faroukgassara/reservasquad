'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

const STORAGE_KEY = 'conchas-cart-v2';

export type CartLineInput = {
    productId: string;
    slug: string;
    title: string;
    imageUrl: string;
    unitPrice: number;
    quantity?: number;
    materialKey?: string;
    sizeKey?: string;
    engraving?: string;
};

export type CartLine = {
    id: string;
    productId: string;
    slug: string;
    title: string;
    imageUrl: string;
    quantity: number;
    materialKey?: string;
    sizeKey?: string;
    engraving?: string;
    unitPrice: number;
};

type CartContextValue = {
    items: CartLine[];
    itemCount: number;
    subtotal: number;
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    addItem: (input: CartLineInput, options?: { openDrawer?: boolean }) => void;
    removeItem: (id: string) => void;
    setQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const ESTIMATED_SHIPPING_TND = 8;

function buildLineId(
    input: Pick<CartLineInput, 'productId' | 'materialKey' | 'sizeKey' | 'engraving'>,
) {
    return [
        input.productId,
        input.materialKey ?? '',
        input.sizeKey ?? '',
        (input.engraving ?? '').trim().toLowerCase(),
    ].join('|');
}

function readStoredItems(): CartLine[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CartLine[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.productId === 'string' &&
                typeof item.slug === 'string' &&
                typeof item.title === 'string' &&
                typeof item.quantity === 'number' &&
                typeof item.unitPrice === 'number',
        );
    } catch {
        return [];
    }
}

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [items, setItems] = useState<CartLine[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        setItems(readStoredItems());
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items, hydrated]);

    const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

    const addItem = useCallback((input: CartLineInput, options?: { openDrawer?: boolean }) => {
        if (!input.productId || !input.slug || !Number.isFinite(input.unitPrice)) return;

        const id = buildLineId(input);
        const quantity = Math.max(1, input.quantity ?? 1);

        setItems((prev) => {
            const existing = prev.some((line) => line.id === id);
            if (existing) {
                return prev.map((line) =>
                    line.id === id ? { ...line, quantity: line.quantity + quantity } : line,
                );
            }
            return [
                ...prev,
                {
                    id,
                    productId: input.productId,
                    slug: input.slug,
                    title: input.title,
                    imageUrl: input.imageUrl ?? '',
                    quantity,
                    materialKey: input.materialKey,
                    sizeKey: input.sizeKey,
                    engraving: input.engraving?.trim() || undefined,
                    unitPrice: input.unitPrice,
                },
            ];
        });

        if (options?.openDrawer !== false) {
            setIsDrawerOpen(true);
        }
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((line) => line.id !== id));
    }, []);

    const setQuantity = useCallback((id: string, quantity: number) => {
        const next = Math.max(1, quantity);
        setItems((prev) =>
            prev.map((line) => (line.id === id ? { ...line, quantity: next } : line)),
        );
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const itemCount = useMemo(
        () => items.reduce((sum, line) => sum + line.quantity, 0),
        [items],
    );

    const subtotal = useMemo(
        () => items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
        [items],
    );

    const value = useMemo(
        () => ({
            items,
            itemCount,
            subtotal,
            isDrawerOpen,
            openDrawer,
            closeDrawer,
            addItem,
            removeItem,
            setQuantity,
            clearCart,
        }),
        [
            items,
            itemCount,
            subtotal,
            isDrawerOpen,
            openDrawer,
            closeDrawer,
            addItem,
            removeItem,
            setQuantity,
            clearCart,
        ],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error('useCart must be used within CartProvider');
    }
    return ctx;
}
