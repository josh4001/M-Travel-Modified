import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowRight, Lock, Mail, Eye, EyeOff, Crown, Sparkles,
  CheckCircle2, ShieldCheck, AlertCircle, Compass, Car
} from 'lucide-react';
import { login } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'TOURIST' | 'OWNER' | 'ADMIN' | null>(null);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const redirectUrl = searchParams.get('redirect') || (location.state as any)?.redirect;
  const reason = searchParams.get('reason');
  const isDeletedNotice = searchParams.get('deleted') === 'true';
  const isBookingNotice = reason === 'booking' || Boolean(redirectUrl) || Boolean((location.state as any)?.message);
  const bannerMessage = (location.state as any)?.message || 'Please sign in or create an account to complete your vehicle booking.';

  function redirectByRole(role: string) {
    if (redirectUrl && (role === 'TOURIST' || role === 'CUSTOMER' || !role)) {
      window.location.href = redirectUrl;
      return;
    }
    const r = role?.toUpperCase();
    if (r === 'ADMIN' || r === 'SUPER_ADMIN') window.location.href = '/dashboard/admin';
    else if (r === 'VEHICLE_OWNER' || r === 'OWNER' || r === 'HOST' || r === 'FLEET_HOST') window.location.href = '/dashboard/owner';
    else window.location.href = '/dashboard/tourist';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      sessionStorage.setItem('mt_just_logged_in', 'true');
      dispatch(setUser(data.user));
      redirectByRole(data.user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleSelect = (role: 'TOURIST' | 'OWNER') => {
    setSelectedRole((prev) => (prev === role ? null : role));
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-100/70 text-slate-900 font-sans flex items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] p-6 sm:p-7 text-slate-900">
          
          {/* CARD HEADER */}
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-slate-950 text-white shadow-xs mb-2.5">
              <Crown className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 mb-1">
                <Sparkles className="h-3 w-3 text-slate-900" />
                <span>M-Travel Bespoke Safaris</span>
              </div>
            </div>
            <h1 className="font-serif text-2xl font-extrabold text-slate-950 tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Sign in to manage itineraries, reservations &amp; fleet
            </p>
          </div>

          {/* ACCOUNT DELETION NOTICE BANNER */}
          {isDeletedNotice && (
            <div className="my-3.5 rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs text-slate-900 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-950 text-xs">Account Successfully Deleted</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Your account has been permanently erased. You are welcome to create a fresh account anytime.
                </p>
              </div>
            </div>
          )}

          {/* BOOKING INTENT NOTICE BANNER */}
          {isBookingNotice && (
            <div className="my-3.5 rounded-xl bg-slate-50 border border-slate-900 p-3 text-xs text-slate-900 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-950 text-xs">Sign In Required for Booking</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {bannerMessage}{' '}
                  <Link
                    to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}&reason=booking` : '/register'}
                    className="font-bold text-slate-950 underline hover:text-black"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT TYPE SELECTOR (ZERO CREDENTIAL AUTOFILL FOR PRIVACY & SECURITY) */}
          <div className="py-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Select Account Type
              </span>
              {selectedRole && (
                <span className="text-[10px] text-slate-900 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {selectedRole === 'TOURIST' ? 'Traveler Mode' : 'Fleet Host Mode'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('TOURIST')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  selectedRole === 'TOURIST'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <Compass className={`h-4 w-4 ${selectedRole === 'TOURIST' ? 'text-white' : 'text-slate-900'}`} />
                <span className="text-xs font-bold">Traveler</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('OWNER')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  selectedRole === 'OWNER'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <Car className={`h-4 w-4 ${selectedRole === 'OWNER' ? 'text-white' : 'text-slate-900'}`} />
                <span className="text-xs font-bold">Fleet Host</span>
              </button>
            </div>
          </div>

          {/* MAIN LOGIN FORM */}
          <form onSubmit={onSubmit} className="pt-3.5 space-y-3.5">
            {error && (
              <div className="rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-medium">{error}</span>
                  {error.toLowerCase().includes('deleted') && (
                    <div className="mt-1">
                      <Link to="/register" className="font-bold text-slate-950 underline hover:text-black inline-flex items-center gap-1">
                        Register a new account &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={
                    selectedRole === 'OWNER'
                      ? 'host@domain.com'
                      : selectedRole === 'TOURIST'
                      ? 'traveler@domain.com'
                      : 'your.email@domain.com'
                  }
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3.5 py-2.5 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-10 py-2.5 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-950 transition p-0.5 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Security Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-950 transition select-none font-medium">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-950 focus:ring-slate-950 accent-slate-950 cursor-pointer"
                />
                <span className="text-[11px]">Remember me</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-slate-700" /> SSL Encrypted
              </span>
            </div>

            {/* Submit Action */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold py-3 px-4 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest cursor-pointer border border-slate-900"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing In…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-extrabold">
                  Sign In <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {/* Footer Registration & Trust Badges */}
            <div className="border-t border-slate-100 pt-3.5 text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                New to M-TRAVEL?{' '}
                <Link
                  to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}&reason=booking` : '/register'}
                  className="font-bold text-slate-950 hover:underline"
                >
                  Sign Up
                </Link>
              </p>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <span>Daraja M-Pesa</span>
                <span>•</span>
                <span>PCI-DSS</span>
                <span>•</span>
                <span>24/7 Concierge</span>
              </div>

              <div className="pt-0.5">
                <Link
                  to="/admin/login"
                  className="text-[10px] text-slate-400 hover:text-slate-900 font-mono tracking-wider transition inline-flex items-center gap-1 font-semibold"
                >
                  <ShieldCheck className="h-3 w-3" /> Staff Portal
                </Link>
              </div>
            </div>
          </form>

        </div>
      </div>

      {/* FORGOT PASSWORD OTP MODAL */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
        onSuccessLogin={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
          setShowForgotPassword(false);
          setError(null);
        }}
      />
    </div>
  );
}
