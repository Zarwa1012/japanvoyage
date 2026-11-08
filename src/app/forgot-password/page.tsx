'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch password reset request.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
          
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                日
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Japan<span className="text-red-600">Voyage</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Reset Your Password
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Enter your email and we’ll send a link to securely reset your password
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-base font-extrabold text-emerald-900">
                Reset Instructions Sent!
              </h2>
              <p className="text-xs text-emerald-700 leading-relaxed">
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched to your email address.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-red-600/30 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
