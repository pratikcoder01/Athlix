'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFields>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'auth/user-not-found') {
        // Security: don't leak whether email exists
        setSentEmail(data.email);
        setSent(true);
      } else {
        setAuthError('Failed to send reset link. Please try again.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div variants={fadeIn} className="flex items-center gap-2 mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-text-primary" />
            </div>
            <span className="text-xl font-extrabold font-display text-text-primary">Athlix</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {sent ? (
            /* ── Success ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-lg border border-border bg-surface p-8 text-center"
            >
              <div className="w-12 h-12 rounded-md border border-border bg-surface flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h2 className="text-2xl font-extrabold font-display text-text-primary mb-2">Check your inbox</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                If a Firebase password account exists for{' '}
                <span className="font-semibold text-text-primary">{sentEmail}</span>, a recovery link will arrive shortly. Check your spam folder.
                Legacy ATHLIX password accounts must first link a verified Firebase identity; this form cannot reset a legacy bcrypt password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:text-text-secondary underline underline-offset-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </motion.div>
          ) : (
            /* ── Form ── */
            <motion.div key="form" variants={stagger}>
              <motion.div variants={fadeIn} className="mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
                <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-primary mb-1.5">
                  Reset your password
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Enter your registered email and we&apos;ll send you a secure recovery link.
                </p>
              </motion.div>

              <motion.form
                variants={stagger}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <motion.div variants={fadeIn}>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="forgot-email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-md border border-border-strong bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-danger mt-1">{errors.email.message}</p>
                  )}
                </motion.div>

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

                <motion.div variants={fadeIn}>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={undefined}
                    whileTap={undefined}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-md font-semibold text-sm bg-accent text-accent-ink hover:bg-accent-hover transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none cursor-pointer mt-1"
                  >
                    {isSubmitting ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Reset Link</>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
