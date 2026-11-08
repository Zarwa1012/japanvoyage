import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ALL_TOURS } from '@/data/mockTours';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TourDetailsClient } from '@/components/tours/TourDetailsClient';
import { getTourBySlugFromDatabase } from '@/lib/services/toursService';

interface TourPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return ALL_TOURS.map((tour) => ({
    slug: tour.slug,
  }));
}

export async function generateMetadata({ params }: TourPageProps): Promise<Metadata> {
  const tour = await getTourBySlugFromDatabase(params.slug);
  if (!tour) {
    return {
      title: 'Tour Not Found | JapanVoyage',
    };
  }

  return {
    title: `${tour.title} | JapanVoyage`,
    description: tour.shortDescription,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription,
      images: [{ url: tour.imageUrl }],
    },
  };
}

export default async function TourDetailPage({ params }: TourPageProps) {
  const tour = await getTourBySlugFromDatabase(params.slug);

  if (!tour) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <TourDetailsClient tour={tour} />
      </main>
      <Footer />
    </div>
  );
}
