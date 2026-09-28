import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { login, logout } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { AuthVideoBackground } from '@/components/auth/AuthVideoBackground';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const dispatch = useDispatch();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user.role?.toUpperCase();

      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        logout();
        throw new Error('Access Denied: This console is strictly reserved for M-Travel Management and Executive Administrators. Please use the public portal.');
      }

      sessionStorage.setItem('mt_just_logged_in', 'true');
      dispatch(setUser(data.user));
      window.location.href = '/dashboard/admin';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify your management credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const fillManagementCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setAutofilled(true);
    setError(null);
  };

  return (
    <AuthVideoBackground>
      <div className="relative group w-full max-w-md mx-auto">
        {/* AMBIENT BACKLIGHT AURA */}
        <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-tr from-purple-600/30 via-amber-500/20 to-indigo-600/30 blur-2xl opacity-90 transition duration-700 -z-10" />

        {/* LUXURY SMOKED GLASS CONSOLE */}
        <div className="relative rounded-[28px] bg-slate-950/90 backdrop-blur-2xl border border-purple-500/30 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-purple-400/30">
          {/* HEADER */}
          <div className="text-center pb-5 border-b border-white/10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-xl shadow-purple-600/30 mb-3 border border-purple-400/40">
              <ShieldCheck className="h-7 w-7 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-0.5 backdrop-blur-md mb-2">
                <Sparkles className="h-3 w-3 text-purple-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                  Authorized Personnel Only
                </span>
              </div>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Management Portal
            </h2>
            <p className="mt-1 text-xs text-slate-400 font-medium max-w-xs mx-auto">
              Corporate Governance, Fleet Oversight & Platform Financial Settlement Desk.
            </p>
          </div>

          {/* INTERNAL STAFF DEMONSTRATION ACCREDITATION */}
          <div className="py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1 font-mono">
                <KeyRound className="h-3 w-3" /> Management Credentials:
              </span>
              {autofilled && (
                <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Autofilled
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillManagementCreds('safari@jambo.africa', 'Admin@2026')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-400/20 bg-purple-950/30 text-center hover:bg-purple-900/30 hover:border-purple-400/40 transition"
              >
                <span className="text-[11px] font-bold text-white">Chief Admin</span>
                <span className="text-[9px] text-purple-300 font-mono">safari@jambo.africa</span>
              </button>

              <button
                type="button"
                onClick={() => fillManagementCreds('admin@mtravel.co.ke', 'Admin@2026')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-400/20 bg-purple-950/30 text-center hover:bg-purple-900/30 hover:border-purple-400/40 transition"
              >
                <span className="text-[11px] font-bold text-white">Operations Desk</span>
                <span className="text-[9px] text-purple-300 font-mono">admin@mtravel.co.ke</span>
              </button>
            </div>
          </div>

          {/* MAIN LOGIN FORM */}
          <form onSubmit={onSubmit} className="pt-4 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-400/30 px-4 py-3 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="admin-email">
                Management Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@mtravel.co.ke"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-purple-500/30 focus:border-purple-400 text-white placeholder:text-slate-500 pl-10 pr-4 py-3 text-sm transition outline-none focus:ring-2 focus:ring-purple-400/20 shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="admin-password">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-purple-500/30 focus:border-purple-400 text-white placeholder:text-slate-500 pl-10 pr-11 py-3 text-sm transition outline-none focus:ring-2 focus:ring-purple-400/20 shadow-inner font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition p-0.5"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="relative group/btn w-full mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 shadow-[0_10px_25px_-5px_rgba(147,51,234,0.4)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 font-display">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying Management Access…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-display font-extrabold">
                  Access Mission Control <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              )}
            </button>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 text-center space-y-2">
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-white transition underline"
              >
                ← Return to Public Website
              </Link>
              <div className="text-[10px] text-slate-500 font-mono">
                M-TRAVEL Platform Corporate Security • Session Monitored
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthVideoBackground>
  );
}
