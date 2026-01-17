export interface SymbolItem {
    id: string;
    symbol: string;
    description?: string;
}

export interface Category {
    id: string;
    label: string;
    items: SymbolItem[];
}

export interface SymbolSelectorProps {
    categories: Category[];
    /** Controlled selected symbol (optional if using watchlistStore) */
    selectedSymbol?: string;
    /** Controlled selection handler (optional if using watchlistStore) */
    onSelect?: (symbol: string) => void;
    className?: string;
}
