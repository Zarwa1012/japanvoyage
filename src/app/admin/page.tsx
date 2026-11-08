'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, role, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-slate-500 font-bold text-sm">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span>Verifying administrator credentials...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Sign In Required</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              You must sign in with an administrator account to access platform operations.
            </p>
            <Link
              href="/login?redirectTo=/admin"
              className="inline-block w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Sign In as Administrator
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated but NOT an Admin (Regular customer)
  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase">
                403 Forbidden
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                Administrator Access Required
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You are signed in as <strong>{user.email}</strong>, which has{' '}
                <span className="text-slate-800 font-bold capitalize">{role}</span> permissions.
                Platform administration is strictly restricted to authorized operators.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Customer Traveler Account:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Normal customer accounts cannot access tour inventory controls or payment webhook records.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/account"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors text-center"
              >
                Go to My Account
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authorized Administrator View
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <main className="flex-grow">
        <AdminDashboardClient adminEmail={user.email || 'admin@japanvoyage.com'} />
      </main>
      <Footer />
    </div>
  );
}
