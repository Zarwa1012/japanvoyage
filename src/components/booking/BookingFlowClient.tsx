'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  Users, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Sparkles, 
  QrCode, 
  Download, 
  ArrowLeft,
  AlertCircle,
  Timer,
  Copy,
  Check,
  Upload,
  FileCheck,
  FileText,
  Building2,
  PhoneCall,
  User,
  Info,
  ExternalLink
} from 'lucide-react';
import { MockTour } from '@/data/mockTours';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { PAKISTANI_PAYMENT_METHODS } from '@/config/paymentMethods';
import { downloadReceiptVoucher } from '@/lib/receiptDownload';

interface BookingFlowClientProps {
  tour: MockTour;
}

interface BookingHoldData {
  id: string;
  reference: string;
  status: string;
  expiresAt: string;
  chargedAmount: number;
  chargedCurrency: string;
  totalBaseJpy: number;
}

export function BookingFlowClient({ tour }: BookingFlowClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  // Get initial values from URL query if present
  const initialDate = searchParams?.get('date') || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  const initialOptionId = searchParams?.get('option') || tour.options[0]?.id || 'std';
  const initialAdults = parseInt(searchParams?.get('adults') || '2', 10);
  const initialChildren = parseInt(searchParams?.get('children') || '0', 10);

  // Booking Form State
  const [travelDate, setTravelDate] = useState(initialDate);
  const [selectedOptionId, setSelectedOptionId] = useState(initialOptionId);
  const { user, profile } = useAuth();
  const [adults, setAdults] = useState(isNaN(initialAdults) || initialAdults < 1 ? 1 : initialAdults);
  const [children, setChildren] = useState(isNaN(initialChildren) || initialChildren < 0 ? 0 : initialChildren);

  // Lead Traveler Info State (clean initial state, no dummy values)
  const [leadTraveler, setLeadTraveler] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+92',
    phoneNumber: '',
    nationality: 'Pakistan',
    specialRequests: '',
  });

  // Pre-fill from authenticated user profile if signed in
  useEffect(() => {
    if (user || profile) {
      setLeadTraveler((prev) => ({
        ...prev,
        firstName: prev.firstName || profile?.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || profile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user?.email || '',
      }));
    }
  }, [user, profile]);

  // Selected Payment Method: Focused exclusively on Pakistani methods + Card (Coming Soon)
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'raast' | 'card'>('easypaisa');

  // Submission & Hold State
  const [isSubmittingHold, setIsSubmittingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [bookingHold, setBookingHold] = useState<BookingHoldData | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins default

  // Manual Verification Form State
  const [senderName, setSenderName] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isReceiptPdf, setIsReceiptPdf] = useState(false);
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerificationSubmitted, setIsVerificationSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Calculations
  const selectedOption = tour.options.find(o => o.id === selectedOptionId) || tour.options[0];
  const unitPriceJpy = selectedOption ? selectedOption.priceJpy : tour.priceJpy;
  const childUnitPriceJpy = Math.round(unitPriceJpy * 0.7);
  const adultsSubtotalJpy = adults * unitPriceJpy;
  const childrenSubtotalJpy = children * childUnitPriceJpy;
  const totalAmountJpy = adultsSubtotalJpy + childrenSubtotalJpy;
  
  // PKR equivalent calculation (1 JPY ≈ 1.82 PKR standard rate)
  const totalAmountPkr = Math.round(totalAmountJpy * 1.82);

  // Countdown timer for seat hold
  useEffect(() => {
    if (!bookingHold) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setBookingHold(curr => curr ? { ...curr, status: 'expired' } : null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingHold]);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  const handleDownloadBookingReceipt = async () => {
    if (!bookingHold) return;
    setIsDownloadingReceipt(true);
    try {
      await downloadReceiptVoucher({
        bookingReference: bookingHold.reference,
        customerName: `${leadTraveler.firstName} ${leadTraveler.lastName}`.trim() || senderName || 'Traveler',
        customerEmail: leadTraveler.email,
        customerPhone: leadTraveler.phoneNumber || senderMobile,
        tourTitle: tour.title,
        destination: tour.destination,
        departureDate: travelDate,
        departureTime: '09:00 JST',
        totalParticipants: adults + children,
        adults,
        children,
        amountPkr: totalAmountPkr,
        amountJpy: totalAmountJpy,
        paymentMethod,
        transactionId: transactionId || 'Logged',
        senderName: senderName || `${leadTraveler.firstName} ${leadTraveler.lastName}`.trim(),
        senderMobile: senderMobile || leadTraveler.phoneNumber,
        status: isVerificationSubmitted ? 'pending' : 'hold',
      });
    } catch (err: any) {
      console.error('Download receipt error:', err);
      alert('Could not download receipt: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // Compress images in the browser so mobile photos (5MB-12MB) never exceed server limits
  const compressImage = async (file: File): Promise<File> => {
    if (file.type === 'application/pdf') return file;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1400;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Handle proof receipt upload (Image or PDF)
  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(rawFile.type.toLowerCase())) {
      setVerificationError('Invalid file format. Please upload an image (PNG, JPG, WEBP) or a PDF receipt document.');
      return;
    }

    if (rawFile.size > 15 * 1024 * 1024) {
      setVerificationError('File size exceeds the 15 MB limit. Please upload a smaller receipt.');
      return;
    }

    const isPdf = rawFile.type === 'application/pdf' || rawFile.name.toLowerCase().endsWith('.pdf');
    setIsReceiptPdf(isPdf);
    setVerificationError(null);

    if (isPdf) {
      setReceiptFile(rawFile);
      setProofFileName(rawFile.name);
      setProofImageBase64(null);
    } else {
      // Compress image to ensure fast upload under 500KB
      const compressed = await compressImage(rawFile);
      setReceiptFile(compressed);
      setProofFileName(rawFile.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageBase64(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    }
  };

  // Step 1: Create Seat Hold and persist booking in database
  const handleCreateBookingHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      alert('Credit/Debit Card gateway integration is currently in progress. Please choose Easypaisa, JazzCash, or Raast.');
      return;
    }

    setIsSubmittingHold(true);
    setHoldError(null);

    const participants = [
      {
        tier_type: 'adult',
        full_name: `${leadTraveler.firstName} ${leadTraveler.lastName}`.trim(),
        nationality: leadTraveler.nationality || 'Pakistan',
      },
    ];

    for (let i = 1; i < adults; i++) {
      participants.push({
        tier_type: 'adult',
        full_name: `Traveler Adult ${i + 1}`,
        nationality: leadTraveler.nationality || 'Pakistan',
      });
    }

    for (let j = 0; j < children; j++) {
      participants.push({
        tier_type: 'child',
        full_name: `Traveler Child ${j + 1}`,
        nationality: leadTraveler.nationality || 'Pakistan',
      });
    }

    try {
      // Call server API to register seat hold with status 'hold_pending_payment'
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourSlug: tour.slug,
          tourId: tour.id,
          optionId: selectedOptionId,
          travelDate,
          leadTraveler,
          participants,
          paymentMethod,
          chargedCurrency: 'PKR',
          chargedAmount: totalAmountPkr,
          totalBaseJpy: totalAmountJpy,
          exchangeRate: 1.82,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to initialize booking hold.');
      }

      setBookingHold({
        id: json.booking.id,
        reference: json.booking.reference,
        status: 'hold_pending_payment',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        chargedAmount: totalAmountPkr,
        chargedCurrency: 'PKR',
        totalBaseJpy: totalAmountJpy,
      });

      // Pre-fill sender details
      setSenderName(`${leadTraveler.firstName} ${leadTraveler.lastName}`.trim());
      setSenderMobile(leadTraveler.phoneNumber);
    } catch (err: any) {
      setHoldError(err.message || 'Could not hold seats. Please try again.');
    } finally {
      setIsSubmittingHold(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2: Submit Manual Payment Proof for Admin Verification
  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingHold) return;

    if (!transactionId.trim()) {
      setVerificationError('Transaction ID (TRX / TID / Reference number) is required.');
      setTimeout(() => {
        const el = document.getElementById('transactionIdInput') || document.getElementById('verification-error-bottom');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    if (!senderName.trim() || !senderMobile.trim()) {
      setVerificationError('Sender account title and mobile number are required.');
      setTimeout(() => {
        const el = document.getElementById('senderNameInput') || document.getElementById('verification-error-bottom');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setIsSubmittingProof(true);
    setVerificationError(null);

    try {
      const formData = new FormData();
      formData.append('bookingId', bookingHold.id);
      formData.append('bookingReference', bookingHold.reference);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      formData.append('senderName', senderName.trim());
      formData.append('senderMobile', senderMobile.trim());
      formData.append('amountPkr', totalAmountPkr.toString());
      if (customerNotes.trim()) {
        formData.append('customerNotes', customerNotes.trim());
      }
      if (receiptFile) {
        formData.append('receiptFile', receiptFile);
      } else if (proofImageBase64) {
        formData.append('receiptFileBase64', proofImageBase64);
        formData.append('receiptFileName', proofFileName || 'receipt.png');
      }

      const res = await fetch('/api/payments/submit-manual', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to submit payment receipt.');
      }

      setIsVerificationSubmitted(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const successEl = document.getElementById('verification-success-screen');
        if (successEl) {
          successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } catch (err: any) {
      setVerificationError(err.message || 'Error submitting payment verification.');
      setTimeout(() => {
        const errEl = document.getElementById('verification-error-bottom') || document.getElementById('verification-error-top');
        if (errEl) {
          errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const activePaymentConfig = PAKISTANI_PAYMENT_METHODS[paymentMethod] || PAKISTANI_PAYMENT_METHODS.easypaisa;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Top Breadcrumb Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href={`/tours/${tour.slug}`}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tour Details</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Pakistani Payment Gateway & Verification</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ========================================================================= */}
        {/* VIEW 2: PAYMENT & VERIFICATION SCREEN (ACTIVE ONCE SEATS ARE HELD)       */}
        {/* ========================================================================= */}
        {bookingHold ? (
          <div className={`${isVerificationSubmitted ? 'max-w-3xl' : 'max-w-5xl'} mx-auto space-y-6 transition-all duration-300`}>
            
            {/* If Payment Verification is Submitted: Dedicated Full Confirmation Screen */}
            {isVerificationSubmitted ? (
              <div id="verification-success-screen" className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
                
                {/* Animated Green Badge */}
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                    <span>Payment Proof Received</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Proof Submitted Successfully!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Thank you! Your payment verification details have been received by our finance desk. Your seats remain securely held while your transaction is confirmed.
                  </p>
                </div>

                {/* Reference & Summary Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Booking Reference
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-red-600">
                        {bookingHold.reference}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bookingHold.reference, 'ref')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm w-fit"
                    >
                      {copiedField === 'ref' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Reference</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Tour</span>
                      <span className="font-extrabold text-slate-900 line-clamp-1">{tour.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Amount Sent</span>
                      <span className="font-black text-emerald-700 text-sm">Rs {totalAmountPkr.toLocaleString()} PKR</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Channel</span>
                      <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">TRX ID / TID</span>
                      <span className="font-mono font-bold text-slate-800">{transactionId || 'Logged'}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Steps / SLA Box */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 text-left">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950 space-y-1">
                    <span className="font-bold text-sm block">Verification in Progress (Typical SLA: 5 – 15 Mins)</span>
                    <p className="text-slate-700 leading-relaxed">
                      Our finance desk is matching your transaction <strong>{transactionId}</strong> with our account statements. Once verified, your status will update to <strong className="text-emerald-700">Confirmed</strong> and your tour QR ticket voucher will be ready to download in your account.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadBookingReceipt}
                      disabled={isDownloadingReceipt}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloadingReceipt ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Generating Official Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Payment Receipt</span>
                        </>
                      )}
                    </button>
                    <Link
                      href="/account"
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-8 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>View My Bookings & Tickets</span>
                    </Link>
                    <Link
                      href="/tours"
                      className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <span>Explore More Tours</span>
                    </Link>
                  </div>
                  
                  <div>
                    <a
                      href="https://wa.me/923246465916"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline pt-2"
                    >
                      <span>Need instant confirmation? Contact Finance Desk on WhatsApp (+92 324 6465916)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            ) : (
              <>
                {/* Hold Status & Countdown Header */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Timer className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-red-700 bg-red-50 border border-red-200">
                            Seat Hold Active (15 Min)
                          </span>
                          <span className="text-xs font-mono font-black text-slate-700">
                            Ref: {bookingHold.reference}
                          </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                          Complete Your Payment Transfer
                        </h1>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-amber-50 text-amber-900 px-4 py-2.5 rounded-2xl border border-amber-200 shrink-0">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">Time Remaining</span>
                        <span className="font-mono text-base font-black text-amber-900 leading-none">
                          {formatCountdown(secondsRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Tour Experience</span>
                      <span className="font-extrabold text-slate-800 line-clamp-1">{tour.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Travel Date</span>
                      <span className="font-bold text-slate-800">{travelDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Party Size</span>
                      <span className="font-bold text-slate-800">{adults + children} Persons</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Total Payable</span>
                      <span className="font-black text-sm text-red-600">Rs {totalAmountPkr.toLocaleString()} PKR</span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Layout: Left = Official Account, Right = Submission Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (5 Cols): Payment Channel Details */}
                  <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          1
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Select Transfer Channel
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(['easypaisa', 'jazzcash', 'raast'] as const).map((methodKey) => {
                          const cfg = PAKISTANI_PAYMENT_METHODS[methodKey];
                          const isSelected = paymentMethod === methodKey;
                          return (
                            <button
                              key={methodKey}
                              type="button"
                              onClick={() => setPaymentMethod(methodKey)}
                              className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'border-red-600 bg-red-50/80 ring-2 ring-red-600 shadow-sm'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              <span className="font-black text-xs text-slate-900">{cfg.name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{cfg.badge}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Official Account Details */}
                    <div className={`p-4 rounded-2xl border ${activePaymentConfig.lightBg} ${activePaymentConfig.borderColor} space-y-3.5`}>
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${activePaymentConfig.textColor}`} />
                          <span className={`font-black text-xs ${activePaymentConfig.textColor}`}>
                            {activePaymentConfig.name} Transfer Info
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          Official Account
                        </span>
                      </div>

                      {/* Account Title */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Account Title:</span>
                        <span className="font-extrabold text-slate-900">{activePaymentConfig.accountTitle}</span>
                      </div>

                      {/* Account Number with 1-Click Copy */}
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            {paymentMethod === 'raast' ? 'Raast ID / Alias' : 'Account Number'}
                          </span>
                          <span className="font-mono text-sm sm:text-base font-black text-slate-900">
                            {activePaymentConfig.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activePaymentConfig.accountNumber, 'accNumber')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          {copiedField === 'accNumber' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* IBAN for Raast */}
                      {activePaymentConfig.iban && (
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                          <div className="overflow-hidden">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Raast IBAN</span>
                            <span className="font-mono text-[11px] font-black text-slate-900 break-all">
                              {activePaymentConfig.iban}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activePaymentConfig.iban!, 'iban')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ml-2"
                          >
                            {copiedField === 'iban' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Exact Payable PKR */}
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Exact Payable Amount</span>
                          <span className="font-mono text-base font-black text-red-600">
                            Rs {totalAmountPkr.toLocaleString()} PKR
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">({formatPrice(totalAmountJpy)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(totalAmountPkr.toString(), 'amount')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          {copiedField === 'amount' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Amount</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Step Instructions */}
                      <div className="text-xs text-slate-700 pt-1 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">How to send:</span>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-0.5 text-[11px]">
                          {activePaymentConfig.instructions.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {/* WhatsApp Desk Support */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <a
                        href="https://wa.me/923246465916"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline"
                      >
                        <span>Need live assistance? WhatsApp Desk (+92 324 6465916)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column (7 Cols): Payment Verification Form */}
                  <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl space-y-5">
                    <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                          2
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                            Submit Transaction Verification
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Enter sender details and TRX ID so the finance desk can approve your reservation.
                          </p>
                        </div>
                      </div>

                      {verificationError && (
                        <div id="verification-error-top" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{verificationError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Sender Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sender Account Title / Name <span className="text-red-600">*</span>
                          </label>
                          <input
                            id="senderNameInput"
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="e.g. Muhammad Ali"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                        </div>

                        {/* Sender Mobile */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sender Mobile Number <span className="text-red-600">*</span>
                          </label>
                          <input
                            id="senderMobileInput"
                            type="text"
                            value={senderMobile}
                            onChange={(e) => setSenderMobile(e.target.value)}
                            placeholder="e.g. 0300-1234567"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                        </div>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Transaction ID (TRX ID / TID / Reference Number) <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="transactionIdInput"
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 23849102941"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Found in your SMS receipt or banking app transfer details.
                        </span>
                      </div>

                      {/* Payment Receipt / Screenshot Upload (Image or PDF) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Upload Payment Receipt (Image or PDF)
                        </label>
                        
                        <div className="mt-1 flex justify-center px-4 pt-4 pb-5 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors min-h-[120px] items-center">
                          <div className="space-y-2 text-center w-full">
                            {receiptFile || proofImageBase64 ? (
                              <div className="flex flex-col items-center">
                                {isReceiptPdf ? (
                                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm w-full">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                      <p className="text-xs font-bold text-slate-900 truncate">
                                        {proofFileName || 'Receipt.pdf'}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        PDF Document • {receiptFile ? `${Math.round(receiptFile.size / 1024)} KB` : 'Uploaded'}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  proofImageBase64 && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={proofImageBase64}
                                      alt="Proof preview"
                                      className="max-h-32 rounded-lg border border-slate-200 shadow-sm mb-1.5 object-contain"
                                    />
                                  )
                                )}
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                                  <FileCheck className="w-4 h-4 text-emerald-600" />
                                  {proofFileName || 'Receipt selected'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptFile(null);
                                    setIsReceiptPdf(false);
                                    setProofImageBase64(null);
                                    setProofFileName(null);
                                  }}
                                  className="text-[11px] text-red-600 hover:underline font-bold mt-1"
                                >
                                  Remove & choose another
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-7 w-7 text-slate-400" />
                                <div className="flex text-xs text-slate-600 justify-center">
                                  <label
                                    htmlFor="proof-upload"
                                    className="relative cursor-pointer rounded-md font-extrabold text-red-600 hover:text-red-500 focus-within:outline-none"
                                  >
                                    <span>Upload payment screenshot or PDF receipt</span>
                                    <input
                                      id="proof-upload"
                                      name="proof-upload"
                                      type="file"
                                      accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                                      onChange={handleProofFileUpload}
                                      className="sr-only"
                                    />
                                  </label>
                                </div>
                                <p className="text-[10px] text-slate-400">PNG, JPG, WEBP, or PDF up to 15MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Customer Notes */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Additional Notes for Finance Desk (Optional)
                        </label>
                        <textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          rows={2}
                          placeholder="e.g. Sent from brother's Easypaisa account"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                      </div>

                      {/* Inline Error Notice directly above submit button */}
                      {verificationError && (
                        <div id="verification-error-bottom" className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs block">Verification Details Required</span>
                            <p>{verificationError}</p>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingProof}
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingProof ? (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Verifying & Submitting Proof...</span>
                          </span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Submit Payment Proof for Verification</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                </div>
              </>
            )}

          </div>
        ) : (

          /* ========================================================================= */
          /* VIEW 1: STANDARD CHECKOUT & PARTICIPANT DETAILS FORM                      */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 7 Cols: Details, Travelers & Payment */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">
                  Pakistan Inbound Tourism Checkout
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Review & Reserve Your Seats
                </h1>
              </div>

              {holdError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{holdError}</span>
                </div>
              )}

              <form onSubmit={handleCreateBookingHold} className="space-y-6">
                
                {/* 1. Date & Time Selection */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Date & Departure Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Travel Date
                      </label>
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Departure Option
                      </label>
                      <select
                        value={selectedOptionId}
                        onChange={(e) => setSelectedOptionId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {tour.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.title} ({opt.departureTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Participants Row */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adults (Age 12+)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-lg border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-slate-900">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Children (Age 4-11)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-lg border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-slate-900">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Lead Traveler Information */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Lead Traveler Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={leadTraveler.firstName}
                        onChange={(e) => setLeadTraveler({ ...leadTraveler, firstName: e.target.value })}
                        placeholder="e.g. Tariq"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={leadTraveler.lastName}
                        onChange={(e) => setLeadTraveler({ ...leadTraveler, lastName: e.target.value })}
                        placeholder="e.g. Khan"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={leadTraveler.email}
                        onChange={(e) => setLeadTraveler({ ...leadTraveler, email: e.target.value })}
                        placeholder="e.g. name@email.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Phone</label>
                      <input
                        type="tel"
                        value={leadTraveler.phoneNumber}
                        onChange={(e) => setLeadTraveler({ ...leadTraveler, phoneNumber: e.target.value })}
                        placeholder="e.g. 0324-1234567"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Requirements (Optional)</label>
                    <textarea
                      value={leadTraveler.specialRequests}
                      onChange={(e) => setLeadTraveler({ ...leadTraveler, specialRequests: e.target.value })}
                      rows={2}
                      placeholder="Dietary preferences, accessibility requirements, etc."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                {/* 3. Pakistani Payment Method Selection (Safepay Removed) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Select Payment Method
                      </h2>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Direct Pakistani payment transfer via mobile wallet or Raast
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    
                    {/* Easypaisa */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        paymentMethod === 'easypaisa'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          EP
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">Easypaisa</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Wallet
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Mobile Account Transfer</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'easypaisa' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'easypaisa' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    {/* JazzCash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        paymentMethod === 'jazzcash'
                          ? 'border-red-600 bg-red-50/50 ring-2 ring-red-600 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          JC
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">JazzCash</span>
                            <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Fast
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Mobile App & Retailer</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'jazzcash' ? 'border-red-600 bg-red-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'jazzcash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    {/* Raast */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('raast')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        paymentMethod === 'raast'
                          ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-600 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-700 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          R
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">Raast Instant</span>
                            <span className="text-[9px] bg-sky-100 text-sky-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Zero Fee
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Any Pakistani Bank App</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'raast' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'raast' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    {/* Credit / Debit Card (Temporarily Disabled - Coming Soon) */}
                    <div
                      className="p-4 rounded-xl border border-slate-200 bg-slate-100/60 text-left flex items-center justify-between opacity-70 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-700">Credit / Debit Card</span>
                            <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Coming Soon
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Visa, Mastercard (Under Integration)</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Inactive</span>
                    </div>

                  </div>
                </div>

                {/* Submit / Proceed to Payment Button */}
                <button
                  type="submit"
                  disabled={isSubmittingHold}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-red-600/30 text-base transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmittingHold ? (
                    <span>Reserving Seats on Departure...</span>
                  ) : (
                    <>
                      <span>Proceed to Payment (Rs {totalAmountPkr.toLocaleString()} PKR)</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right 5 Cols: Sticky Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 bg-white rounded-3xl border border-slate-200 shadow-lg p-6 space-y-6">
                
                {/* Tour Header Card */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative">
                    <ImageWithFallback
                      src={tour.imageUrl}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                      {tour.destination}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-0.5">
                      {tour.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tour.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Reservation Summary */}
                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Travel Date</span>
                    <span className="font-bold text-slate-900">{travelDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Departure Time</span>
                    <span className="font-bold text-slate-900">{selectedOption?.departureTime || '08:00 AM JST'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Option</span>
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">{selectedOption?.title}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Travelers</span>
                    <span className="font-bold text-slate-900">{adults} Adults{children > 0 ? `, ${children} Children` : ''}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{adults} × Adult</span>
                    <span className="font-bold text-slate-900">¥{adultsSubtotalJpy.toLocaleString()} JPY</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{children} × Child (30% off)</span>
                      <span className="font-bold text-slate-900">¥{childrenSubtotalJpy.toLocaleString()} JPY</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">Total Due:</span>
                      <span className="text-[11px] text-slate-400">JPY Base: ¥{totalAmountJpy.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-red-600">
                        Rs {totalAmountPkr.toLocaleString()} PKR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safe Traveler Badges */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free cancellation up to 24 hours before tour start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Instant payment confirmation after admin verification</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
