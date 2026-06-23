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
        bio: `${data.role.replace('_', ' ')} on ATHLIX platform.`
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
      {/* Left split pane: Animated Visual & Motivation */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-secondary overflow-hidden border-r border-border">
        <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-secondary-accent/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <span className="text-2xl font-extrabold tracking-wider font-display text-primary uppercase">
            ATHLIX<span className="text-secondary-accent font-bebas">.</span>
          </span>
        </div>

        <div className="relative z-10 my-auto">
          <blockquote className="text-4xl font-bold font-display uppercase tracking-wide leading-none max-w-lg mb-8">
            &ldquo;Suffer the pain of discipline or suffer the pain of regret.&rdquo;
          </blockquote>
          <cite className="text-sm font-bold tracking-widest text-primary uppercase font-mono">
            — ATHLIX FOUNDATION MOTTO
          </cite>
        </div>

        <div className="relative z-10 flex gap-8 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> JWT Encrypted</span>
          <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-gold" /> YC-Staged MVP</span>
        </div>
      </div>

      {/* Right split pane: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-4xl font-extrabold font-display uppercase tracking-wide">
              CREATE PROFILE
            </h2>
            <p className="text-text-secondary text-sm mt-2">
              Select your role and enter credentials to join the network.
            </p>
          </div>

          <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Your Platform Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'athlete', label: 'ATHLETE' },
                    { id: 'coach', label: 'COACH' },
                    { id: 'academy_owner', label: 'ACADEMY' },
                    { id: 'tournament_organizer', label: 'ORGANIZER' }
                  ].map((roleOption) => (
                    <button
                      key={roleOption.id}
                      type="button"
                      onClick={() => setValue('role', roleOption.id as "athlete" | "coach" | "academy_owner" | "tournament_organizer")}
                      className={`py-2 text-xs font-bold font-mono tracking-wider border rounded cursor-pointer transition-all ${
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
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full bg-surface border border-border rounded pl-11 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                    placeholder="e.g. John Doe"
                  />
                </div>
                {errors.name && (
                  <span className="text-xs text-primary font-bold mt-1">{errors.name.message}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-surface border border-border rounded pl-11 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-primary font-bold mt-1">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full bg-surface border border-border rounded pl-11 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
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
                {isSubmitting ? 'REGISTERING...' : 'REGISTER PROFILE'} <ChevronRight className="h-4 w-4 ml-1 inline" />
              </MagneticButton>
            </form>
          </SpotlightCard>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an ATHLIX profile?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
