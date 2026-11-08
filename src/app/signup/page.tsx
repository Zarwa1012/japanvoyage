'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  User, 
  Globe, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    needsConfirmation: boolean;
    email: string;
  } | null>(null);

  const supabase = createClient();

  // Handle Google OAuth Sign-up
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initiate Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to create an account.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            nationality: country,
            country: country,
            role: 'customer',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        // Auto-confirmed session exists
        router.refresh();
        router.push('/account');
      } else {
        // Confirmation email sent or awaiting confirmation
        setSuccessInfo({
          needsConfirmation: true,
          email: email.trim(),
        });
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete registration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
          
          {/* Header */}
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
              Create your account
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Join thousands of international travelers exploring Japan
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-black text-emerald-900">Account Created!</h2>
              <p className="text-xs text-emerald-700 leading-relaxed">
                We have registered your account for <strong>{successInfo.email}</strong>.
                {successInfo.needsConfirmation && (
                  <span className="block mt-1">
                    Please check your email inbox and confirm your registration link before signing in.
                  </span>
                )}
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Proceed to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 text-xs font-bold shadow-sm transition-all hover:border-slate-300 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">Or register with email</span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country of Residence *
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Germany">🇩🇪 Germany / Europe</option>
                    <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                    <option value="Pakistan">🇵🇰 Pakistan</option>
                    <option value="Japan">🇯🇵 Japan</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Other">🌐 Other International</option>
                  </select>
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password (min. 8 characters) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="text-xs pt-1">
                <label className="flex items-start gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 mt-0.5"
                  />
                  <span>
                    I agree to the <span className="text-red-600 font-semibold underline">Terms of Service</span> and <span className="text-red-600 font-semibold underline">Cancellation Rules</span>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-red-600/30 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
          )}

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-red-600 hover:text-red-700">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
