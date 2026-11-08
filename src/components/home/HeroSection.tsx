'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, Users, ArrowRight, ShieldCheck, Star, Sparkles } from 'lucide-react';

export function HeroSection() {
  const [selectedDestination, setSelectedDestination] = useState<string>('all');

  return (
    <section className="relative bg-slate-950 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Aesthetic High-Resolution Local Japan Tourism Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-45 scale-105 transform transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('/images/hero-bg.jpg')`,
        }}
      />
      
      {/* Aesthetic Vignette & Atmospheric Contrast Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-slate-950/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold mb-6 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Curated Inbound Japan Day Trips • Verified Quality Standards</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
          Explore Japan’s Wonders with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">Instant Booking</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          From the ornate UNESCO shrines of Nikko and miniature wonders of Tobu World Square, to Mt. Fuji panoramic cruises. Transparent pricing in your local currency.
        </p>

        {/* Floating Search & Discovery Bar */}
        <div className="mt-10 max-w-4xl mx-auto bg-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-200 text-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Destination Selector */}
            <div className="sm:col-span-5 flex items-center gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors text-left">
              <MapPin className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Where in Japan?
                </label>
                <select 
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Destinations (Japan)</option>
                  <option value="nikko">Nikko & Tobu World Square</option>
                  <option value="tokyo">Tokyo & Shinjuku</option>
                  <option value="kyoto">Kyoto Cultural Heritage</option>
                  <option value="mt-fuji">Mt. Fuji & Hakone</option>
                  <option value="osaka">Osaka Street Food</option>
                </select>
              </div>
            </div>

            {/* Date / Timezone Context */}
            <div className="sm:col-span-4 flex items-center gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors text-left">
              <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Tour Departure
                </span>
                <span className="text-sm font-bold text-slate-900 block truncate">
                  Next 30 Days (JST Asia/Tokyo)
                </span>
              </div>
            </div>

            {/* Search CTA Button */}
            <div className="sm:col-span-3">
              <Link
                href={selectedDestination === 'nikko' ? '/tours/nikko-day-trip-with-tobu-world-square' : selectedDestination === 'all' ? '/tours' : `/tours?destination=${selectedDestination}`}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Tours</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Value Proposition Pills */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Free 24h Cancellation
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.88+ Rated Experiences
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-4 h-4 text-blue-400" /> Fluent English Tour Guides
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            ⚡ Instant Mobile QR Voucher
          </span>
        </div>
      </div>
    </section>
  );
}
