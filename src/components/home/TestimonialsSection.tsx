'use client';

import React from 'react';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  origin: string;
  flag: string;
  tourTitle: string;
  rating: number;
  date: string;
  comment: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: '1',
    name: 'Sarah & Mark Jenkins',
    origin: 'London, United Kingdom',
    flag: '🇬🇧',
    tourTitle: 'From Tokyo: Nikko Day Trip with Tobu World Square',
    rating: 5,
    date: 'Reviewed October 2026',
    comment: 'Booking this through JapanVoyage from London was seamless. The bus pickup at Shinjuku West Exit was punctual, our guide Ken spoke flawless English, and seeing the 102 miniature landmarks at Tobu World Square followed by Nikko Toshogu Shrine was the highlight of our 2-week Japan trip!'
  },
  {
    id: '2',
    name: 'David R. Miller',
    origin: 'San Francisco, USA',
    flag: '🇺🇸',
    tourTitle: 'Mt. Fuji 5th Station & Lake Ashi Cruise',
    rating: 5,
    date: 'Reviewed September 2026',
    comment: 'I really appreciated the clear pricing in USD and the dual timezone clock on the website. I was nervous about meeting points in massive Tokyo stations, but the GPS map link and clear photos sent with the mobile QR voucher made it effortless.'
  },
  {
    id: '3',
    name: 'Ahmed Al-Mansoor',
    origin: 'Dubai, UAE',
    flag: '🇦🇪',
    tourTitle: 'From Tokyo: Nikko Day Trip with Tobu World Square',
    rating: 5,
    date: 'Reviewed November 2026',
    comment: 'The luxury coach was super quiet with USB chargers at every seat. Nikko in the autumn foliage is magical. Being able to pay with our UAE card without extra foreign conversion markup made it a 10/10 experience.'
  },
  {
    id: '4',
    name: 'Zubair & Family',
    origin: 'Lahore, Pakistan',
    flag: '🇵🇰',
    tourTitle: 'Kyoto 1,000 Torii & Bamboo Forest Excursion',
    rating: 5,
    date: 'Reviewed October 2026',
    comment: 'First time visiting Japan with elderly parents and kids. Everything was coordinated smoothly, and having instant email confirmations with WhatsApp support gave our family huge confidence. Highly recommended!'
  }
];

export function TestimonialsSection() {
  return (
    <section id="reviews" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-red-600 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Customer Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Loved by International Travelers
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Over 14,000+ international tourists booked their dream Japan excursions through our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {REVIEWS.map((r) => (
            <div 
              key={r.id} 
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                {/* Tour Referenced */}
                <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2 truncate">
                  {r.tourTitle}
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{r.flag}</span>
                    <span>{r.name}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 block">{r.origin}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
