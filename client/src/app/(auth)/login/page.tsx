'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronRight, Award, Shield, Smartphone, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';
import MagneticButton from '../../../components/shared/MagneticButton';
import { GlassCard } from '../../../components/shared/GlassCard';

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
      const firebaseUserCred = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const idToken = await firebaseUserCred.user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Authentication failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
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
      <div className="relative hidden lg:flex flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-purple-500/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        
        <div className="relative z-10 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Athlix Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-widest">ATHLIX<span className="text-accent">.</span></span>
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-6"
          >
            &ldquo;It is not the critic who counts; not the man who points out how the strong man stumbles... The credit belongs to the man who is actually in the arena.&rdquo;
          </motion.blockquote>
          <motion.cite
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-bold tracking-widest text-accent uppercase font-mono block not-italic"
          >
            Theodore Roosevelt
          </motion.cite>
        </div>

        <div className="relative z-10 flex gap-6">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Shield className="h-4 w-4 text-accent" /> Firebase Auth
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Award className="h-4 w-4 text-accent" /> Verified Identity
          </span>
        </div>
      </div>

      {/* Right split pane: Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Athlix Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black tracking-widest">ATHLIX<span className="text-accent">.</span></span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black tracking-tight mb-1">Welcome Back</h2>
            <p className="text-text-secondary text-sm mb-8">Enter your credentials to access your console.</p>
          </motion.div>

          <GlassCard padding="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider block">Password</label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Auth error display */}
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{authError}</p>
                </div>
              )}

              <MagneticButton
                type="submit"
                variant="premium"
                className="w-full justify-center"
              >
                {isSubmitting ? 'Verifying...' : 'Login to Console'} <ChevronRight className="h-4 w-4 ml-1 inline" />
              </MagneticButton>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-tertiary">or login with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold hover:border-accent/40 transition-all cursor-pointer bg-transparent"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold hover:border-accent/40 transition-all cursor-pointer bg-transparent"
                >
                  <User className="h-4 w-4 text-text-tertiary" />
                  Guest
                </button>
              </div>

              {/* Phone OTP alternative */}
              <div className="text-center mt-2">
                <Link
                  href="/login/phone"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
                >
                  <Smartphone className="h-4 w-4" /> Sign in with phone number
                </Link>
              </div>
            </form>
          </GlassCard>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have a profile yet?{' '}
            <Link href="/signup" className="text-accent font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
