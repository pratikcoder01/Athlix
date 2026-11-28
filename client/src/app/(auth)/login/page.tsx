'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Lock, Mail, Shield, Smartphone, AlertCircle, User,
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
import { withSessionLock } from '../../../lib/authSession';


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
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
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

  const exchangeIdentity = (body: { idToken: string; name?: string }, errorMessage: string) => withSessionLock(async () => {
    const res = await fetch('/api/auth/firebase', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || errorMessage);
    setAuth(json.user, json.token);
    router.push('/dashboard');
  });

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await exchangeIdentity({ idToken }, 'Google Authentication failed');
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
      await exchangeIdentity({ idToken, name: 'Anonymous Athlete' }, 'Anonymous Authentication failed');
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
      await exchangeIdentity({ idToken }, 'Authentication failed');
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
    <main className="min-h-screen bg-background flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center p-12 bg-surface border-r border-border">


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
              <div className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-text-primary" />
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
            className="block not-italic text-xs font-bold tracking-widest text-text-secondary uppercase mb-10 font-mono"
          >
            Theodore Roosevelt
          </motion.cite>

          <motion.div variants={stagger} className="space-y-3">
            {featureList.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="flex items-center gap-4 p-3.5 rounded-md border border-border bg-background/60"
              >
                <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeIn} className="mt-8 flex items-center gap-2.5">
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
            <div className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-text-primary" />
            </div>
            <span className="text-xl font-extrabold font-display text-text-primary">Athlix</span>
          </motion.div>

          <motion.div variants={fadeIn} className="mb-8">
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-primary mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-text-primary hover:text-text-secondary underline underline-offset-4 font-semibold transition-colors">
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
                  autoComplete="username"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-border-strong bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeIn}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="login-password">Password</label>
                <Link href="/forgot-password" className="text-xs text-text-primary hover:text-text-secondary underline underline-offset-4 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-md border border-border-strong bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
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
                className="flex items-center gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-md"
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
                whileHover={undefined}
                whileTap={undefined}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-md font-semibold text-sm bg-accent text-accent-ink hover:bg-accent-hover transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
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
                className="flex items-center justify-center gap-2 py-3 rounded-md border border-border-strong bg-surface text-sm font-semibold text-text-primary hover:border-accent/30 hover:bg-surface-hover transition-colors duration-150"
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
                className="flex items-center justify-center gap-2 py-3 rounded-md border border-border-strong bg-surface text-sm font-semibold text-text-primary hover:border-accent/30 hover:bg-surface-hover transition-colors duration-150"
              >
                <User className="w-4 h-4 text-text-tertiary" />
                Guest
              </button>
            </motion.div>

            {/* Phone link */}
            <motion.div variants={fadeIn} className="text-center">
              <Link
                href="/login/phone"
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
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
    </main>
  );
}
