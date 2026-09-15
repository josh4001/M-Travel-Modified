import React, { createContext, useContext, useState } from 'react';

export type CurrencyCode = 'KES' | 'USD' | 'EUR' | 'GBP';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
  rateToKES: number; // 1 CurrencyUnit = X KES
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  KES: { code: 'KES', symbol: 'KES ', label: 'Kenyan Shilling (KES)', flag: '🇰🇪', rateToKES: 1 },
  USD: { code: 'USD', symbol: '$',    label: 'US Dollar (USD)',        flag: '🇺🇸', rateToKES: 130 },
  EUR: { code: 'EUR', symbol: '€',    label: 'Euro (EUR)',             flag: '🇪🇺', rateToKES: 142 },
  GBP: { code: 'GBP', symbol: '£',    label: 'British Pound (GBP)',    flag: '🇬🇧', rateToKES: 166 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInKES: number | string, options?: { showCode?: boolean; decimals?: number }) => string;
  convertFromKES: (amountInKES: number | string) => number;
  currentInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('mt_currency');
    return (saved && CURRENCIES[saved as CurrencyCode]) ? (saved as CurrencyCode) : 'KES';
  });

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('mt_currency', code);
  };

  const convertFromKES = (amountInKES: number | string): number => {
    const num = typeof amountInKES === 'number' ? amountInKES : parseFloat(String(amountInKES)) || 0;
    const rate = CURRENCIES[currency].rateToKES;
    return num / rate;
  };

  const formatPrice = (
    amountInKES: number | string,
    options?: { showCode?: boolean; decimals?: number }
  ): string => {
    const converted = convertFromKES(amountInKES);
    const info = CURRENCIES[currency];
    
    let decimals = options?.decimals;
    if (decimals === undefined) {
      decimals = currency === 'KES' ? 0 : 2;
    }

    const formattedNum = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (currency === 'KES') {
      return `KES ${formattedNum}`;
    }

    return `${info.symbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertFromKES,
        currentInfo: CURRENCIES[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: 'KES' as CurrencyCode,
      setCurrency: () => {},
      formatPrice: (amt: number | string) => `KES ${Number(amt).toLocaleString()}`,
      convertFromKES: (amt: number | string) => Number(amt),
      currentInfo: CURRENCIES.KES,
    };
  }
  return ctx;
};
