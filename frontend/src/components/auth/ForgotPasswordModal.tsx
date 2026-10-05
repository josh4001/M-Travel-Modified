import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithOTP,
} from '@/lib/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessLogin?: (email: string) => void;
}

type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessLogin,
}) => {
  const [step, setStep] = useState<ResetStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail(initialEmail || '');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setInfoMsg('');
      setResendCooldown(0);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle individual OTP inputs
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // Pasted full OTP code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      digitRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  // 1. SUBMIT EMAIL TO SEND OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const clean = email.trim().toLowerCase();

    if (!clean || !clean.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetOTP(clean);
      setInfoMsg(res.message);
      setStep('OTP');
      setResendCooldown(60);
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. SUBMIT OTP CODE
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const code = otpDigits.join('');

    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    try {
      verifyPasswordResetOTP(email, code);
      setStep('PASSWORD');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. SUBMIT NEW PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type your password.');
      return;
    }

    setLoading(true);
    try {
      const code = otpDigits.join('');
      const res = await resetPasswordWithOTP(email, code, newPassword);
      setInfoMsg(res.message);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccessLogin) {
      onSuccessLogin(email.trim().toLowerCase());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 font-sans">
        
        {/* TOP BRAND BAR */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                M-TRAVEL Security
              </div>
              <div className="text-[11px] text-slate-400">
                Account Recovery Concierge
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STEP PROGRESS TRACKER */}
        {step !== 'SUCCESS' && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className={step === 'EMAIL' ? 'text-slate-950 font-bold' : ''}>
              1. Email
            </span>
            <span className="text-slate-300">→</span>
            <span className={step === 'OTP' ? 'text-slate-950 font-bold' : ''}>
              2. 6-Digit Code
            </span>
            <span className="text-slate-300">→</span>
            <span className={step === 'PASSWORD' ? 'text-slate-950 font-bold' : ''}>
              3. New Password
            </span>
          </div>
        )}

        <div className="p-6">
          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* INFO ALERT */}
          {infoMsg && step !== 'SUCCESS' && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-relaxed font-medium">{infoMsg}</div>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'EMAIL' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Forgot your password?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered M-TRAVEL email address. We will immediately dispatch a 6-digit verification code to your inbox.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="reset-email">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="traveler@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3.5 py-2.5 text-sm transition outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-950 text-white font-semibold py-2.5 text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-950 transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP INPUT */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Enter Verification Code
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We sent a 6-digit single-use code to <strong className="text-slate-900">{email}</strong>.
                </p>
              </div>

              {/* 6 Digit Square Boxes */}
              <div className="py-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (digitRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      className="w-11 h-12 text-center text-xl font-bold font-mono rounded-xl bg-slate-50 border border-slate-300 focus:border-slate-950 focus:bg-white text-slate-950 outline-none transition"
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full rounded-xl bg-slate-950 text-white font-semibold py-2.5 text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resend Action */}
              <div className="text-center pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <span>Didn't receive code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-slate-400">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="font-semibold text-slate-950 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Create New Password
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your code has been verified. Enter a secure new password for <strong className="text-slate-900">{email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-10 py-2.5 text-sm transition outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-950 transition p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-10 py-2.5 text-sm transition outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-950 transition p-0.5 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-950 text-white font-semibold py-2.5 text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save & Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="space-y-5 text-center py-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Your credentials for <strong className="text-slate-900">{email}</strong> have been saved. You can now log into your M-TRAVEL account with your new password.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full rounded-xl bg-slate-950 text-white font-semibold py-2.5 text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
