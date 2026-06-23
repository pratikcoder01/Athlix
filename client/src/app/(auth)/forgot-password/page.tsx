'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    alert(`Reset link transmitted to: ${data.email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background text-text-primary">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/login" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> BACK TO LOGIN
          </Link>
          <span className="text-xs font-bold font-mono text-primary uppercase">ATHLIX SECURITY</span>
        </div>

        <div className="mb-8">
          <h2 className="text-4xl font-extrabold font-display uppercase tracking-wide">
            RESET PASSWORD
          </h2>
          <p className="text-text-secondary text-sm mt-2">
            Enter your registered email address to receive a secure recovery link.
          </p>
        </div>

        <SpotlightCard className="bg-secondary p-8 border border-border shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

            <MagneticButton
              type="submit"
              className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-md font-bebas tracking-widest text-sm shadow-md"
            >
              {isSubmitting ? 'TRANSMITTING...' : 'SEND RECOVERY LINK'} <ChevronRight className="h-4 w-4 ml-1 inline" />
            </MagneticButton>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
