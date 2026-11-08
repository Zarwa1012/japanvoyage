'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  Compass, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight, 
  Star, 
  ShieldAlert, 
  Settings, 
  ExternalLink,
  Eye,
  Edit,
  ArrowUpRight,
  MoreVertical,
  Check,
  X,
  Copy,
  CreditCard,
  Smartphone,
  Building2,
  QrCode,
  RefreshCw,
  FileText,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { ALL_TOURS } from '@/data/mockTours';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { createClient } from '@/lib/supabase/client';

interface AdminDashboardClientProps {
  adminEmail: string;
}

interface AdminPaymentRecord {
  id: string;
  booking_id: string;
  gateway_provider: 'easypaisa' | 'jazzcash' | 'raast' | 'card' | 'stripe' | string;
  gateway_transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'pending_verification' | 'paid' | 'captured' | 'rejected' | 'initiated' | 'failed' | string;
  sender_name?: string | null;
  sender_mobile?: string | null;
  sender_account?: string | null;
  proof_image_url?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  raw_payload?: any;
  booking?: {
    id: string;
    booking_reference: string;
    status: string;
    lead_traveler_name: string;
    lead_traveler_email: string;
    lead_traveler_phone?: string;
    total_participants: number;
    total_base_amount: number;
    charged_amount: number;
    charged_currency: string;
    schedule?: {
      tour_date: string;
      start_time_jst: string;
      tour_option?: {
        title: string;
        tour?: {
          title: string;
          slug: string;
        };
      };
    };
  };
}

