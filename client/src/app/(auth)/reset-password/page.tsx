'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFields) => {
    alert('Password updated successfully!');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background text-text-primary overflow-hidden">
      {/* Fine background grid */}
      <div className="absolute inset-0 mat-grid opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 flex justify-between items-center font-mono text-[10px] font-bold">
          <Link href="/login" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 uppercase">
            <ArrowLeft className="h-4 w-4" /> BACK TO LOGIN
          </Link>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" className="fill-none stroke-current stroke-2" />
              <polygon points="12 6 18 10 18 14 12 18 6 14 6 10" />
            </svg>
            <span className="text-text-primary uppercase">SECURITY</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">
            ENTER NEW PASSWORD
          </h2>
          <p className="text-text-secondary text-xs mt-2">
            Establish new password credentials for your platform user.
          </p>
        </div>

        <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            
            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">New Password</label>
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-[10px] text-primary font-mono font-bold mt-1 uppercase">{errors.confirmPassword.message}</span>
              )}
            </div>

            <MagneticButton
              type="submit"
              className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md mt-2"
            >
              {isSubmitting ? 'SAVING...' : 'UPDATE PASSWORD'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
            </MagneticButton>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
