'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Heart, 
  User, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { currency, setCurrency, config } = useCurrency();
  const { user, profile, role, isLoading: authLoading, signOut } = useAuth();
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tokyoTime, setTokyoTime] = useState<string>('');

  // Live JST Clock for timezone assurance
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setTokyoTime(now.toLocaleTimeString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Top Value Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-red-400 font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Official Japan Voyage Tours
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Free 24h Cancellation on all tours
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {tokyoTime && (
              <div className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Tokyo: <strong className="text-white font-mono">{tokyoTime} JST</strong></span>
              </div>
            )}
            <span className="hidden md:inline text-slate-400">English Tour Conductor Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                日
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Japan<span className="text-red-600">Voyage</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  Inbound Travel Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
              <Link href="/tours" className="hover:text-red-600 transition-colors font-bold text-slate-900">
                Explore All Tours
              </Link>
              <Link href="/tours/nikko-day-trip-with-tobu-world-square" className="text-red-600 font-bold hover:text-red-700 transition-colors flex items-center gap-1">
                Nikko Excursion
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-extrabold uppercase">Popular</span>
              </Link>
              <Link href="/#destinations" className="hover:text-red-600 transition-colors">
                Destinations
              </Link>
              <Link href="/#why-us" className="hover:text-red-600 transition-colors">
                Why Us
              </Link>
              <Link href="/#reviews" className="hover:text-red-600 transition-colors">
                Traveler Reviews
              </Link>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Multi-Currency Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                aria-label="Select Currency"
              >
                <span>{config.flag}</span>
                <span>{currency}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isCurrencyMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCurrencyMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Display Currency
                    </div>
                    {Object.values(CURRENCIES).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code as CurrencyCode);
                          setIsCurrencyMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                          currency === c.code 
                            ? 'bg-red-50 text-red-600 font-bold' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.label}</span>
                        </span>
                        {currency === c.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        )}
                      </button>
                    ))}
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50 mt-1 border-t border-slate-100">
                      Base rates from JPY with real-time conversion.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help / Language Indicator */}
            <div className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>EN</span>
            </div>

            {/* Login / Profile Menu */}
            {!authLoading && !user ? (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Log In</span>
              </Link>
            ) : !authLoading && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-[11px] flex items-center justify-center">
                    {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{profile?.full_name || user.email?.split('@')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {profile?.full_name || 'Traveler'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          role === 'admin' 
                            ? 'bg-red-100 text-red-700 font-extrabold' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {role === 'admin' ? 'Platform Admin' : 'Customer'}
                        </span>
                      </div>

                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span>My Account & Bookings</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </Link>

                      {role === 'admin' && (
                        <>
                          <div className="my-1 border-t border-slate-100" />
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-600" />
                              Admin Dashboard
                            </span>
                            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">Admin</span>
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await signOut();
                          window.location.href = '/';
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-16 h-8 bg-slate-100 rounded-lg animate-pulse" />
            )}

            {/* Primary Action Button */}
            <Link
              href="/tours/nikko-day-trip-with-tobu-world-square"
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Book Nikko Tour</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200"
            >
              <span>{config.flag}</span>
              <span>{currency}</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
              <Link 
                href="/tours" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-slate-100 text-slate-900 p-2.5 rounded-lg font-bold flex items-center justify-between"
              >
                <span>🏯 Explore All Japan Tours</span>
              </Link>
              <Link 
                href="/tours/nikko-day-trip-with-tobu-world-square" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-red-50 text-red-600 p-2.5 rounded-lg font-bold flex items-center justify-between"
              >
                <span>⭐ Nikko Day Trip (Reference Tour)</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Hot</span>
              </Link>
              <Link href="/#featured-tours" onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                Featured Japan Day Trips
              </Link>
              <Link href="/#destinations" onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                Popular Destinations
              </Link>
              <Link href="/#why-us" onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                Why Book With Us
              </Link>
              <Link href="/#reviews" onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                Traveler Reviews
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Display Currency
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code as CurrencyCode);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center flex items-center justify-center gap-1 ${
                      currency === c.code 
                        ? 'border-red-600 bg-red-50 text-red-600' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!authLoading && user ? (
                  <>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs font-extrabold text-slate-900">{profile?.full_name || 'Traveler'}</div>
                      <div className="text-[11px] text-slate-500">{user.email}</div>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {role === 'admin' ? 'Platform Admin' : 'Customer Account'}
                      </span>
                    </div>

                    <Link 
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs text-center"
                    >
                      My Account & Bookings
                    </Link>

                    {role === 'admin' && (
                      <Link 
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold text-xs text-center"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await signOut();
                        window.location.href = '/';
                      }}
                      className="w-full bg-rose-50 border border-rose-200 text-rose-700 py-2.5 rounded-xl font-bold text-xs text-center"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link 
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold text-xs text-center shadow-md shadow-red-600/20"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs text-center border border-slate-200"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
