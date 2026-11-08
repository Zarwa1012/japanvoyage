import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'Japan Discovery | Tours, Day Trips & Cultural Experiences',
  description: 'Book unforgettable Japan tours, bullet train excursions, and UNESCO World Heritage day trips. Real-time availability, instant confirmation, and multi-currency support.',
  keywords: ['Japan Tours', 'Nikko Day Trip', 'Tokyo Excursions', 'Tobu World Square', 'Kegon Falls', 'Toshogu Shrine'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900 bg-white">
        <AppProviders>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
