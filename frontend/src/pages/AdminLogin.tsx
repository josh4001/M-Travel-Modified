import { FormEvent, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowRight, Mail, ShieldCheck, Sparkles, KeyRound,
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Lock
} from 'lucide-react';
import { requestAdminLoginOTP, verifyAdminLoginOTP, logout } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';

export default function AdminLogin() {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CHIEF_ADMIN' | 'OPERATIONS' | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleSelect = (role: 'CHIEF_ADMIN' | 'OPERATIONS') => {
    setSelectedRole(role);
    setError(null);
    // Explicitly do not autofill or paste credentials to ensure security and privacy
  };

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your authorized management email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestAdminLoginOTP(email.trim(), selectedRole);
      setInfoMessage(res.message);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('OTP');
      setResendCooldown(60);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to dispatch one-time login code. Please verify your management email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await requestAdminLoginOTP(email.trim(), selectedRole);
      setInfoMessage(`A fresh 6-digit login code has been sent to ${res.recipientEmail}.`);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend one-time login code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpDigits(updated);
    setError(null);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the one-time login code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyAdminLoginOTP(email.trim(), code, selectedRole);
      const role = data.user.role?.toUpperCase();

      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        logout();
        throw new Error(
          'Access Denied: This console is strictly reserved for M-Travel Management and Executive Administrators.'
        );
      }

      sessionStorage.setItem('mt_just_logged_in', 'true');
      dispatch(setUser(data.user));
      window.location.href = '/dashboard/admin';
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'One-Time Login verification failed. Please check your code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-100/70 text-slate-900 font-sans flex items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] p-6 sm:p-7 text-slate-900">
          
          {/* CARD HEADER */}
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-slate-950 text-white shadow-xs mb-2.5">
              <ShieldCheck className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 mb-1">
                <Sparkles className="h-3 w-3 text-slate-900" />
                <span>Passwordless Admin OTP Gateway</span>
              </div>
            </div>
            <h1 className="font-serif text-2xl font-extrabold text-slate-950 tracking-tight">
              Management Portal
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Verified Admin-Only One-Time Email Authentication
            </p>
          </div>

          {/* ADMINISTRATIVE ROLES (ZERO CREDENTIAL AUTOFILL FOR PRIVACY & SECURITY) */}
          <div className="py-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-slate-900" /> Administrative Role
              </span>
              {selectedRole && (
                <span className="text-[10px] text-slate-900 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {selectedRole === 'CHIEF_ADMIN' ? 'Chief Admin' : 'Operations Desk'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={step === 'OTP'}
                onClick={() => handleRoleSelect('CHIEF_ADMIN')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  step === 'OTP' ? 'opacity-75 cursor-default' : 'cursor-pointer'
                } ${
                  selectedRole === 'CHIEF_ADMIN'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold">Chief Admin</span>
                <span className={`text-[9px] mt-0.5 font-medium ${selectedRole === 'CHIEF_ADMIN' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Executive Access
                </span>
              </button>

              <button
                type="button"
                disabled={step === 'OTP'}
                onClick={() => handleRoleSelect('OPERATIONS')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  step === 'OTP' ? 'opacity-75 cursor-default' : 'cursor-pointer'
                } ${
                  selectedRole === 'OPERATIONS'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold">Operations Desk</span>
                <span className={`text-[9px] mt-0.5 font-medium ${selectedRole === 'OPERATIONS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Fleet Operations
                </span>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 text-center font-medium">
              {step === 'EMAIL'
                ? 'Enter your authorized admin email to receive a single-use login code.'
                : 'Enter the 6-digit one-time code dispatched to your verified admin email.'}
            </p>
          </div>

          {/* STEP 1: REQUEST ONE-TIME LOGIN CODE */}
          {step === 'EMAIL' ? (
            <form onSubmit={handleRequestOtp} className="pt-3.5 space-y-3.5">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="admin-email">
                  Management Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter authorized admin email"
                    className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3.5 py-2.5 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-start gap-2 text-[11px] text-slate-600">
                <Lock className="h-3.5 w-3.5 text-slate-900 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-slate-900">Admin-Only Verification Gate:</strong> The system verifies administrative clearance before dispatching any code. Public user emails are strictly blocked.
                </span>
              </div>

              <button
                id="admin-request-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold py-3 px-4 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest cursor-pointer border border-slate-900"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying Admin Clearance…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-extrabold">
                    Send One-Time Login Code <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-3.5 text-center space-y-1.5">
                <Link
                  to="/"
                  className="text-xs text-slate-500 hover:text-slate-950 transition underline font-medium"
                >
                  ← Return to Public Website
                </Link>
                <div className="text-[10px] text-slate-400 font-mono">
                  M-TRAVEL Platform Corporate Security • Zero-Password OTP
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: ENTER 6-DIGIT ONE-TIME LOGIN CODE */
            <form onSubmit={handleVerifyOtp} className="pt-3.5 space-y-3.5">
              {infoMessage && !error && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{infoMessage}</span>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                <div className="truncate pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                    Verified Admin Email
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setOtpDigits(['', '', '', '', '', '']);
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-950 underline shrink-0 cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    6-Digit One-Time Code
                  </label>
                  <span className="text-[10px] font-mono font-semibold text-amber-700">
                    Valid for 10 mins
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-full h-11 text-center font-mono text-lg font-extrabold rounded-xl bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 outline-hidden focus:ring-1 focus:ring-slate-950 transition"
                      aria-label={`OTP digit ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                id="admin-verify-otp-btn"
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full mt-1.5 rounded-xl bg-slate-950 hover:bg-black disabled:opacity-50 text-white font-bold py-3 px-4 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest cursor-pointer border border-slate-900"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating Code…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-extrabold">
                    Verify OTP &amp; Access Mission Control <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500 text-[11px]">Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-[11px] font-bold text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1 cursor-pointer disabled:cursor-default"
                >
                  <RefreshCw className="h-3 w-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend New Code'}
                </button>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-3.5 text-center space-y-1.5">
                <Link
                  to="/"
                  className="text-xs text-slate-500 hover:text-slate-950 transition underline font-medium"
                >
                  ← Return to Public Website
                </Link>
                <div className="text-[10px] text-slate-400 font-mono">
                  M-TRAVEL Platform Corporate Security • Session Monitored
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
