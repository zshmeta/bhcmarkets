import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface SymbolSelectionContextValue {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string) => void;
}

const SymbolSelectionContext = createContext<SymbolSelectionContextValue | null>(null);

export interface SymbolSelectionProviderProps {
  children: ReactNode;
  initialSymbol?: string | null;
  onSymbolChange?: (symbol: string) => void;
}

export const SymbolSelectionProvider = ({
  children,
  initialSymbol = null,
  onSymbolChange,
}: SymbolSelectionProviderProps) => {
  const [selectedSymbol, setSelectedSymbolState] = useState<string | null>(initialSymbol);

  const value = useMemo<SymbolSelectionContextValue>(() => {
    return {
      selectedSymbol,
      setSelectedSymbol: (symbol: string) => {
        setSelectedSymbolState(symbol);
        onSymbolChange?.(symbol);
      },
    };
  }, [selectedSymbol, onSymbolChange]);

  return <SymbolSelectionContext.Provider value={value}>{children}</SymbolSelectionContext.Provider>;
};

export const useSymbolSelection = (): SymbolSelectionContextValue => {
  const ctx = useContext(SymbolSelectionContext);
  if (!ctx) {
    throw new Error('useSymbolSelection must be used within a SymbolSelectionProvider');
  }
  return ctx;
};

export const useOptionalSymbolSelection = (): SymbolSelectionContextValue | null => {
  return useContext(SymbolSelectionContext);
};
