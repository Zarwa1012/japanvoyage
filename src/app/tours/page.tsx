import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToursListingClient } from '@/components/tours/ToursListingClient';

export const metadata: Metadata = {
  title: 'Explore All Japan Tours & Day Trips | JapanVoyage',
  description: 'Browse handpicked Japan day trips, Tokyo excursions, Nikko UNESCO shrine tours, Mt. Fuji cruises, and Kyoto cultural walks. Instant confirmation, multi-currency support, and English-speaking guides.',
  keywords: ['Japan Tours', 'Nikko Day Trip', 'Tokyo Excursions', 'Kyoto Tours', 'Mt Fuji Day Trip', 'Osaka Food Tours'],
};

export default function ToursPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Global Navigation with Live JST Clock & Multi-Currency Switcher */}
      <Navbar />

      {/* Main Interactive Tours Listing Engine */}
      <ToursListingClient />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
