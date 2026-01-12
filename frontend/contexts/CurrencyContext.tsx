'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyConfig {
  code: string;      // TND, EUR, USD, etc.
  symbol: string;    // د.ت, €, $, etc.
  name: string;      // Dinar Tunisien, Euro, Dollar, etc.
  position: 'before' | 'after';  // Symbol position
}

interface CurrencyContextType {
  currency: CurrencyConfig;
  formatPrice: (amount: number, showSymbol?: boolean) => string;
  formatPriceWithUnit: (amount: number, unit?: string) => string;
  isLoading: boolean;
  refreshCurrency: () => Promise<void>;
}

// Devise par défaut: TND
const defaultCurrency: CurrencyConfig = {
  code: 'TND',
  symbol: 'TND',
  name: 'Dinar Tunisien',
  position: 'after'
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyConfig>(defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrency = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/settings/currency`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrency({
            code: data.data.code || defaultCurrency.code,
            symbol: data.data.symbol || defaultCurrency.symbol,
            name: data.data.name || defaultCurrency.name,
            position: data.data.position || defaultCurrency.position
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
      // Keep default currency on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  const refreshCurrency = async () => {
    setIsLoading(true);
    await fetchCurrency();
  };

  const formatPrice = (amount: number, showSymbol: boolean = true): string => {
    const formattedAmount = amount.toLocaleString('fr-FR');
    if (!showSymbol) return formattedAmount;

    if (currency.position === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    }
    return `${formattedAmount}${currency.symbol}`;
  };

  const formatPriceWithUnit = (amount: number, unit?: string): string => {
    const priceStr = formatPrice(amount);
    if (unit) {
      return `${priceStr}/${unit}`;
    }
    return priceStr;
  };

  const value: CurrencyContextType = {
    currency,
    formatPrice,
    formatPriceWithUnit,
    isLoading,
    refreshCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
