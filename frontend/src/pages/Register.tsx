import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowRight, Mail, Lock, Phone, User, Car, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { register } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { AuthVideoBackground } from '@/components/auth/AuthVideoBackground';

const ROLES = [
  {
    value: 'TOURIST',
    label: 'Tourist',
    description: 'Book safaris & vehicle hire',
    icon: User,
    color: 'teal',
  },
  {
    value: 'VEHICLE_OWNER',
    label: 'Fleet Host',
    description: 'List vehicles & earn rental income',
    icon: Car,
    color: 'marigold',
  },
  {
    value: 'ADMIN',
    label: 'System Admin',
    description: 'Platform control & fleet monitoring',
    icon: Shield,
    color: 'purple',
  },
] as const;

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TOURIST',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const redirectUrl = searchParams.get('redirect') || (location.state as any)?.redirect;
  const reason = searchParams.get('reason');
  const isBookingNotice = reason === 'booking' || Boolean(redirectUrl) || Boolean((location.state as any)?.message);

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
    <AuthVideoBackground
      title="Create Explorer Account"
      subtitle="Join East Africa's premier luxury transport & safari platform."
    >
      <div className="relative group w-full">
        {/* AMBIENT BACKLIGHT AURA */}
        <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-tr from-amber-500/25 via-amber-400/15 to-rose-500/20 blur-2xl opacity-80 group-hover:opacity-100 transition duration-700 -z-10" />

        <div className="relative rounded-[28px] bg-slate-950/85 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-amber-400/30">
          <form onSubmit={onSubmit} className="space-y-4">
            {isBookingNotice && (
              <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4 text-xs text-amber-200 flex items-start gap-3 shadow-lg">
                <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">Create Account to Complete Booking</h4>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    Fill out your profile details below to register. You will be returned right back to complete your vehicle booking immediately!
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  First Name
                </label>
                <input
                  id="reg-first-name"
                  required
                  placeholder="Juma"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 px-4 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Last Name
                </label>
                <input
                  id="reg-last-name"
                  required
                  placeholder="Mwangi"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 px-4 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="user@example.com"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 pl-10 pr-4 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Phone Number (M-Pesa)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="reg-phone"
                  placeholder="+254 7xx xxx xxx"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 pl-10 pr-4 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 pl-10 pr-11 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white transition p-0.5"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {ROLES.map((r) => {
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      id={`role-${r.value.toLowerCase()}`}
                      onClick={() => update('role', r.value)}
                      className={`rounded-xl border p-2.5 text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20 scale-[1.02]'
                          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <r.icon className="h-5 w-5" />
                      <span className="leading-tight">{r.label}</span>
                      <span className="text-[10px] font-normal text-slate-400 leading-tight hidden sm:block">{r.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="relative group/btn w-full mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 font-display">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Creating Account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-display font-extrabold">
                  Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              )}
            </button>

            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-xs text-slate-300">
                Already have an account?{' '}
                <Link
                  to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}&reason=booking` : '/login'}
                  className="font-bold text-amber-400 hover:text-amber-300 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </AuthVideoBackground>
  );
}
