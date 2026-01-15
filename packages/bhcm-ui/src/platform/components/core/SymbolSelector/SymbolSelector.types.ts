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
    selectedSymbol?: string;
    onSelect: (symbol: string) => void;
    className?: string;
}
