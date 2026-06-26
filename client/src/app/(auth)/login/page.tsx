'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, ChevronRight, Award, Shield, Smartphone, AlertCircle, User } from 'lucide-react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const firebaseUserCred = await signInWithPopup(auth, provider);
      const idToken = await firebaseUserCred.user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Google Authentication failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google Login failed.');
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    setAuthError(null);
    try {
      const firebaseUserCred = await signInAnonymously(auth);
      const idToken = await firebaseUserCred.user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: 'Anonymous Athlete' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Anonymous Authentication failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Anonymous Login failed.');
    }
  };

  const onSubmit = async (data: LoginFields) => {
    setAuthError(null);
    try {
      // 1. Sign in with Firebase — validates email + password
      const firebaseUserCred = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // 2. Get a short-lived Firebase ID token
      const idToken = await firebaseUserCred.user.getIdToken();

      // 3. Exchange for an ATHLIX JWT (creates MongoDB record if first sign-in)
      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Authentication failed');

      // 4. Persist auth state (survives page refresh via Zustand persist)
      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      // Map Firebase error codes to readable messages
      const code: string = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Try again later.');
      } else {
        setAuthError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-text-primary">
      
      {/* Left split pane: Branding & Motivation */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-secondary overflow-hidden border-r border-border">
        {/* Fine background grid */}
        <div className="absolute inset-0 mat-grid opacity-30" />
        
        <div className="relative z-10 flex items-center gap-2.5">
          <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
            <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
          </svg>
          <span className="text-xl font-display font-black tracking-widest text-text-primary uppercase">
            ATHLIX<span className="text-primary">.</span>
          </span>
        </div>

        <div className="relative z-10 my-auto">
          <blockquote className="text-3xl font-display font-black uppercase tracking-wide leading-tight max-w-lg mb-6">
            &ldquo;IT IS NOT THE CRITIC WHO COUNTS; NOT THE MAN WHO POINTS OUT HOW THE STRONG MAN STUMBLES...&rdquo;
          </blockquote>
          <cite className="text-xs font-bold tracking-widest text-primary uppercase font-mono block">
            — Theodore Roosevelt
          </cite>
          <span className="text-[10px] font-mono text-text-tertiary block mt-1 uppercase tracking-wider">
            The Man in the Arena
          </span>
        </div>

        <div className="relative z-10 flex gap-6 text-[10px] font-mono font-bold text-text-secondary uppercase">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Firebase Auth</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> Verified Identity</span>
        </div>
      </div>

      {/* Right split pane: Login Form */}
      <div className="flex items-center justify-center p-8 sm:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4 lg:hidden">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
                <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
              </svg>
              <span className="text-md font-display font-black tracking-widest text-text-primary uppercase">
                ATHLIX<span className="text-primary">.</span>
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">
              WELCOME BACK
            </h2>
            <p className="text-text-secondary text-xs mt-2">
              Enter credentials to access your athlete dashboard and scheduling console.
            </p>
          </div>

          <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-primary font-mono font-bold mt-1 uppercase">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <label className="uppercase tracking-widest text-text-secondary">Password</label>
                  <Link href="/forgot-password" className="text-primary hover:underline uppercase">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <span className="text-[10px] text-primary font-mono font-bold mt-1 uppercase">{errors.password.message}</span>
                )}
              </div>

              {/* Auth error display */}
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-sm">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-[10px] text-primary font-mono font-bold uppercase">{authError}</span>
                </div>
              )}

              <MagneticButton
                type="submit"
                className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md mt-2"
              >
                {isSubmitting ? 'VERIFYING...' : 'LOGIN TO CONSOLE'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="px-3 text-[10px] font-mono font-bold text-text-secondary uppercase">OR</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 py-2.5 border border-border bg-surface text-text-primary text-[10px] font-mono font-bold uppercase rounded-sm hover:border-primary transition-all cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleAnonymousSignIn}
                  className="flex items-center justify-center gap-2 py-2.5 border border-border bg-surface text-text-primary text-[10px] font-mono font-bold uppercase rounded-sm hover:border-primary transition-all cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-text-secondary" />
                  Guest
                </button>
              </div>

              {/* Phone OTP alternative */}
              <div className="text-center">
                <Link
                  href="/login/phone"
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-text-secondary hover:text-primary transition-colors uppercase"
                >
                  <Smartphone className="h-3.5 w-3.5" /> Sign in with phone number
                </Link>
              </div>
            </form>
          </SpotlightCard>

          <p className="text-center text-xs text-text-secondary font-mono mt-8 uppercase font-bold">
            Don&apos;t have a profile yet?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
