'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { POPULAR_DESTINATIONS, MockDestination } from '@/data/mockDestinations';
import { getDestinationsFromDatabase } from '@/lib/services/toursService';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

export function PopularDestinations() {
  const [destinations, setDestinations] = useState<MockDestination[]>(POPULAR_DESTINATIONS);

  useEffect(() => {
    let isMounted = true;
    async function loadDestinations() {
      try {
        const liveDests = await getDestinationsFromDatabase();
        if (isMounted && liveDests && liveDests.length > 0) {
          setDestinations(liveDests);
        }
      } catch (err) {
        console.warn('Fallback to static destinations');
      }
    }
    loadDestinations();
    return () => { isMounted = false; };
  }, []);

  return (
    <section id="destinations" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 block mb-2">
              Iconic Regions of Japan
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Popular Japan Travel Destinations
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl">
              Explore ancient temples in Nikko and Kyoto, bustling Tokyo street life, and sacred volcanic peaks.
            </p>
          </div>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={dest.slug === 'nikko' ? '/tours/nikko-day-trip-with-tobu-world-square' : '/#featured-tours'}
              className="group relative h-72 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-end p-6 border border-slate-200"
            >
              {/* Background Image */}
              <ImageWithFallback
                src={dest.imageUrl || `/images/destinations/${dest.slug}.jpg`}
                alt={dest.name}
                fallbackSrc={`/images/destinations/${dest.slug}.jpg`}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              {/* Tag / Badge */}
              <div className="relative z-10 flex justify-between items-start mb-auto">
                <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-600" />
                  {dest.tourCount} Tours Available
                </span>
                {dest.isPopular && (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Top Choice
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="relative z-10 text-white">
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider block mb-1">
                  {dest.region}
                </span>
                <h3 className="text-xl font-black text-white group-hover:text-red-300 transition-colors flex items-center justify-between">
                  <span>{dest.name}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {dest.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
