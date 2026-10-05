import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowRight, Mail, Lock, Phone, User, Car, Eye, EyeOff,
  AlertCircle, Crown, Sparkles, Compass
} from 'lucide-react';
import { register } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';

const ROLES = [
  {
    value: 'TOURIST',
    label: 'Traveler (Tourist)',
    description: 'Book safari expeditions & luxury car hire',
    icon: Compass,
  },
  {
    value: 'VEHICLE_OWNER',
    label: 'Fleet Host',
    description: 'List vehicles & earn rental income',
    icon: Car,
  },
] as const;

export default function Register() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const redirectUrl = searchParams.get('redirect') || (location.state as any)?.redirect;
  const reason = searchParams.get('reason');
  const roleParam = searchParams.get('role');
  const isBookingNotice = reason === 'booking' || Boolean(redirectUrl) || Boolean((location.state as any)?.message);
  const bannerMessage = (location.state as any)?.message || 'Fill out your profile details below to register as a traveler. You will be returned right back to complete your reservation immediately!';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: roleParam?.toUpperCase() === 'VEHICLE_OWNER' ? 'VEHICLE_OWNER' : 'TOURIST',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await register(form);
      sessionStorage.setItem('mt_just_logged_in', 'true');
      dispatch(setUser(data.user));
      redirectByRole(data.user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-100/70 text-slate-900 font-sans flex items-center justify-center px-4 py-6 relative">
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] p-5 sm:p-7 text-slate-900">
          
          {/* CARD HEADER */}
          <div className="text-center pb-3.5 border-b border-slate-100">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-950 text-white shadow-xs mb-2">
              <Crown className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 mb-1">
                <Sparkles className="h-3 w-3 text-slate-900" />
                <span>M-Travel VIP Membership</span>
              </div>
            </div>
            <h1 className="font-serif text-2xl font-extrabold text-slate-950 tracking-tight">
              Create Your Account
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Join East Africa's premier luxury transport &amp; safari network
            </p>
          </div>

          {/* BOOKING INTENT NOTICE BANNER */}
          {isBookingNotice && (
            <div className="my-3 rounded-xl bg-slate-50 border border-slate-900 p-3 text-xs text-slate-900 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-950 text-xs">Register to Complete Booking</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {bannerMessage}
                </p>
              </div>
            </div>
          )}

          {/* MAIN FORM */}
          <form onSubmit={onSubmit} className="pt-3 space-y-3">
            {error && (
              <div className="rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Role selector */}
            {isBookingNotice ? (
              <div className="rounded-xl border border-slate-900 bg-slate-50 p-2.5 flex items-center justify-between text-xs text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-950 text-white flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 block text-xs">Explorer / Traveler Account</span>
                    <span className="text-[10px] text-slate-500">Required to complete reservation</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-900 font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                  Pre-selected
                </span>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => {
                    const active = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        id={`role-${r.value.toLowerCase()}`}
                        onClick={() => update('role', r.value)}
                        className={`rounded-xl border p-2 text-center transition-all duration-200 flex flex-col items-center gap-0.5 text-xs font-semibold cursor-pointer ${
                          active
                            ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <r.icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-900'}`} />
                          <span>{r.label}</span>
                        </div>
                        <span className={`text-[10px] font-normal leading-tight hidden sm:block ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                          {r.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reg-first-name">
                  First Name
                </label>
                <input
                  id="reg-first-name"
                  required
                  placeholder="Juma"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 px-3 py-2 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reg-last-name">
                  Last Name
                </label>
                <input
                  id="reg-last-name"
                  required
                  placeholder="Mwangi"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 px-3 py-2 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="user@example.com"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3 py-2 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reg-phone">
                Phone Number (M-Pesa)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="reg-phone"
                  placeholder="+254 7xx xxx xxx"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3 py-2 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-10 py-2 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium font-mono"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-950 transition p-0.5 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold py-2.5 sm:py-3 px-4 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest cursor-pointer border border-slate-900"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-extrabold">
                  Create Account <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {/* Footer Links & Trust Badges */}
            <div className="border-t border-slate-100 pt-3 text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                Already have an account?{' '}
                <Link
                  to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}&reason=booking` : '/login'}
                  className="font-bold text-slate-950 hover:underline"
                >
                  Sign in
                </Link>
              </p>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <span>Daraja M-Pesa</span>
                <span>•</span>
                <span>PCI-DSS</span>
                <span>•</span>
                <span>24/7 Concierge</span>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
