'use client';

import React from 'react';
import { ShieldCheck, Users, Globe, Clock, CheckCircle2 } from 'lucide-react';

export function WhyBookWithUs() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Free 24h Cancellation',
      description: 'Travel with complete peace of mind. Cancel your reservation up to 24 hours prior to departure for an unconditional 100% refund.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Users,
      title: 'Expert English-Speaking Guides',
      description: 'All tours are led by certified Japanese tour conductors fluent in English, offering deep historical insights into shrines, castles, and culture.',
      color: 'text-red-600 bg-red-50 border-red-100',
    },
    {
      icon: Globe,
      title: 'Global Currency Transparency',
      description: 'Browse in USD, EUR, GBP, AED, JPY, or PKR with live, fair exchange rates. What you see is what you pay—no hidden foreign surcharge surprises.',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Clock,
      title: 'JST Timezone Aligned',
      description: 'Never miss a bullet train or morning coach departure. Tour schedules are precisely synchronized to Tokyo time (Asia/Tokyo JST, UTC+9).',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <section id="why-us" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-400 block mb-2">
            The JapanVoyage Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Why International Travelers Choose Us
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Engineered to remove all anxiety from booking tours across Japan. We bridge the language, payment, and scheduling gap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div 
                key={idx} 
                className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 backdrop-blur-sm hover:border-slate-600 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${b.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
