'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, ChevronRight, AlertCircle } from 'lucide-react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import { useAuthStore } from '../../../../store/authStore';
import { withSessionLock } from '../../../../lib/authSession';
import MagneticButton from '../../../../components/shared/MagneticButton';
import SpotlightCard from '../../../../components/shared/SpotlightCard';


type Step = 'phone' | 'otp';
type Operation = { controller: AbortController };

function phoneAuthError(error: unknown, fallback: string): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid international phone number, including its country code.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many requests. Please wait before requesting another code.';
    case 'auth/network-request-failed':
      return 'Connection failed. Check your connection and try again.';
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'Phone verification could not start. Please try again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Check your SMS and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
    case 'auth/invalid-verification-id':
    case 'auth/missing-verification-id':
      return 'Code expired. Please request a new one.';
    default:
      return fallback;
  }
}

export default function PhoneLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const mountedRef = useRef(false);
  const operationRef = useRef<Operation | null>(null);
  const verifiedUserRef = useRef<FirebaseUser | null>(null);

  // Verification starts only after an explicit request for a code. Cleanup also
  // invalidates continuations that Firebase itself cannot cancel.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current?.controller.abort();
      operationRef.current = null;
      verifiedUserRef.current = null;
      const verifier = recaptchaVerifierRef.current;
      recaptchaVerifierRef.current = null;
      verifier?.clear();
    };
  }, []);

  const isCurrent = (operation: Operation) => mountedRef.current && operationRef.current === operation;

  const beginOperation = (): Operation | null => {
    if (!mountedRef.current || operationRef.current) return null;
    const operation = { controller: new AbortController() };
    operationRef.current = operation;
    setAuthError(null);
    setLoading(true);
    return operation;
  };

  const finishOperation = (operation: Operation) => {
    if (!isCurrent(operation)) return;
    operationRef.current = null;
    setLoading(false);
  };

  const clearVerifier = (verifier: RecaptchaVerifier | null) => {
    if (!verifier || recaptchaVerifierRef.current !== verifier) return;
    recaptchaVerifierRef.current = null;
    verifier.clear();
  };

  const handleChangeNumber = () => {
    operationRef.current?.controller.abort();
    operationRef.current = null;
    clearVerifier(recaptchaVerifierRef.current);
    setLoading(false);
    verifiedUserRef.current = null;
    setCodeVerified(false);
    setConfirmationResult(null);
    setStep('phone');
    setSentPhone('');
    setOtp('');
    setAuthError(null);
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (operationRef.current) return;
    setAuthError(null);

    const e164 = phone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
      setAuthError('Enter a valid international phone number (e.g. +919876543210)');
      return;
    }
    if (name.trim().length > 100) {
      setAuthError('Enter a name of 100 characters or fewer.');
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    verifiedUserRef.current = null;
    setCodeVerified(false);
    setConfirmationResult(null);
    let verifier: RecaptchaVerifier | null = null;
    try {
      if (!recaptchaContainerRef.current) throw new Error('Phone verification is unavailable');
      verifier = recaptchaVerifierRef.current ?? new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible' });
      recaptchaVerifierRef.current = verifier;
      await verifier.render();
      if (!isCurrent(operation)) return;
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      if (!isCurrent(operation)) return;
      setConfirmationResult(result);
      setSentPhone(e164);
      setOtp('');
      setStep('otp');
    } catch (error: unknown) {
      if (!isCurrent(operation)) return;
      // clear() destroys the instance. The next attempt creates a fresh one.
      clearVerifier(verifier);
      setAuthError(phoneAuthError(error, 'Failed to send a code. Please try again or use email.'));
    } finally {
      finishOperation(operation);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (operationRef.current) return;
    setAuthError(null);
    if (!confirmationResult) return;
    if (!verifiedUserRef.current && otp.length !== 6) {
      setAuthError('Enter the 6-digit code from your SMS');
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    try {
      let firebaseUser = verifiedUserRef.current;
      if (!firebaseUser) {
        const firebaseUserCred = await confirmationResult.confirm(otp);
        if (!isCurrent(operation)) return;
        firebaseUser = firebaseUserCred.user;
        verifiedUserRef.current = firebaseUser;
        setCodeVerified(true);
      }
      // A successful confirmation consumes the SMS session. Transport retries
      // must reuse this verified identity, rather than consume the code again.
      const idToken = await firebaseUser.getIdToken();
      if (!isCurrent(operation)) return;

      // Cookie writes share the renewal/logout lock. A canceled attempt may
      // have waited in its queue, so check ownership again before dispatch.
      await withSessionLock(async () => {
        if (!isCurrent(operation)) return;
        const timeout = setTimeout(() => operation.controller.abort(), 15_000);
        try {
          const res = await fetch('/api/auth/firebase', {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: operation.controller.signal,
            body: JSON.stringify({ idToken, name: name.trim() || 'Athlete' }),
          });
          if (!isCurrent(operation)) return;

          const json = await res.json();
          if (!isCurrent(operation)) return;
          if (!res.ok) throw new Error('Authentication failed');

          setAuth(json.user, json.token);
          router.push('/dashboard');
        } finally {
          clearTimeout(timeout);
        }
      });
    } catch (error: unknown) {
      if (!isCurrent(operation)) return;
      setAuthError(phoneAuthError(error, 'Sign-in could not be completed. Please try again or use email.'));
      if (typeof error === 'object' && error !== null && 'code' in error &&
        ['auth/code-expired', 'auth/session-expired', 'auth/invalid-verification-id', 'auth/missing-verification-id'].includes(String(error.code))) {
        clearVerifier(recaptchaVerifierRef.current);
        verifiedUserRef.current = null;
        setCodeVerified(false);
        setConfirmationResult(null);
        setOtp('');
        setSentPhone('');
        setStep('phone');
      }
    } finally {
      finishOperation(operation);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 sm:p-8 bg-background text-text-primary overflow-hidden">
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
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-wide">
            SIGN IN WITH<br />
            <span className="text-primary">PHONE NUMBER</span>
          </h1>
          <p className="text-text-secondary text-xs mt-2">
            {step === 'phone'
              ? 'Enter your phone number to receive a one-time verification code.'
              : 'Enter the 6-digit code sent to your phone.'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(['phone', 'otp'] as Step[]).map(s => (
            <React.Fragment key={s}>
              <div
                className={`h-1 flex-1 transition-colors ${
                  step === s || (step === 'otp' && s === 'phone')
                    ? 'bg-accent'
                    : 'bg-border'
                }`}
              />
            </React.Fragment>
          ))}
        </div>

        <SpotlightCard className="bg-secondary p-6 sm:p-8 border border-border rounded-sm">

          {/* ── Step 1: Phone Number ── */}
          {step === 'phone' && (
            <div className="flex flex-col gap-6">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="phone-name" className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                  Your Name
                </label>
                <input
                  id="phone-name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lucas Vianna"
                  className="w-full bg-surface border border-border-strong rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                />
              </div>

              <p className="text-xs leading-relaxed text-text-secondary">
                New accounts start as athletes. Existing accounts keep their reviewed access permissions.
              </p>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label htmlFor="phone-number" className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                  Phone Number (E.164 format)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                  <input
                    id="phone-number"
                    type="tel"
                    autoComplete="tel"
                    disabled={loading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-surface border border-border-strong rounded-md pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all font-sans font-mono"
                  />
                </div>
                <span className="text-[10px] text-text-tertiary font-mono">
                  Include country code, e.g. +91 for India, +1 for US
                </span>
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-sm">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-danger font-mono font-medium">{authError}</span>
                </div>
              )}

              <MagneticButton
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-accent-ink py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase"
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
                  <label htmlFor="phone-otp" className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
                    6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-[10px] font-mono font-bold text-primary hover:underline uppercase"
                  >
                    Change number
                  </button>
                </div>
                <p className="text-[10px] text-text-tertiary font-mono">
                  Code sent to <span className="text-text-secondary">{sentPhone}</span>
                </p>
                <input
                  id="phone-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  disabled={loading || codeVerified}
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  className="w-full bg-surface border border-border-strong rounded-md px-4 py-4 text-xl text-text-primary focus:outline-none focus:border-primary transition-all font-mono text-center tracking-[0.75em]"
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-sm">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-danger font-mono font-medium">{authError}</span>
                </div>
              )}

              <MagneticButton
                onClick={handleVerifyOtp}
                disabled={loading || (!codeVerified && otp.length !== 6)}
                className="w-full bg-accent hover:bg-accent-hover text-accent-ink py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase"
              >
                {loading ? 'VERIFYING...' : codeVerified ? 'COMPLETE SIGN-IN' : 'CONFIRM CODE'} <ChevronRight className="h-4.5 w-4.5 ml-1 inline" />
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
    </main>
  );
}
