import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedTours } from '@/components/home/FeaturedTours';
import { NikkoSpotlightBanner } from '@/components/home/NikkoSpotlightBanner';
import { PopularDestinations } from '@/components/home/PopularDestinations';
import { WhyBookWithUs } from '@/components/home/WhyBookWithUs';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Navigation Bar with Live JST Clock & Multi-Currency Switcher */}
      <Navbar />

      {/* Hero Banner with Instant Discovery */}
      <HeroSection />

      {/* Featured Tours Grid (GetYourGuide Inspired) */}
      <FeaturedTours />

      {/* Nikko Day Trip Reference Spotlight Banner */}
      <NikkoSpotlightBanner />

      {/* Popular Japan Destinations */}
      <PopularDestinations />

      {/* Value Proposition & Trust Guarantees */}
      <WhyBookWithUs />

      {/* Verified International Traveler Reviews */}
      <TestimonialsSection />

      {/* Global Footer with Currency & Payment Assurances */}
      <Footer />
    </div>
  );
}
