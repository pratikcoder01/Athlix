'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Lock, Mail, Award, Shield, Smartphone, AlertCircle, User,
  ArrowRight, Eye, EyeOff, Sparkles, Trophy, Brain, Users
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';
import { cn } from '../../../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
type LoginFields = z.infer<typeof loginSchema>;

const featureList = [
  { icon: Trophy, label: 'Tournament Events', desc: 'Organizer-recorded brackets & results' },
  { icon: Brain, label: 'Experimental Kata Feedback', desc: 'Observed 2D pose metrics and limitations' },
  { icon: Shield, label: 'Professional Access', desc: 'Privileges require operator approval' },
  { icon: Users, label: 'Member Community', desc: 'Profiles and persisted text posts' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Google Authentication failed');
      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code !== 'auth/popup-closed-by-user') {
        setAuthError(e.message || 'Google Login failed.');
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    setAuthError(null);
    try {
      const cred = await signInAnonymously(auth);
      const idToken = await cred.user.getIdToken();
      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: 'Anonymous Athlete' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Anonymous Authentication failed');
      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setAuthError(e.message || 'Anonymous Login failed.');
    }
  };

  const onSubmit = async (data: LoginFields) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Authentication failed');
      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      const code = e.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Try again later.');
      } else {
        setAuthError(e.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center p-12 bg-surface border-r border-border">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-sm w-full"
        >
          <motion.div variants={fadeIn} className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold font-display tracking-tight text-text-primary">Athlix</span>
            </Link>
          </motion.div>

          <motion.blockquote
            variants={fadeIn}
            className="text-3xl lg:text-4xl font-extrabold font-display tracking-tight leading-tight text-text-primary mb-4"
          >
            &ldquo;It is not the critic who counts — the credit belongs to the man who is actually in the arena.&rdquo;
          </motion.blockquote>
          <motion.cite
            variants={fadeIn}
            className="block not-italic text-xs font-bold tracking-widest text-accent uppercase mb-10"
          >
            Theodore Roosevelt
          </motion.cite>

          <motion.div variants={stagger} className="space-y-3">
            {featureList.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background/60"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeIn} className="mt-8 flex items-center gap-2.5">
            <div className="flex -space-x-2">
              {[['SC', 'bg-orange-500'], ['MR', 'bg-blue-500'], ['EW', 'bg-green-500']].map(([av, bg], i) => (
                <div key={i} className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black border-2 border-background', bg)}>
                  {av}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Build your profile</span> and follow your training journey
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <motion.div variants={fadeIn} className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold font-display text-text-primary">Athlix</span>
          </motion.div>

          <motion.div variants={fadeIn} className="mb-8">
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-primary mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent hover:text-accent-light font-semibold transition-colors">
                Sign up free
              </Link>
            </p>
          </motion.div>

          <motion.form variants={stagger} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <motion.div variants={fadeIn}>
              <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeIn}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="login-password">Password</label>
                <Link href="/forgot-password" className="text-xs text-accent hover:text-accent-light font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </motion.div>

            {/* Error */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <p className="text-xs text-danger">{authError}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.div variants={fadeIn} className="pt-1">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-accent via-accent-light to-accent-gold text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={fadeIn} className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-text-tertiary font-medium">or continue with</span>
              </div>
            </motion.div>

            {/* Social */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                aria-label="Sign in with Google"
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-border bg-surface text-sm font-semibold text-text-primary hover:border-accent/30 hover:bg-surface-hover transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleAnonymousSignIn}
                aria-label="Sign in as guest"
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-border bg-surface text-sm font-semibold text-text-primary hover:border-accent/30 hover:bg-surface-hover transition-all duration-200"
              >
                <User className="w-4 h-4 text-text-tertiary" />
                Guest
              </button>
            </motion.div>

            {/* Phone link */}
            <motion.div variants={fadeIn} className="text-center">
              <Link
                href="/login/phone"
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors font-medium"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Sign in with phone number
              </Link>
            </motion.div>
          </motion.form>

          <p className="mt-8 text-xs text-text-tertiary text-center leading-relaxed">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-text-secondary transition-colors">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-text-secondary transition-colors">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
