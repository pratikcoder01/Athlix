'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Mail, ChevronRight, Award, Shield } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['athlete', 'coach', 'academy_owner', 'tournament_organizer']),
});

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'athlete' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFields) => {
    try {
      const mockUser = {
        id: 'usr_mock' + Math.floor(Math.random() * 1000),
        name: data.name,
        email: data.email,
        role: data.role,
        discipline: 'BJJ',
        beltRank: 'White',
        profileImage: '',
        bio: `${data.role.replace('_', ' ')} on ATHLIX.`
      };
      
      setAuth(mockUser, 'mock_jwt_session_token_key');
      alert('Account registered successfully!');
      router.push('/dashboard');
    } catch (error) {
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-text-primary">
      
      {/* Left split pane: Motivation */}
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
            &ldquo;SUFFER THE PAIN OF DISCIPLINE OR SUFFER THE PAIN OF REGRET.&rdquo;
          </blockquote>
          <cite className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
            — ATHLIX MOTTO
          </cite>
        </div>

        <div className="relative z-10 flex gap-6 text-[10px] font-mono font-bold text-text-secondary uppercase">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> SECURE JWT</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> DIRECT CALENDARS</span>
        </div>
      </div>

      {/* Right split pane: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
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
              CREATE PROFILE
            </h2>
            <p className="text-text-secondary text-xs mt-2">
              Select your platform role and enter credentials to join.
            </p>
          </div>

          <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Platform Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'athlete', label: 'ATHLETE' },
                    { id: 'coach', label: 'COACH' },
                    { id: 'academy_owner', label: 'GYM OWNER' },
                    { id: 'tournament_organizer', label: 'ORGANIZER' }
                  ].map((roleOption) => (
                    <button
                      key={roleOption.id}
                      type="button"
                      onClick={() => setValue('role', roleOption.id as "athlete" | "coach" | "academy_owner" | "tournament_organizer")}
                      className={`py-2 text-[10px] font-bold font-mono tracking-wider border rounded-sm cursor-pointer transition-all ${
                        selectedRole === roleOption.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {roleOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary font-sans"
                    placeholder="e.g. John Doe"
                  />
                </div>
                {errors.name && (
                  <span className="text-[10px] text-primary font-mono font-bold mt-1 uppercase">{errors.name.message}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary font-sans"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-primary font-mono font-bold mt-1 uppercase">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary font-sans"
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
                {isSubmitting ? 'REGISTERING...' : 'REGISTER PROFILE'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>
            </form>
          </SpotlightCard>

          <p className="text-center text-xs text-text-secondary font-mono mt-6 uppercase font-bold">
            Already have an ATHLIX profile?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
