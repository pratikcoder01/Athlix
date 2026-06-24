'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ChevronRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import MagneticButton from '../../../components/shared/MagneticButton';
import SpotlightCard from '../../../components/shared/SpotlightCard';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      const code: string = err.code || '';
      if (code === 'auth/user-not-found') {
        // For security, still show success — don't leak whether email exists
        setSentEmail(data.email);
        setSent(true);
      } else {
        setAuthError('Failed to send reset link. Please try again.');
      }
    }
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

        {sent ? (
          /* ── Success state ── */
          <SpotlightCard className="bg-secondary p-8 border border-border rounded-sm shadow-xl text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-black uppercase tracking-wide mb-2">Check Your Inbox</h2>
            <p className="text-text-secondary text-xs leading-relaxed">
              A password reset link was sent to{' '}
              <span className="text-primary font-bold">{sentEmail}</span>.
              Check your spam folder if it doesn&apos;t arrive within a minute.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary uppercase hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to login
            </Link>
          </SpotlightCard>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">
                RESET PASSWORD
              </h2>
              <p className="text-text-secondary text-xs mt-2">
                Enter your registered email address to receive a secure recovery link.
              </p>
            </div>

            <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm shadow-xl">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

                {authError && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-sm">
                    <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-[10px] text-primary font-mono font-bold uppercase">{authError}</span>
                  </div>
                )}

                <MagneticButton
                  type="submit"
                  className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md mt-2"
                >
                  {isSubmitting ? 'TRANSMITTING...' : 'SEND RECOVERY LINK'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
                </MagneticButton>
              </form>
            </SpotlightCard>
          </>
        )}
      </div>
    </div>
  );
}
