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
    <div className="min-h-screen flex items-center justify-center p-8 bg-background text-text-primary">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/login" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> BACK TO LOGIN
          </Link>
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="ATHLIX Logo" className="h-6 w-auto object-contain" />
            <span className="text-xs font-bold font-mono text-primary uppercase">SECURITY</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-4xl font-extrabold font-display uppercase tracking-wide">
            ENTER NEW PASSWORD
          </h2>
          <p className="text-text-secondary text-sm mt-2">
            Establish a new password credentials for your platform user.
          </p>
        </div>

        <SpotlightCard className="bg-secondary p-8 border border-border shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">New Password</label>
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

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5.5 w-5.5 text-text-secondary" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full bg-surface border border-border rounded pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-primary font-bold mt-1">{errors.confirmPassword.message}</span>
              )}
            </div>

            <MagneticButton
              type="submit"
              className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm shadow-md"
            >
              {isSubmitting ? 'SAVING...' : 'UPDATE PASSWORD'} <ChevronRight className="h-4 w-4 ml-1 inline" />
            </MagneticButton>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
