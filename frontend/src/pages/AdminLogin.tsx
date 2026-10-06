import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck,
  Sparkles, KeyRound, CheckCircle2, AlertCircle
} from 'lucide-react';
import { login, logout } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CHIEF_ADMIN' | 'OPERATIONS' | null>(null);
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

  const handleRoleSelect = (role: 'CHIEF_ADMIN' | 'OPERATIONS') => {
    setSelectedRole(role);
    setError(null);
    // Explicitly do not autofill or paste credentials to ensure security and privacy
  };

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
                <span>Authorized Personnel Only</span>
              </div>
            </div>
            <h1 className="font-serif text-2xl font-extrabold text-slate-950 tracking-tight">
              Management Portal
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Corporate Governance, Fleet Oversight &amp; Clearing
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
                onClick={() => handleRoleSelect('CHIEF_ADMIN')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  selectedRole === 'CHIEF_ADMIN'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold">Chief Admin</span>
                <span className={`text-[9px] mt-0.5 font-medium ${selectedRole === 'CHIEF_ADMIN' ? 'text-slate-300' : 'text-slate-500'}`}>Executive Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('OPERATIONS')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  selectedRole === 'OPERATIONS'
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold">Operations Desk</span>
                <span className={`text-[9px] mt-0.5 font-medium ${selectedRole === 'OPERATIONS' ? 'text-slate-300' : 'text-slate-500'}`}>Fleet Operations</span>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 text-center font-medium">
              Please enter your assigned administrative credentials manually below.
            </p>
          </div>

          {/* MAIN LOGIN FORM */}
          <form onSubmit={onSubmit} className="pt-3.5 space-y-3.5">
            {error && (
              <div className="rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
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
                  placeholder="Enter management email"
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-950 text-slate-950 placeholder:text-slate-400 pl-9 pr-3.5 py-2.5 text-sm transition outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="admin-password">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
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

            {/* Submit Action */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold py-3 px-4 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest cursor-pointer border border-slate-900"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying Access…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-extrabold">
                  Access Mission Control <ArrowRight className="h-3.5 w-3.5" />
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
                M-TRAVEL Platform Corporate Security • Session Monitored
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
