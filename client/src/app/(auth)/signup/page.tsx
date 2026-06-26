'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Lock, Mail, ChevronRight, AlertCircle, Shield, Zap, Award, Trophy } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';
import MagneticButton from '../../../components/shared/MagneticButton';
import { GlassCard } from '../../../components/shared/GlassCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['athlete', 'coach', 'academy_owner', 'tournament_organizer']),
});

type SignupFields = z.infer<typeof signupSchema>;

const roles = [
  { id: 'athlete', label: 'Athlete', icon: Zap, desc: 'Track your journey' },
  { id: 'coach', label: 'Coach', icon: Shield, desc: 'Manage students' },
  { id: 'academy_owner', label: 'Gym Owner', icon: Award, desc: 'Run your academy' },
  { id: 'tournament_organizer', label: 'Organizer', icon: Trophy, desc: 'Host events' },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'athlete' },
  });

  const selectedRole = watch('role');

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const firebaseUserCred = await signInWithPopup(auth, provider);
      const idToken = await firebaseUserCred.user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: selectedRole }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Google Registration failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google Registration failed.');
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
        body: JSON.stringify({ idToken, name: 'Anonymous Athlete', role: selectedRole }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Anonymous Registration failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Anonymous Registration failed.');
    }
  };

  const onSubmit = async (data: SignupFields) => {
    setAuthError(null);
    try {
      const firebaseUserCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(firebaseUserCred.user, { displayName: data.name });
      const idToken = await firebaseUserCred.user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: data.name, role: data.role }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Registration failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      const code: string = err.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-text-primary">
      {/* Left: Branding Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-purple-500/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="Athlix Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-widest">ATHLIX<span className="text-accent">.</span></span>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-6"
          >
            &ldquo;Suffer the pain of discipline or suffer the pain of regret.&rdquo;
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-text-secondary text-sm"
          >
            Join thousands of athletes, coaches, and academy owners building their legacy on Athlix.
          </motion.p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[
            { icon: Shield, label: 'Encrypted Auth' },
            { icon: Award, label: 'Belt Tracking' },
            { icon: Trophy, label: 'Live Brackets' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Icon className="w-4 h-4 text-accent" /> {label}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Athlix Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black tracking-widest">ATHLIX<span className="text-accent">.</span></span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black tracking-tight mb-1">Create Account</h2>
            <p className="text-text-secondary text-sm mb-8">Select your role and join the platform.</p>
          </motion.div>

          <GlassCard padding="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 block">Your Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setValue('role', id as SignupFields['role'])}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selectedRole === id
                          ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                          : 'border-border hover:border-accent/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${selectedRole === id ? 'text-accent' : 'text-text-tertiary'}`} />
                      <p className={`text-sm font-bold ${selectedRole === id ? 'text-accent' : ''}`}>{label}</p>
                      <p className="text-[10px] text-text-tertiary">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    {...register('name')}
                    className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              {/* Auth error */}
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{authError}</p>
                </div>
              )}

              <MagneticButton type="submit" variant="premium" className="w-full justify-center">
                {isSubmitting ? 'Creating...' : 'Create Account'} <ChevronRight className="w-4 h-4 ml-1" />
              </MagneticButton>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-tertiary">or register with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold hover:border-accent/40 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleAnonymousSignIn}
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold hover:border-accent/40 transition-all"
                >
                  <User className="w-4 h-4 text-text-tertiary" />
                  Guest
                </button>
              </div>
            </form>
          </GlassCard>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
