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
          <cite className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
            — THE MAN IN THE ARENA
          </cite>
        </div>

        <div className="relative z-10 flex gap-6 text-[10px] font-mono font-bold text-text-secondary uppercase">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> JWT SECURED</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> VERIFIED RATING</span>
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

              <MagneticButton
                type="submit"
                className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md mt-2"
              >
                {isSubmitting ? 'VERIFYING...' : 'LOGIN TO CONSOLE'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>
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
