'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, ChevronRight, Award, Shield } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    try {
      // Mock authorization request call for MVP startup flow
      // Set default mock athlete context on successful login
      const mockUser = {
        id: 'usr_mock123',
        name: 'Pratik',
        email: data.email,
        role: 'athlete' as const,
        discipline: 'BJJ',
        beltRank: 'Purple',
        profileImage: '',
        bio: 'Startup Founder & Combat Sports Practitioner.'
      };
      
      setAuth(mockUser, 'mock_jwt_session_token_key');
      alert('Logged in successfully!');
      router.push('/dashboard');
    } catch (error) {
      alert('Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-text-primary">
      {/* Left split pane: Animated Visual & Motivation */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-secondary overflow-hidden border-r border-border">
        {/* Glow grid background */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-secondary-accent/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-2.5">
          <img src="/logo.png" alt="ATHLIX Logo" className="h-8 w-auto object-contain" />
          <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
            ATHLIX<span className="text-secondary-accent font-bebas">.</span>
          </span>
        </div>

        <div className="relative z-10 my-auto">
          <blockquote className="text-4xl font-bold font-display uppercase tracking-wide leading-none max-w-lg mb-8">
            &ldquo;IT IS NOT THE CRITIC WHO COUNTS; NOT THE MAN WHO POINTS OUT HOW THE STRONG MAN STUMBLES...&rdquo;
          </blockquote>
          <cite className="text-sm font-bold tracking-widest text-primary uppercase font-mono">
            — THE MAN IN THE ARENA
          </cite>
        </div>

        <div className="relative z-10 flex gap-8 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> JWT Encrypted</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-gold" /> YC-Staged MVP</span>
        </div>
      </div>

      {/* Right split pane: Login Form */}
      <div className="flex items-center justify-center p-8 sm:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src="/logo.png" alt="ATHLIX Logo" className="h-10 w-auto mb-4 lg:hidden" />
            <h2 className="text-4xl font-extrabold font-display uppercase tracking-wide">
              WELCOME TO ATHLIX
            </h2>
            <p className="text-text-secondary text-sm mt-2">
              Enter credentials to access your athlete dashboard and timelines.
            </p>
          </div>

          <SpotlightCard className="bg-secondary p-8 border border-border shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-primary font-bold mt-1">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <span className="text-xs text-primary font-bold mt-1">{errors.password.message}</span>
                )}
              </div>

              <MagneticButton
                type="submit"
                className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm shadow-md"
              >
                {isSubmitting ? 'VERIFYING...' : 'LOGIN TO THE ARENA'} <ChevronRight className="h-4 w-4 ml-1 inline" />
              </MagneticButton>
            </form>
          </SpotlightCard>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don&apos;t have an ATHLIX profile yet?{' '}
            <Link href="/signup" className="text-primary hover:underline font-bold">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