export function AdminDashboardClient({ adminEmail }: AdminDashboardClientProps) {
  const { formatPrice } = useCurrency();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tours' | 'bookings' | 'customers' | 'reviews' | 'payments'>('overview');
  
  // Supabase Database Connection & Dynamic Admin States
  const supabase = createClient();
  const [toursList, setToursList] = useState(ALL_TOURS.map(t => ({ ...t, isActive: true })));
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Manual Payment Verification State
  const [paymentsList, setPaymentsList] = useState<AdminPaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'easypaisa' | 'jazzcash' | 'raast'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'PAID' | 'REJECTED'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'confirmed' | 'all'>('confirmed');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<AdminPaymentRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);

  // Active Receipt Preview State (Requirements 3, 4, 5, 6)
  const [activeReceipt, setActiveReceipt] = useState<{
    paymentId: string;
    bookingReference?: string;
    bookingId?: string;
    customerName?: string;
    transactionId?: string;
    amount?: number;
    signedUrl: string | null;
    fileName: string;
    isPdf: boolean;
    isLoading: boolean;
    error: string | null;
  } | null>(null);

  // Helper to open secure receipt preview (Requirement 4, 6)
  const handleOpenReceipt = async (p: AdminPaymentRecord) => {
    setActiveReceipt({
      paymentId: p.id,
      bookingReference: p.booking?.booking_reference,
      bookingId: p.booking_id,
      customerName: p.booking?.lead_traveler_name || p.sender_name || 'Traveler',
      transactionId: p.gateway_transaction_id,
      amount: p.amount,
      signedUrl: null,
      fileName: 'receipt',
      isPdf: false,
      isLoading: true,
      error: null,
    });

    try {
      const res = await fetch(`/api/admin/payments/receipt?paymentId=${p.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve receipt from Supabase storage.');
      }

      setActiveReceipt(prev => prev ? {
        ...prev,
        signedUrl: data.signedUrl,
        fileName: data.fileName || 'receipt',
        isPdf: data.isPdf || false,
        isLoading: false,
        error: null,
      } : null);
    } catch (err: any) {
      setActiveReceipt(prev => prev ? {
        ...prev,
        isLoading: false,
        error: err.message || 'Could not load receipt file from Supabase storage.',
      } : null);
    }
  };

  // Helper to normalize payment status to PENDING, PAID, or REJECTED (Requirement 3)
  const getDisplayPaymentStatus = (status: string): 'PENDING' | 'PAID' | 'REJECTED' => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'captured') return 'PAID';
    if (s === 'rejected' || s === 'failed') return 'REJECTED';
    return 'PENDING';
  };

  // Fetch Payments from API
  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPaymentsList(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch real database data on mount
  useEffect(() => {
    async function loadAdminData() {
      setLoadingDb(true);
      try {
        // 1. Fetch real bookings from Supabase
        const { data: dbBookings } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbBookings && dbBookings.length > 0) {
          setBookingsList(dbBookings.map((b: any) => ({
            id: b.id,
            reference: b.booking_reference,
            customer: b.lead_traveler_name || 'Traveler',
            email: b.lead_traveler_email || 'traveler@example.com',
            nationality: '🌍 International',
            tourTitle: 'Japan Voyage Tour Reservation',
            date: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '2026-11-20',
            gateway: b.payment_method ? b.payment_method.toUpperCase() : (b.charged_currency === 'PKR' ? 'PAKISTANI GATEWAY' : 'CARD'),
            amountJpy: Number(b.total_base_amount || 0),
            status: b.status === 'confirmed' ? 'Confirmed' : b.status === 'hold_pending_payment' ? 'Hold Pending' : b.status === 'cancelled_by_operator' ? 'Cancelled / Rejected' : b.status,
            isConfirmed: b.status === 'confirmed',
            rawStatus: b.status
          })));
        } else {
          setBookingsList([]);
        }

        // 2. Fetch real customer profiles from Supabase
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbProfiles && dbProfiles.length > 0) {
          setCustomers(dbProfiles.map((p: any) => ({
            name: p.full_name || p.email.split('@')[0],
            email: p.email,
            country: p.nationality_code || 'International Traveler',
            bookings: 0,
            spentJpy: 0,
            status: p.role === 'admin' ? 'Admin' : 'Active'
          })));
        } else {
          setCustomers([]);
        }

        // 3. Fetch real reviews from Supabase
        const { data: dbReviews } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbReviews && dbReviews.length > 0) {
          setReviews(dbReviews.map((r: any) => ({
            id: r.id,
            author: r.title || 'Verified Traveler',
            tour: 'Verified Japan Experience',
            rating: r.rating,
            comment: r.comment,
            status: r.status === 'published' ? 'Approved' : 'Pending'
          })));
        } else {
          setReviews([]);
        }

        // 4. Fetch payments
        await fetchPayments();
      } catch (err) {
        console.error('Error fetching real admin data:', err);
      } finally {
        setLoadingDb(false);
      }
    }

    loadAdminData();
  }, []);

  const toggleTourStatus = (tourId: string) => {
    setToursList(toursList.map(t => t.id === tourId ? { ...t, isActive: !t.isActive } : t));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    setTimeout(() => setCopiedTxn(null), 2500);
  };

  // Payment Verification Handler (Approve / Reject) (Requirements 6, 7, 8, 9, 10)
  const handleVerifyAction = async (paymentId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(paymentId);
    try {
      const res = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          rejectionReason: reason,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to verify payment');
      }

      setFeedbackMessage({
        type: 'success',
        text: action === 'approve' 
          ? `Payment approved successfully! Status updated to PAID and Booking marked as CONFIRMED.` 
          : `Payment rejected. Status updated to REJECTED with rejection reason recorded.`,
      });

      // Refresh payments list
      await fetchPayments();

      // Refresh bookings
      const { data: dbBookings } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbBookings) {
        setBookingsList(dbBookings.map((b: any) => ({
          id: b.id,
          reference: b.booking_reference,
          customer: b.lead_traveler_name || 'Traveler',
          email: b.lead_traveler_email || 'traveler@example.com',
          nationality: '🌍 International',
          tourTitle: 'Japan Voyage Tour Reservation',
          date: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '2026-11-20',
          gateway: b.payment_method ? b.payment_method.toUpperCase() : (b.charged_currency === 'PKR' ? 'PAKISTANI GATEWAY' : 'CARD'),
          amountJpy: Number(b.total_base_amount || 0),
          status: b.status === 'confirmed' ? 'Confirmed' : b.status === 'hold_pending_payment' ? 'Hold Pending' : b.status === 'cancelled_by_operator' ? 'Cancelled / Rejected' : b.status,
          isConfirmed: b.status === 'confirmed',
          rawStatus: b.status
        })));
      }

      if (action === 'reject') {
        setRejectingPayment(null);
        setRejectionReasonInput('');
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Verification error occurred.',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedbackMessage(null), 6000);
    }
  };

  // Filtered payments (Requirement 1)
  const filteredPayments = paymentsList.filter((p) => {
    // Provider filter
    if (paymentFilter !== 'all' && p.gateway_provider.toLowerCase() !== paymentFilter.toLowerCase()) {
      return false;
    }
    // Status filter (PENDING / PAID / REJECTED)
    if (statusFilter !== 'all') {
      const displayStatus = getDisplayPaymentStatus(p.status);
      if (displayStatus !== statusFilter) {
        return false;
      }
    }
    // Search query
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchTxn = p.gateway_transaction_id?.toLowerCase().includes(q);
      const matchRef = p.booking?.booking_reference?.toLowerCase().includes(q);
      const matchId = p.booking_id?.toLowerCase().includes(q);
      const matchName = p.booking?.lead_traveler_name?.toLowerCase().includes(q);
      const matchMobile = p.sender_mobile?.toLowerCase().includes(q);
      const matchSenderName = p.sender_name?.toLowerCase().includes(q);
      return matchTxn || matchRef || matchId || matchName || matchMobile || matchSenderName;
    }
    return true;
  });

  const pendingCount = paymentsList.filter(p => getDisplayPaymentStatus(p.status) === 'PENDING').length;
  const paidCount = paymentsList.filter(p => getDisplayPaymentStatus(p.status) === 'PAID').length;
  const rejectedCount = paymentsList.filter(p => getDisplayPaymentStatus(p.status) === 'REJECTED').length;
  const totalVerifiedPkr = paymentsList
    .filter(p => getDisplayPaymentStatus(p.status) === 'PAID')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Verified vs All bookings filtering (User requirement: only show admin-verified bookings in booking table)
  const displayedBookings = bookingFilter === 'confirmed'
    ? bookingsList.filter((b) => b.isConfirmed)
    : bookingsList;
  const confirmedBookingsCount = bookingsList.filter((b) => b.isConfirmed).length;
  const pendingDatabaseBookingsCount = bookingsList.filter((b) => !b.isConfirmed).length;
  const confirmedRevenueJpy = bookingsList.filter((b) => b.isConfirmed).reduce((sum, b) => sum + (b.amountJpy || 0), 0);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Admin Verified Status Banner */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl mb-6 font-semibold text-xs flex items-center justify-between shadow-md border border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Verified Administrator Session:</strong> Logged in as <span className="font-mono text-emerald-400">{adminEmail}</span>. Role-based server verification confirmed.
          </span>
        </div>
        <span className="hidden sm:inline bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-md uppercase font-extrabold tracking-wider">
          Super Admin
        </span>
      </div>

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Platform Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Japan Inbound Travel Operations • Pakistani Payments & Reservation Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-800 bg-emerald-100 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Pakistani Gateways: Easypaisa • JazzCash • Raast
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn shadow-sm ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-200' 
            : 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(confirmedRevenueJpy)}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              ¥{confirmedRevenueJpy.toLocaleString()} JPY Verified Revenue
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>PKR {totalVerifiedPkr.toLocaleString()} Verified Revenue</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{confirmedBookingsCount} Confirmed</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              {confirmedBookingsCount > 0 ? 'Admin-verified reservations' : 'No confirmed reservations yet'}
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-amber-600 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingDatabaseBookingsCount} Pending in Database Queue</span>
          </div>
        </div>

        {/* Pending Verifications Metric Card */}
        <div 
          onClick={() => setActiveTab('payments')}
          className={`rounded-2xl p-5 border shadow-sm cursor-pointer transition-all hover:scale-[1.01] ${
            pendingCount > 0 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40' 
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              pendingCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {pendingCount} PENDING
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Awaiting admin manual review
            </span>
          </div>
          <div className="mt-2.5 text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <span>Click to review proofs & approve</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{customers.length} Travelers</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Profiles in public.profiles</span>
          </div>
          <div className="mt-2.5 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Supabase Auth synchronized</span>
          </div>
        </div>

      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview & Trends
        </button>

        {/* Dedicated Payments Verification Tab */}
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Payment Verification ({paymentsList.length})</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {pendingCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tours')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tours'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-200'
          }`}
        >
          Manage Tours ({toursList.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Verified Bookings ({confirmedBookingsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'customers'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-200'
          }`}
        >
          Traveler Directory ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reviews'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-200'
          }`}
        >
          Review Moderation ({reviews.length})
        </button>
      </div>

      {/* TAB: MANUAL PAYMENT VERIFICATION SYSTEM (Requirements 1-10) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Top Payment Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
              <p className="text-xl font-black text-slate-900 mt-1">{paymentsList.length}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-sm">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                PENDING
              </span>
              <p className="text-xl font-black text-amber-900 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 shadow-sm">
              <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">PAID (Approved)</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{paidCount}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-300 shadow-sm">
              <span className="text-[11px] font-black text-rose-900 uppercase tracking-wider">REJECTED</span>
              <p className="text-xl font-black text-rose-900 mt-1">{rejectedCount}</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Payment Method Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Method:
              </span>
              <button
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  paymentFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Methods
              </button>
              <button
                onClick={() => setPaymentFilter('easypaisa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  paymentFilter === 'easypaisa' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Smartphone className="w-3 h-3" /> Easypaisa
              </button>
              <button
                onClick={() => setPaymentFilter('jazzcash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  paymentFilter === 'jazzcash' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <Smartphone className="w-3 h-3" /> JazzCash
              </button>
              <button
                onClick={() => setPaymentFilter('raast')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  paymentFilter === 'raast' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                <QrCode className="w-3 h-3" /> Raast
              </button>
            </div>

            {/* Status Filter & Search (Requirement 3: PENDING, PAID, REJECTED) */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Booking ID, TRX, Customer..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-100 text-xs rounded-lg border-none focus:ring-2 focus:ring-emerald-500 w-52 sm:w-64"
                />
              </div>

              <button
                onClick={fetchPayments}
                disabled={loadingPayments}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Refresh Payments Queue"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPayments ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Customer Payment Submissions Table (Requirements 1, 2, 3, 4, 5, 9) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Customer Payment Submissions ({filteredPayments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Manual verification queue. Only admin approvals will set status to PAID and confirm bookings.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Booking ID & Tour</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Payment Proof</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span className="font-bold text-sm text-slate-700 block">No Payment Submissions Found</span>
                        <span className="text-xs text-slate-400">
                          {paymentsList.length === 0 
                            ? 'When customers complete checkout via Easypaisa, JazzCash, or Raast, their submissions appear here.'
                            : 'No payments match the current filter or search criteria.'}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const displayStatus = getDisplayPaymentStatus(p.status);
                      const isPending = displayStatus === 'PENDING';
                      const isPaid = displayStatus === 'PAID';
                      const isRejected = displayStatus === 'REJECTED';
                      const bookingIdDisplay = p.booking?.booking_reference || p.booking_id;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Booking ID & Tour (Requirement 2) */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-slate-900 block text-xs">
                              {bookingIdDisplay}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-xs block font-medium">
                              {p.booking?.schedule?.tour_option?.tour?.title || 'Japan Voyage Tour'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              DB ID: {p.booking_id.slice(0, 8)}...
                            </span>
                          </td>

                          {/* 2. Customer Name (Requirement 2) */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {p.booking?.lead_traveler_name || p.sender_name || 'Traveler'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {p.sender_mobile || p.booking?.lead_traveler_phone || p.booking?.lead_traveler_email}
                            </div>
                            {p.sender_name && p.sender_name !== p.booking?.lead_traveler_name && (
                              <div className="text-[10px] text-slate-400">
                                Sender: {p.sender_name}
                              </div>
                            )}
                          </td>

                          {/* 3. Payment Method (Requirement 2) */}
                          <td className="py-3 px-4">
                            {p.gateway_provider.toLowerCase() === 'easypaisa' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Smartphone className="w-3 h-3 text-emerald-600" /> Easypaisa
                              </span>
                            )}
                            {p.gateway_provider.toLowerCase() === 'jazzcash' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                <Smartphone className="w-3 h-3 text-rose-600" /> JazzCash
                              </span>
                            )}
                            {p.gateway_provider.toLowerCase() === 'raast' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800 border border-orange-200">
                                <QrCode className="w-3 h-3 text-orange-600" /> Raast
                              </span>
                            )}
                            {!['easypaisa', 'jazzcash', 'raast'].includes(p.gateway_provider.toLowerCase()) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                {p.gateway_provider}
                              </span>
                            )}
                          </td>

                          {/* 4. Amount (Requirement 2) */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-slate-900 block text-xs">
                              PKR {Number(p.amount).toLocaleString()}
                            </span>
                            {p.currency && p.currency !== 'PKR' && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({p.currency} {Number(p.amount).toLocaleString()})
                              </span>
                            )}
                          </td>

                          {/* 5. Transaction ID (Requirement 2) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
                              <span>{p.gateway_transaction_id}</span>
                              <button
                                onClick={() => copyToClipboard(p.gateway_transaction_id)}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                                title="Copy Transaction ID"
                              >
                                {copiedTxn === p.gateway_transaction_id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 6. Payment Proof / Receipt (Requirement 3: View Receipt button) */}
                          <td className="py-3 px-4">
                            {p.proof_image_url ? (
                              <button
                                onClick={() => handleOpenReceipt(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 group"
                                title="Open secure receipt preview (Image or PDF)"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300" />
                                <span>View Receipt</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No receipt attached</span>
                            )}
                          </td>

                          {/* 7. Payment Status (Requirement 3: PENDING, PAID or REJECTED) */}
                          <td className="py-3 px-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                PENDING
                              </span>
                            )}
                            {isPaid && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                PAID
                              </span>
                            )}
                            {isRejected && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-rose-100 text-rose-900 border border-rose-300">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  REJECTED
                                </span>
                                {p.rejection_reason && (
                                  <span className="block text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={p.rejection_reason}>
                                    Reason: {p.rejection_reason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 8. Verification Actions (Requirements 4, 5, 6, 7, 9) */}
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                {/* Approve Payment Button (Requirement 4) */}
                                <button
                                  onClick={() => handleVerifyAction(p.id, 'approve')}
                                  disabled={actionLoading === p.id}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                                  title="Approve payment, mark as PAID and confirm booking"
                                >
                                  {actionLoading === p.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  )}
                                  <span>Approve Payment</span>
                                </button>

                                {/* Reject Payment Button (Requirement 5) */}
                                <button
                                  onClick={() => {
                                    setRejectingPayment(p);
                                    setRejectionReasonInput('');
                                  }}
                                  disabled={actionLoading === p.id}
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-rose-200"
                                  title="Reject payment submission with a rejection reason"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Reject Payment</span>
                                </button>
                              </div>
                            ) : (
                              /* Prevent duplicate payment approvals (Requirement 9) */
                              <div className="text-right">
                                {isPaid ? (
                                  <div>
                                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" /> Booking Confirmed
                                    </span>
                                    {p.verified_at && (
                                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                        Verified: {new Date(p.verified_at).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600" /> Booking Unconfirmed
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Monthly Booking Volume Breakdown (JPY)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Inbound bookings from international customers
              </p>

              <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 border-b border-slate-100">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">¥1.8M</span>
                  <div className="w-full bg-slate-200 rounded-t-lg h-24 hover:bg-red-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-500">Jul</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">¥2.4M</span>
                  <div className="w-full bg-slate-200 rounded-t-lg h-32 hover:bg-red-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-500">Aug</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">¥2.9M</span>
                  <div className="w-full bg-slate-200 rounded-t-lg h-36 hover:bg-red-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-500">Sep</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">¥3.6M</span>
                  <div className="w-full bg-red-600 rounded-t-lg h-44 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-900">Oct</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">¥3.2M</span>
                  <div className="w-full bg-slate-200 rounded-t-lg h-40 hover:bg-red-400 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-500">Nov</span>
                </div>
              </div>
            </div>

            {/* Recent Payments Quick Queue in Overview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pakistani Payment Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest submissions via Easypaisa, JazzCash, and Raast
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>View All ({paymentsList.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {paymentsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No payment submissions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentsList.slice(0, 4).map((p) => {
                    const displayStatus = getDisplayPaymentStatus(p.status);
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            p.gateway_provider.toLowerCase() === 'easypaisa' ? 'bg-emerald-100 text-emerald-800' :
                            p.gateway_provider.toLowerCase() === 'jazzcash' ? 'bg-rose-100 text-rose-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {p.gateway_provider[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {p.booking?.lead_traveler_name || p.sender_name || 'Traveler'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              TRX: {p.gateway_transaction_id} • Booking: {p.booking?.booking_reference || p.booking_id.slice(0, 8)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">
                            PKR {Number(p.amount).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            displayStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            displayStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {displayStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">
                System Health & Services
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-medium">
                  <span>Pakistani Payment Methods</span>
                  <span className="font-bold">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-medium">
                  <span>Supabase Database Schema</span>
                  <span className="font-bold">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-medium">
                  <span>Credit/Debit Card</span>
                  <span className="font-bold text-slate-500">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 font-medium">
                  <span>Email Notification</span>
                  <span className="font-bold">Ready</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-white">
                Quick Navigation
              </h3>
              <p className="text-xs text-slate-400">
                Jump directly to live customer-facing pages
              </p>
              <div className="space-y-2 pt-2">
                <Link
                  href="/tours"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
                >
                  <span>Explore Tours Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/account"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
                >
                  <span>Customer Account Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB: TOURS MANAGEMENT */}
      {activeTab === 'tours' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tours Catalog ({toursList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Manage active listings, pricing, and availability
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tour</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price (JPY)</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {toursList.map((tour) => (
                  <tr key={tour.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 relative">
                          <ImageWithFallback
                            src={tour.imageUrl}
                            alt={tour.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 line-clamp-1 max-w-xs">{tour.title}</span>
                          <span className="text-[11px] text-slate-400">{tour.duration}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{tour.destination}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                        {tour.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ¥{tour.priceJpy.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {tour.rating.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleTourStatus(tour.id)}
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase transition-colors ${
                          tour.isActive 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {tour.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/tours/${tour.slug}`}
                        className="text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BOOKINGS STREAM (Admin Verified Bookings by Default) */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Verified Customer Reservations</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {confirmedBookingsCount} Verified
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Only bookings verified and approved by the admin are listed here. Unverified / pending holds are stored safely in the database and reviewed in the Payment Verification tab.
              </p>
            </div>

            {/* Filter Toggle: Verified Only vs All Database Holds */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setBookingFilter('confirmed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                  bookingFilter === 'confirmed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified Only ({confirmedBookingsCount})
              </button>
              <button
                onClick={() => setBookingFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                  bookingFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Database Holds ({bookingsList.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Tour</th>
                  <th className="py-3 px-4">Departure Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span className="font-bold text-sm text-slate-700 block">
                        {bookingFilter === 'confirmed' 
                          ? 'No Admin-Verified Bookings Yet' 
                          : 'No Reservations Found in Database'}
                      </span>
                      <span className="text-xs text-slate-400 max-w-sm block mx-auto mt-1">
                        {bookingFilter === 'confirmed'
                          ? 'Bookings appear here only after an admin verifies their payment receipt in the Payment Verification tab.'
                          : 'Pending and confirmed customer reservations will show here.'}
                      </span>
                      {pendingCount > 0 && bookingFilter === 'confirmed' && (
                        <button
                          onClick={() => setActiveTab('payments')}
                          className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Review {pendingCount} Pending Payment Submission(s)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{b.reference}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.customer}</div>
                        <div className="text-[11px] text-slate-400">{b.nationality} • {b.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">{b.tourTitle}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{b.date}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                          {b.gateway}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatPrice(b.amountJpy)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          b.status === 'Confirmed' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : b.status === 'Hold Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.status === 'Confirmed' ? '✓ Verified / Confirmed' : b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              Registered International Travelers ({customers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Customer profiles registered across USA, UK, Europe, UAE, Pakistan, and Japan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Completed Bookings</th>
                  <th className="py-3 px-4">Lifetime Value</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.email}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.country}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.bookings} Tours</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatPrice(c.spentJpy)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        c.status === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            Customer Review Moderation ({reviews.length})
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Verified traveler feedback awaiting or published on tour detail pages
          </p>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{rev.author}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-red-600 font-semibold">{rev.tour}</span>
                  </div>
                  <div className="flex items-center text-amber-500 my-1">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700">{rev.comment}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    {rev.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECURE RECEIPT PREVIEW & DOWNLOAD MODAL (Requirements 4, 5, 6) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeReceipt.isPdf ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>Payment Receipt</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      activeReceipt.isPdf ? 'bg-red-500/30 text-red-300' : 'bg-emerald-500/30 text-emerald-300'
                    }`}>
                      {activeReceipt.isPdf ? 'PDF Document' : 'Image Receipt'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Ref: {activeReceipt.bookingReference || activeReceipt.bookingId?.slice(0, 8)} • TRX: {activeReceipt.transactionId}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Download & Open & Close (Requirement 5) */}
              <div className="flex items-center gap-2">
                {activeReceipt.signedUrl && (
                  <>
                    <a
                      href={`/api/admin/payments/receipt?paymentId=${activeReceipt.paymentId}&download=true`}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Download receipt file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </a>
                    <a
                      href={activeReceipt.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      title="Open full size in a new tab"
                    >
                      <span>Open Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content Preview Area (Requirement 4) */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-[320px]">
              {activeReceipt.isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs font-bold">Retrieving secure receipt from Supabase Storage...</span>
                </div>
              ) : activeReceipt.error ? (
                <div className="p-6 bg-red-950/50 border border-red-800 rounded-2xl text-center max-w-md">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-red-200 font-bold">{activeReceipt.error}</p>
                </div>
              ) : activeReceipt.signedUrl ? (
                activeReceipt.isPdf ? (
                  <div className="w-full h-[68vh] rounded-xl overflow-hidden bg-white">
                    <iframe
                      src={activeReceipt.signedUrl}
                      className="w-full h-full border-none"
                      title="PDF Payment Receipt"
                    />
                  </div>
                ) : (
                  <img
                    src={activeReceipt.signedUrl}
                    alt="Payment Receipt Screenshot"
                    className="max-h-[68vh] w-auto object-contain rounded-xl shadow-lg border border-slate-800"
                  />
                )
              ) : null}
            </div>

            {/* Modal Footer Info */}
            <div className="px-5 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/60">
              <div>
                Customer: <span className="text-white font-bold">{activeReceipt.customerName}</span>
              </div>
              <div className="font-mono text-emerald-400 font-bold">
                PKR {activeReceipt.amount?.toLocaleString()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL (Requirements 5, 7, 10) */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Reject Payment Submission</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Booking ID: {rejectingPayment.booking?.booking_reference || rejectingPayment.booking_id}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-medium">Customer: </span>
                <span className="font-bold text-slate-800">
                  {rejectingPayment.booking?.lead_traveler_name || rejectingPayment.sender_name || 'Traveler'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Amount: </span>
                <span className="font-mono font-bold text-slate-800">PKR {Number(rejectingPayment.amount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Transaction ID: </span>
                <span className="font-mono font-bold text-slate-800">{rejectingPayment.gateway_transaction_id}</span>
              </div>
            </div>

            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason (Required)*
            </label>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Transaction ID not found on bank/wallet portal, amount mismatch, or illegible receipt screenshot..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingPayment(null);
                  setRejectionReasonInput('');
                }}
                disabled={actionLoading === rejectingPayment.id}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyAction(rejectingPayment.id, 'reject', rejectionReasonInput)}
                disabled={actionLoading === rejectingPayment.id || !rejectionReasonInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 shadow-sm"
              >
                {actionLoading === rejectingPayment.id ? 'Processing...' : 'Confirm Payment Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
