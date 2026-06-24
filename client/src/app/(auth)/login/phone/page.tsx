'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import { useAuthStore } from '../../../../store/authStore';
import MagneticButton from '../../../../components/shared/MagneticButton';
import SpotlightCard from '../../../../components/shared/SpotlightCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Step = 'phone' | 'otp' | 'role';

export default function PhoneLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach' | 'academy_owner' | 'tournament_organizer'>('athlete');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize invisible reCAPTCHA on mount
  useEffect(() => {
    if (!recaptchaContainerRef.current) return;
    if (recaptchaVerifierRef.current) return; // already set

    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      recaptchaContainerRef.current,
      {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, phone send will proceed
        },
      }
    );
    recaptchaVerifierRef.current.render();

    return () => {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    };
  }, []);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setAuthError(null);

    const e164 = phone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
      setAuthError('Enter a valid international phone number (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(
        auth,
        e164,
        recaptchaVerifierRef.current as ApplicationVerifier
      );
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send OTP. Try again.');
      // Reset reCAPTCHA on failure so it can be used again
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setAuthError(null);
    if (!confirmationResult) return;
    if (otp.length !== 6) {
      setAuthError('Enter the 6-digit code from your SMS');
      return;
    }

    setLoading(true);
    try {
      const firebaseUserCred = await confirmationResult.confirm(otp);
      const idToken = await firebaseUserCred.user.getIdToken();

      // Exchange Firebase ID token for ATHLIX JWT
      const res = await fetch(`${API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: name || 'Athlete', role }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Authentication failed');

      setAuth(json.user, json.token);
      router.push('/dashboard');
    } catch (err: any) {
      const code: string = err.code || '';
      if (code === 'auth/invalid-verification-code') {
        setAuthError('Incorrect code. Check your SMS and try again.');
      } else if (code === 'auth/code-expired') {
        setAuthError('Code expired. Please request a new one.');
        setStep('phone');
      } else {
        setAuthError(err.message || 'Verification failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background text-text-primary overflow-hidden">
      <div className="absolute inset-0 mat-grid opacity-20 pointer-events-none" />

      {/* Invisible reCAPTCHA container — required by Firebase */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      <div className="w-full max-w-md relative z-10">

        {/* Header nav */}
        <div className="mb-6 flex justify-between items-center font-mono text-[10px] font-bold">
          <Link
            href="/login"
            className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 uppercase"
          >
            <ArrowLeft className="h-4 w-4" /> BACK TO LOGIN
          </Link>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-text-primary uppercase">PHONE OTP</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">
            SIGN IN WITH<br />
            <span className="text-primary">PHONE NUMBER</span>
          </h2>
          <p className="text-text-secondary text-xs mt-2">
            {step === 'phone'
              ? 'Enter your phone number to receive a one-time verification code.'
              : 'Enter the 6-digit code sent to your phone.'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(['phone', 'otp'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === s || (step === 'otp' && s === 'phone')
                    ? 'bg-primary'
                    : 'bg-border'
                }`}
              />
            </React.Fragment>
          ))}
        </div>

        <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm shadow-xl">

          {/* ── Step 1: Phone Number ── */}
          {step === 'phone' && (
            <div className="flex flex-col gap-6">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Silva"
                  className="w-full bg-surface border border-border rounded-sm px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                  Platform Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'athlete', label: 'ATHLETE' },
                    { id: 'coach', label: 'COACH' },
                    { id: 'academy_owner', label: 'GYM OWNER' },
                    { id: 'tournament_organizer', label: 'ORGANIZER' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as typeof role)}
                      className={`py-2 text-[10px] font-bold font-mono tracking-wider border rounded-sm transition-all ${
                        role === r.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                  Phone Number (E.164 format)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-surface border border-border rounded-sm pl-11 pr-4 py-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans font-mono"
                  />
                </div>
                <span className="text-[9px] text-text-tertiary font-mono">
                  Include country code, e.g. +91 for India, +1 for US
                </span>
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-sm">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-[10px] text-primary font-mono font-bold uppercase">{authError}</span>
                </div>
              )}

              <MagneticButton
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md"
              >
                {loading ? 'SENDING CODE...' : 'SEND OTP'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>
            </div>
          )}

          {/* ── Step 2: OTP Entry ── */}
          {step === 'otp' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                    6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setAuthError(null); }}
                    className="text-[10px] font-mono font-bold text-primary hover:underline uppercase"
                  >
                    Change number
                  </button>
                </div>
                <p className="text-[10px] text-text-tertiary font-mono">
                  Code sent to <span className="text-text-secondary">{phone}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  className="w-full bg-surface border border-border rounded-sm px-4 py-4 text-xl text-text-primary focus:outline-none focus:border-primary transition-all font-mono text-center tracking-[0.75em]"
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-sm">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-[10px] text-primary font-mono font-bold uppercase">{authError}</span>
                </div>
              )}

              <MagneticButton
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md"
              >
                {loading ? 'VERIFYING...' : 'CONFIRM CODE'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
              </MagneticButton>
            </div>
          )}
        </SpotlightCard>

        <p className="text-center text-xs text-text-secondary font-mono mt-6 uppercase font-bold">
          Prefer email?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  );
}
