'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getExchangeRatesFromDatabase } from '@/lib/services/toursService';

export type CurrencyCode = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
  rateFromJpy: number; // 1 JPY = X in target
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  JPY: { code: 'JPY', symbol: '¥', label: 'JPY (¥)', flag: '🇯🇵', rateFromJpy: 1, decimals: 0 },
  USD: { code: 'USD', symbol: '$', label: 'USD ($)', flag: '🇺🇸', rateFromJpy: 0.00655, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)', flag: '🇪🇺', rateFromJpy: 0.00612, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)', flag: '🇬🇧', rateFromJpy: 0.00515, decimals: 2 },
  AED: { code: 'AED', symbol: 'AED ', label: 'AED (AED)', flag: '🇦🇪', rateFromJpy: 0.02405, decimals: 2 },
  PKR: { code: 'PKR', symbol: 'PKR ', label: 'PKR (Rs)', flag: '🇵🇰', rateFromJpy: 1.82000, decimals: 0 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (priceInJpy: number) => string;
  getConvertedAmount: (priceInJpy: number) => number;
  config: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  // Load preferred currency from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('japan_voyage_currency') as CurrencyCode;
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch {
      // Local storage not available (SSR)
    }

    // Load live exchange rates from Supabase database
    async function loadLiveRates() {
      try {
        const rates = await getExchangeRatesFromDatabase();
        if (rates) {
          setLiveRates(rates);
        }
      } catch (err) {
        console.warn('Using baseline exchange rates');
      }
    }
    loadLiveRates();
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem('japan_voyage_currency', code);
    } catch {
      // Ignore in private browsing
    }
  };

  const baseConfig = CURRENCIES[currency];
  const effectiveRate = liveRates[currency] || baseConfig.rateFromJpy;
  const config = { ...baseConfig, rateFromJpy: effectiveRate };

  const getConvertedAmount = (priceInJpy: number): number => {
    return priceInJpy * config.rateFromJpy;
  };

  const formatPrice = (priceInJpy: number): string => {
    const converted = getConvertedAmount(priceInJpy);
    if (config.decimals === 0) {
      return `${config.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${config.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, getConvertedAmount, config }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
