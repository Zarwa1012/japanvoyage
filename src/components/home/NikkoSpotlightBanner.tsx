'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Clock, MapPin, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

export function NikkoSpotlightBanner() {
  const { formatPrice, currency } = useCurrency();

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 rounded-3xl overflow-hidden shadow-2xl text-white border border-slate-800 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 lg:p-14">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Featured GetYourGuide Day Trip Recommendation</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Nikko Day Trip with Tobu World Square & UNESCO Toshogu Shrine
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Depart central Tokyo or Yokohama aboard a luxury air-conditioned executive coach. Marvel at 102 miniature architectural wonders at Tobu World Square, walk through the sacred cedar groves of Tokugawa Ieyasu's golden shrine, and witness the roaring 97-meter Kegon Falls.
              </p>

              {/* Highlights List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>All Entrance Tickets Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>English Audio Guide & Certified Guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Round-trip Transit from Shinjuku / Yokohama</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Free 24h Cancellation Guarantee</span>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-6">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Total Price per Adult</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      {formatPrice(14500)}
                    </span>
                    {currency !== 'JPY' && (
                      <span className="text-xs text-slate-400">
                        (Base ¥14,500 JPY)
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/tours/nikko-day-trip-with-tobu-world-square"
                  className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-xl shadow-red-600/30 flex items-center gap-2 transition-all"
                >
                  <span>View Tour Details & Dates</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Media Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3]">
                <ImageWithFallback
                  src="/images/destinations/nikko.jpg"
                  fallbackSrc="/images/placeholders/default-tour.svg"
                  alt="Nikko Toshogu Shrine"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>4.88 / 5.0</span>
                      <span className="text-slate-400 font-normal">(348 reviews)</span>
                    </div>
                    <span className="text-xs font-extrabold text-white block mt-0.5">
                      Departs daily at 08:00 AM JST
                    </span>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Instant QR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
