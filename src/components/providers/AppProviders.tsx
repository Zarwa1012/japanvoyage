'use client';

import React from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { AuthProvider } from '@/context/AuthContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </AuthProvider>
  );
}
