import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ALL_TOURS } from '@/data/mockTours';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookingFlowClient } from '@/components/booking/BookingFlowClient';
import { getTourBySlugFromDatabase } from '@/lib/services/toursService';

interface BookingPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return ALL_TOURS.map((tour) => ({
    slug: tour.slug,
  }));
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const tour = await getTourBySlugFromDatabase(params.slug);
  if (!tour) {
    return {
      title: 'Booking | JapanVoyage',
    };
  }

  return {
    title: `Book: ${tour.title} | JapanVoyage`,
    description: `Complete your reservation for ${tour.title}. Instant confirmation and free 24-hour cancellation.`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const tour = await getTourBySlugFromDatabase(params.slug);

  if (!tour) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-slate-500 font-bold text-sm">
            Loading booking details...
          </div>
        }>
          <BookingFlowClient tour={tour} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
