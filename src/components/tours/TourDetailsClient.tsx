'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Check, 
  X, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  Share2, 
  Heart, 
  Info, 
  Compass, 
  Bus, 
  Sparkles,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { MockTour, ALL_TOURS } from '@/data/mockTours';
import { useCurrency } from '@/context/CurrencyContext';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface TourDetailsClientProps {
  tour: MockTour;
}

export function TourDetailsClient({ tour }: TourDetailsClientProps) {
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  // State for gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Booking widget state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedOptionId, setSelectedOptionId] = useState(tour.options[0]?.id || 'std');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const selectedOption = tour.options.find(o => o.id === selectedOptionId) || tour.options[0];
  const unitPriceJpy = selectedOption ? selectedOption.priceJpy : tour.priceJpy;
  const childUnitPriceJpy = Math.round(unitPriceJpy * 0.7); // 30% discount for children
  const totalPriceJpy = (adults * unitPriceJpy) + (children * childUnitPriceJpy);

  // Related tours (same destination or random other tours)
  const relatedTours = ALL_TOURS.filter(t => t.id !== tour.id && (t.destinationSlug === tour.destinationSlug || t.category === tour.category)).slice(0, 3);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleProceedToBooking = () => {
    const query = new URLSearchParams({
      date: selectedDate,
      option: selectedOptionId,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/booking/${tour.slug}?${query.toString()}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link href="/tours" className="hover:text-red-600 transition-colors">All Tours</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 font-medium capitalize">{tour.destinationSlug}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-xs">{tour.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold text-xs uppercase tracking-wide rounded-full">
                {tour.category}
              </span>
              {tour.badge && (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  {tour.badge}
                </span>
              )}
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {tour.cancellationPolicy}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {tour.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-1">
              <div className="flex items-center gap-1 text-slate-900 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{tour.rating.toFixed(2)}</span>
                <span className="text-slate-500 font-normal">({tour.reviewCount} verified reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>{tour.destination}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{tour.duration}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Share & Wishlist) */}
          <div className="flex items-center gap-2.5 self-start shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
              title="Share tour"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isSaved 
                  ? 'border-red-200 bg-red-50 text-red-600' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Save to wishlist"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Main Featured Image */}
            <div className="lg:col-span-3 h-[320px] sm:h-[420px] md:h-[480px] rounded-2xl overflow-hidden relative shadow-md group">
              <ImageWithFallback
                src={tour.galleryImages[activeImageIndex] || tour.imageUrl}
                alt={tour.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg font-medium">
                  Photo {activeImageIndex + 1} of {tour.galleryImages.length}
                </span>
                <span className="bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  {tour.destination}
                </span>
              </div>
            </div>

            {/* Thumbnail Column */}
            <div className="grid grid-cols-4 lg:grid-cols-1 gap-2.5">
              {tour.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-20 sm:h-24 lg:h-[110px] rounded-xl overflow-hidden border-2 transition-all group ${
                    activeImageIndex === idx 
                      ? 'border-red-600 ring-2 ring-red-400/40 scale-102' 
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Main Section: Left = Content, Right = Sticky Independent Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-8 space-y-10">

            {/* Tour Highlights */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" />
                Tour Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tour.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3 bg-red-50/40 p-3.5 rounded-xl border border-red-100/60">
                    <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 leading-snug">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Full Description */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-red-600" />
                About This Experience
              </h2>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4 text-sm sm:text-base">
                {tour.fullDescription.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Quick Spec Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 mt-6 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Duration</span>
                  <span className="font-extrabold text-slate-900 text-sm">{tour.duration}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Live Tour Guide</span>
                  <span className="font-extrabold text-slate-900 text-sm">English, Japanese</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Group Size</span>
                  <span className="font-extrabold text-slate-900 text-sm">Max 25 travelers</span>
                </div>
              </div>
            </section>

            {/* Full Itinerary Timeline */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Full Day Itinerary
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                  All times in JST (Tokyo Time)
                </span>
              </div>

              <div className="relative border-l-2 border-red-200 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8">
                {tour.itinerary.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-4 h-4 rounded-full bg-white border-4 border-red-600 group-hover:scale-125 transition-transform" />
                    
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {step.time}
                      </span>
                      {step.duration && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({step.duration})
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-6">
                What’s Included & Excluded
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Included
                  </h3>
                  <ul className="space-y-2.5">
                    {tour.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-rose-600" />
                    Not Included
                  </h3>
                  <ul className="space-y-2.5">
                    {tour.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Meeting Point & Departure */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Meeting & Departure Point
              </h2>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {tour.meetingPoint.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {tour.meetingPoint.address}
                    </p>
                  </div>
                  <a
                    href={tour.meetingPoint.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Guide Instructions:</span>
                  <p>{tour.meetingPoint.instructions}</p>
                </div>
              </div>
            </section>

            {/* Important Information & Requirements */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-red-600" />
                Important Information & What to Bring
              </h2>
              <ul className="space-y-2 text-sm text-slate-700">
                {tour.importantInfo.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Customer Reviews Section */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    Customer Reviews
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Verified traveler feedback from international customers</p>
                </div>
                <div className="flex items-baseline gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                  <span className="text-3xl font-black text-slate-900">{tour.rating.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-bold">/ 5.0 ({tour.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Review Categories Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Tour Guide</span>
                  <span className="text-sm font-extrabold text-slate-900">4.9 / 5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Transportation</span>
                  <span className="text-sm font-extrabold text-slate-900">4.9 / 5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Value for Money</span>
                  <span className="text-sm font-extrabold text-slate-900">4.8 / 5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Organization</span>
                  <span className="text-sm font-extrabold text-slate-900">5.0 / 5</span>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                        JD
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Jonathan Davies</h4>
                        <span className="text-[11px] text-slate-400">United Kingdom • Traveled Oct 2026</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    “An unforgettable day trip! The Tobu World Square miniatures were astounding and Toshogu Shrine felt like traveling back into feudal Japan. Our guide Ken spoke flawless English and provided rich historical context.”
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        SK
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Sarah & Kevin</h4>
                        <span className="text-[11px] text-slate-400">United States • Traveled Nov 2026</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    “Seamless pickup at Shinjuku, comfortable coach with Wi-Fi, and enough free time at both the shrine and Kegon Falls. Booking through JapanVoyage was super smooth and multi-currency pricing made budgeting easy.”
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Independent Sticky Booking Widget (Moves & Scrolls Independently) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start lg:z-30 w-full">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-6 space-y-6 lg:max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain custom-scrollbar">
              
              {/* Price Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Starting from
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {formatPrice(unitPriceJpy)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ person</span>
                </div>
                {currency !== 'JPY' && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Base price: ¥{unitPriceJpy.toLocaleString()} JPY
                  </div>
                )}
              </div>

              {/* Step 1: Select Date */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>1. Select Date</span>
                  <span className="text-[11px] font-semibold text-emerald-600">Daily Departures</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={defaultDateStr}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-all cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Step 2: Select Tour Option / Departure */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Tour Option
                </label>
                <div className="space-y-2">
                  {tour.options.map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedOptionId === opt.id
                          ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{opt.title}</span>
                        <span className="font-black text-red-600">{formatPrice(opt.priceJpy)}</span>
                      </div>
                      <div className="text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Departs: {opt.departureTime}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Select Participants */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Participants
                </label>
                
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Adults</span>
                    <span className="text-[11px] text-slate-500">Age 12+ • {formatPrice(unitPriceJpy)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Children</span>
                    <span className="text-[11px] text-slate-500">Age 4-11 (30% off) • {formatPrice(childUnitPriceJpy)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation & CTA */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-700">Total Price:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-red-600">
                      {formatPrice(totalPriceJpy)}
                    </span>
                    {currency !== 'JPY' && (
                      <span className="block text-[11px] text-slate-400">
                        (¥{totalPriceJpy.toLocaleString()} JPY)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/30 text-base transition-all flex items-center justify-center gap-2"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Trust Badges */}
                <div className="space-y-2 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free cancellation up to 24h before</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Instant mobile voucher confirmation</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Related Tours Section */}
        {relatedTours.length > 0 && (
          <div className="mt-20 pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  You May Also Like
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  More highly recommended tours in Japan
                </p>
              </div>
              <Link 
                href="/tours" 
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span>View all {ALL_TOURS.length} tours</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedTours.map((relTour) => (
                <Link
                  key={relTour.id}
                  href={`/tours/${relTour.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="h-44 relative overflow-hidden">
                    <ImageWithFallback
                      src={relTour.imageUrl}
                      alt={relTour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {relTour.destination}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{relTour.rating.toFixed(2)}</span>
                        <span className="text-slate-400 font-normal">({relTour.reviewCount})</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {relTour.title}
                      </h3>
                    </div>
                    <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{relTour.duration}</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatPrice(relTour.priceJpy)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
