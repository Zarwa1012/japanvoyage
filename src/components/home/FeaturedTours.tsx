'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Clock, MapPin, Heart, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { FEATURED_TOURS, MockTour } from '@/data/mockTours';
import { getToursFromDatabase } from '@/lib/services/toursService';
import { useCurrency } from '@/context/CurrencyContext';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

export function FeaturedTours() {
  const { formatPrice, currency } = useCurrency();
  const [tours, setTours] = useState<MockTour[]>(FEATURED_TOURS);

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const liveTours = await getToursFromDatabase();
        if (isMounted && liveTours && liveTours.length > 0) {
          // Take top 3 or bestseller tours for the home page feature section
          const bestsellers = liveTours.filter(t => t.isBestseller);
          setTours(bestsellers.length >= 3 ? bestsellers.slice(0, 3) : liveTours.slice(0, 3));
        }
      } catch (err) {
        console.warn('Fallback to static featured tours');
      }
    }
    loadFeatured();
    return () => { isMounted = false; };
  }, []);

  return (
    <section id="featured-tours" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-red-600 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top Rated Japan Curation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Featured Japan Inbound Excursions
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl">
              Handpicked full-day tours and cultural activities with guaranteed English commentary and hassle-free transit.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Prices displayed in:</span>
            <span className="bg-white border border-slate-300 text-slate-900 px-2.5 py-1 rounded-md font-extrabold">
              {currency}
            </span>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} formatPrice={formatPrice} currency={currency} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TourCard({ 
  tour, 
  formatPrice, 
  currency 
}: { 
  tour: MockTour; 
  formatPrice: (jpy: number) => string;
  currency: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      <div>
        {/* Tour Image with Badge & Wishlist */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-100">
          <ImageWithFallback
            src={tour.imageUrl}
            alt={tour.title}
            fallbackSrc={`/images/destinations/${tour.destinationSlug || 'tokyo'}.jpg`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />

          {/* Badge */}
          {tour.badge && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider">
              {tour.badge}
            </div>
          )}

          {/* Wishlist Heart */}
          <button 
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:text-red-600 transition-colors shadow"
            aria-label="Save to Wishlist"
            onClick={(e) => {
              e.preventDefault();
              alert(`Saved "${tour.title}" to your wishlist.`);
            }}
          >
            <Heart className="w-4 h-4" />
          </button>

          {/* Category Pill on Image */}
          <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-2">
            <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px]">
              {tour.category}
            </span>
            <span className="text-slate-200">•</span>
            <span>{tour.destination}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span>{tour.rating.toFixed(2)}</span>
            <span className="text-slate-400 font-normal">({tour.reviewCount} reviews)</span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-950 text-base leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
            <Link href={`/tours/${tour.slug}`}>
              {tour.title}
            </Link>
          </h3>

          {/* Meta Info */}
          <div className="mt-3.5 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{tour.duration}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>From {tour.departureLocation}</span>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
            {tour.features.slice(0, 2).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing & Action */}
      <div className="p-5 pt-0 mt-2">
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">From</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">
                {formatPrice(tour.priceJpy)}
              </span>
              {currency !== 'JPY' && (
                <span className="text-[11px] text-slate-400 font-medium">
                  (¥{tour.priceJpy.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/tours/${tour.slug}`}
            className="bg-slate-900 group-hover:bg-red-600 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
