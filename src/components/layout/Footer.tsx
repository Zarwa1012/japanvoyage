'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, CreditCard, Mail, Phone, MapPin, Globe, Sparkles } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export function Footer() {
  const { currency, config } = useCurrency();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Upper Trust Banner */}
      <div className="border-b border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Free 24h Cancellation</h4>
              <p className="text-slate-400 text-xs mt-0.5">Cancel up to 24 hours prior for a full refund</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">JST Synchronized</h4>
              <p className="text-slate-400 text-xs mt-0.5">Schedules operate on Asia/Tokyo (UTC+9)</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Secure Global Checkout</h4>
              <p className="text-slate-400 text-xs mt-0.5">PCI-DSS compliant 3DS hosted gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Instant Mobile Voucher</h4>
              <p className="text-slate-400 text-xs mt-0.5">Instant QR codes sent to your email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg">
                日
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Japan<span className="text-red-600">Voyage</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Your premier international portal for curated Japanese inbound travel experiences, UNESCO World Heritage excursions, bullet train tours, and scenic day trips from Tokyo.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-red-400" /> Current Currency: <strong className="text-white">{currency} ({config.symbol})</strong>
              </span>
            </div>
          </div>

          {/* Top Tours */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Top Day Trips</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/tours/nikko-day-trip-with-tobu-world-square" className="text-slate-400 hover:text-white transition-colors">
                  Nikko & Tobu World Square
                </Link>
              </li>
              <li>
                <Link href="/tours/mt-fuji-hakone-lake-ashi-cruise-ropeway" className="text-slate-400 hover:text-white transition-colors">
                  Mt. Fuji & Lake Ashi Cruise
                </Link>
              </li>
              <li>
                <Link href="/tours/kyoto-fushimi-inari-kinkakuji-arashiyama-day-trip" className="text-slate-400 hover:text-white transition-colors">
                  Kyoto 1,000 Torii & Bamboo
                </Link>
              </li>
              <li>
                <Link href="/tours/tokyo-hidden-izakaya-shinjuku-omoide-yokocho-food-tour" className="text-slate-400 hover:text-white transition-colors">
                  Shinjuku Omoide Yokocho Food
                </Link>
              </li>
              <li>
                <Link href="/tours/hiroshima-peace-memorial-miyajima-shrine-bullet-train" className="text-slate-400 hover:text-white transition-colors">
                  Hiroshima Bullet Train Excursion
                </Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Destinations</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Nikko (Tochigi)</Link></li>
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Tokyo</Link></li>
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Kyoto</Link></li>
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Mt. Fuji & Hakone</Link></li>
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Osaka</Link></li>
              <li><Link href="/#destinations" className="text-slate-400 hover:text-white transition-colors">Nara</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/account" className="text-slate-400 hover:text-white transition-colors">My Bookings & QR Vouchers</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">Traveler Sign In</Link></li>
              <li><Link href="/admin" className="text-slate-400 hover:text-white transition-colors">Admin Console</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">24/7 Booking Support</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cancellation & Refund Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Security & Copyright */}
        <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} JapanVoyage International Portal. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Cards Supported: Visa • Mastercard • UnionPay</span>
            <span>•</span>
            <span>3D Secure Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
