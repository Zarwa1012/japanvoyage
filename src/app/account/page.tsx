'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode, 
  Download, 
  Heart, 
  Settings, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Mail,
  Phone,
  Globe,
  Lock,
  Compass
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { ALL_TOURS } from '@/data/mockTours';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { createClient } from '@/lib/supabase/client';

interface AccountBooking {
  id: string;
  reference: string;
  tourTitle: string;
  tourSlug: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  meetingPoint: string;
  participants: string;
  totalJpy: number;
  status: string;
  imageUrl: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { user, profile, role, isLoading: authLoading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'bookings' | 'wishlist' | 'settings'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selectedVoucherModal, setSelectedVoucherModal] = useState<any | null>(null);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Redirect to login if unauthenticated once loading completes
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/account');
    }
  }, [authLoading, user, router]);

  // Derived user display info
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const email = user?.email || '';
  const country = profile?.nationality_code || user?.user_metadata?.country || 'International Traveler';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Real Database Bookings State (Default ZERO for every new user / employee!)
  const [userBookings, setUserBookings] = useState<AccountBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editName, setEditName] = useState(fullName);
  const [editCountry, setEditCountry] = useState(country);

  const supabase = createClient();

  // Instant Printable Official Ticket Voucher & Payment Receipt Download
  const handleDownloadTicketVoucher = (voucher: any) => {
    if (!voucher) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups in your browser to download your ticket voucher receipt.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Japan Voyage Ticket Receipt - ${voucher.reference}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 620px; margin: 0 auto; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 900; color: #dc2626; letter-spacing: -0.5px; }
            .badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; margin-top: 8px; border: 1px solid #a7f3d0; }
            .ref-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
            .ref { font-family: monospace; font-size: 22px; font-weight: 900; color: #dc2626; letter-spacing: 1px; }
            .details { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
            .details td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .details td:first-child { color: #64748b; font-weight: 600; width: 40%; }
            .details td:last-child { font-weight: 700; text-align: right; color: #0f172a; }
            .qr-box { background: white; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px auto; width: fit-content; text-align: center; font-family: monospace; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
            .print-btn { background: #0f172a; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; }
            @media print { body { padding: 0; } .print-btn-container { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">JAPAN VOYAGE</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Tour Ticket & Payment Receipt</div>
            <div class="badge">✓ Verified Booking Voucher</div>
          </div>
          <div class="ref-box">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Booking Reference</div>
            <div class="ref">${voucher.reference}</div>
            <div style="font-size: 13px; color: #475569; margin-top: 6px; font-weight: 600;">${voucher.participants} • Lead Traveler: ${fullName}</div>
          </div>
          <table class="details">
            <tr><td>Tour Title</td><td>${voucher.tourTitle}</td></tr>
            <tr><td>Departure Date & Time</td><td>${voucher.departureDate} at ${voucher.departureTime}</td></tr>
            <tr><td>Meeting Point</td><td>${voucher.meetingPoint}</td></tr>
            <tr><td>Ticket Status</td><td style="color: #059669; font-weight: 800;">CONFIRMED & VALIDATED</td></tr>
            <tr><td>Total Charged</td><td style="font-weight: 800;">${voucher.price}</td></tr>
            <tr><td>Emergency / Desk Contact</td><td>+92 324 6465916</td></tr>
          </table>
          <div class="qr-box">
            [ QR VOUCHER: ${voucher.reference} ]<br />
            <span style="font-size: 10px; color: #64748b; font-weight: normal;">Present this electronic ticket upon boarding</span>
          </div>
          <div class="print-btn-container" style="text-align: center; margin: 28px 0;">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="footer">
            Japan Voyage Inbound Tours • Support: zarwaaslam1010@gmail.com / WhatsApp: +92 324 6465916<br />
            Thank you for traveling with Japan Voyage. Have a safe and memorable journey!
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    if (fullName) setEditName(fullName);
    if (country) setEditCountry(country);
  }, [fullName, country]);

  // Fetch REAL user bookings from Supabase database
  useEffect(() => {
    async function loadRealBookings() {
      if (!user) return;
      setLoadingBookings(true);
      try {
        const res = await fetch('/api/user/bookings');
        const json = await res.json();

        if (json?.bookings && Array.isArray(json.bookings)) {
          setUserBookings(json.bookings);
        } else {
          setUserBookings([]);
        }
      } catch (err) {
        setUserBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    }

    loadRealBookings();
  }, [user]);

  const upcomingBookings = userBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending Payment');
  const pastBookings = userBookings.filter(b => b.status === 'Completed' || b.status === 'completed');

  // Wishlist Tours
  const [wishlistTours, setWishlistTours] = useState([
    ALL_TOURS[2],
    ALL_TOURS[3],
    ALL_TOURS[5],
  ]);

  const handleRemoveFromWishlist = (tourId: string) => {
    setWishlistTours(wishlistTours.filter(t => t.id !== tourId));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          nationality_code: editCountry.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      setSavedSettingsSuccess(true);
      setTimeout(() => setSavedSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-slate-500 font-bold text-sm">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading traveler profile...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Authentication Required</h1>
            <p className="text-xs text-slate-500">
              Please sign in to access your booked Japan tours, travel vouchers, and saved wishlist.
            </p>
            <Link
              href="/login?redirectTo=/account"
              className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all"
            >
              Sign In to Your Account
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Real Logged-in User Header Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/30 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                {initials || 'JP'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">{fullName}</h1>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                    role === 'admin' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {role === 'admin' ? 'Platform Admin' : 'Customer Account'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>{email}</span>
                  <span>•</span>
                  <span>🌐 {country}</span>
                  <span>•</span>
                  <span>Member since {memberSince}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tours"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Book New Tour</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings ({upcomingBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'wishlist'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Saved Wishlist ({wishlistTours.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Profile & Preferences</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            
            {/* Sub-filter tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setBookingFilter('upcoming')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  bookingFilter === 'upcoming'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Upcoming Trips ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setBookingFilter('past')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  bookingFilter === 'past'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Past Trips ({pastBookings.length})
              </button>
              <button
                onClick={() => setBookingFilter('cancelled')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  bookingFilter === 'cancelled'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cancelled (0)
              </button>
            </div>

            {/* Upcoming List */}
            {bookingFilter === 'upcoming' && (
              loadingBookings ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-bold">Checking verified database reservations...</p>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Compass className="w-8 h-8 stroke-[1.8]" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900">No Upcoming Trips</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      You do not have any active or upcoming Japan tour bookings yet. Explore our curated day trips and start planning your unforgettable journey.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/tours"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-600/20 transition-all hover:scale-102"
                    >
                      <span>Explore Japan Tours</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-slate-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 relative">
                          <ImageWithFallback
                            src={b.imageUrl}
                            alt={b.tourTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {b.reference}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {b.status}
                            </span>
                          </div>
                          <h2 className="text-base font-extrabold text-slate-900 max-w-xl">
                            {b.tourTitle}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-red-500" />
                              {b.departureDate} ({b.departureTime})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {b.destination}
                            </span>
                            <span>•</span>
                            <span>{b.participants}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-end lg:self-center shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedVoucherModal(b)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>View Voucher</span>
                        </button>
                        <button
                          onClick={() => handleDownloadTicketVoucher(b)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                          title="Download printable ticket receipt"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Receipt</span>
                        </button>
                        <Link
                          href={`/tours/${b.tourSlug}`}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                          <span>Tour Details</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Past List */}
            {bookingFilter === 'past' && (
              pastBookings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">No Past Trips Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Completed tours and departure itineraries will appear here after your journey.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0 relative">
                          <ImageWithFallback
                            src={b.imageUrl}
                            alt={b.tourTitle}
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-mono font-bold">{b.reference}</span>
                          <h3 className="text-sm font-bold text-slate-800">{b.tourTitle}</h3>
                          <p className="text-xs text-slate-500 mt-1">Traveled on {b.departureDate} • {b.participants}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => alert('Customer review submission will connect directly to verified bookings.')}
                          className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          Leave a Review
                        </button>
                        <Link
                          href={`/tours/${b.tourSlug}`}
                          className="text-xs font-bold text-slate-700 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                          Book Again
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Cancelled List */}
            {bookingFilter === 'cancelled' && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <p className="text-sm font-bold text-slate-700">No cancelled trips found.</p>
                <p className="text-xs text-slate-400 mt-1">All your reservations are in good standing.</p>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistTours.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Save your favorite Japan tours to book later.</p>
                <Link
                  href="/tours"
                  className="bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md inline-block"
                >
                  Explore Japan Tours
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {wishlistTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 relative">
                        <ImageWithFallback
                          src={tour.imageUrl}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveFromWishlist(tour.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow hover:bg-white"
                          title="Remove from wishlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5">
                        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                          {tour.destination}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                          {tour.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {tour.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">From</span>
                        <span className="text-base font-black text-slate-900">{formatPrice(tour.priceJpy)}</span>
                      </div>
                      <Link
                        href={`/tours/${tour.slug}`}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-1">
              Personal Information & Travel Preferences
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your contact details and default traveler settings
            </p>

            {savedSettingsSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Travel preferences saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  defaultValue={email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-semibold cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Email address managed by Supabase Authentication.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country / Nationality</label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Digital QR Voucher Modal */}
      {selectedVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedVoucherModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Verified Booking Voucher
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Mobile Travel Pass
              </h3>
              <p className="text-xs text-slate-500">Show this QR code to your tour conductor upon boarding</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="w-40 h-40 bg-white rounded-2xl border-2 border-slate-300 p-2 shadow-inner flex items-center justify-center">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
              <span className="font-mono text-base font-black text-red-600 mt-3">
                {selectedVoucherModal.reference}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 font-bold">
                {selectedVoucherModal.participants} • Lead: {fullName}
              </span>
            </div>

            <div className="mt-6 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Tour:</span>
                <span className="font-bold text-slate-900 max-w-xs text-right truncate">{selectedVoucherModal.tourTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Departure:</span>
                <span className="font-bold text-slate-900">{selectedVoucherModal.departureDate} at {selectedVoucherModal.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Meeting Point:</span>
                <span className="font-bold text-slate-900 text-right">{selectedVoucherModal.meetingPoint}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDownloadTicketVoucher(selectedVoucherModal)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download / Print Receipt Voucher (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
