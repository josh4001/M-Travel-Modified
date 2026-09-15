import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowRight, Lock, Mail, Eye, EyeOff, Crown, Sparkles, KeyRound, CheckCircle2, ShieldCheck, AlertCircle, Compass, Car } from 'lucide-react';
import { login } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { AuthVideoBackground } from '@/components/auth/AuthVideoBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'TOURIST' | 'OWNER' | 'ADMIN' | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function redirectByRole(role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') navigate('/dashboard/admin');
    else if (role === 'VEHICLE_OWNER') navigate('/dashboard/owner');
    else navigate('/dashboard/tourist');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      dispatch(setUser(data.user));
      redirectByRole(data.user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const fillQuickCreds = (e: string, p: string, role: 'TOURIST' | 'OWNER' | 'ADMIN') => {
    setEmail(e);
    setPassword(p);
    setSelectedRole(role);
    setError(null);
  };

  return (
    <AuthVideoBackground>
      <div className="relative group w-full">
        {/* AMBIENT BACKLIGHT AURA */}
        <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-tr from-amber-500/25 via-amber-400/15 to-rose-500/20 blur-2xl opacity-80 group-hover:opacity-100 transition duration-700 -z-10" />

        {/* LUXURY SMOKED GLASS CONSOLE */}
        <div className="relative rounded-[28px] bg-slate-950/85 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-amber-400/30">
          {/* CARD HEADER WITH GOLD CREST */}
          <div className="text-center pb-5 border-b border-white/10">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 mb-3">
              <Crown className="h-6 w-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="block">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-0.5 backdrop-blur-md mb-2">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Signature Concierge Access
                </span>
              </div>
            </div>
            <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-1 text-xs text-slate-300 font-medium max-w-xs mx-auto">
              Sign in to your bespoke African safari itineraries, private fleet & reservations.
            </p>
          </div>

          {/* VIP DEMONSTRATION QUICK-ACCESS PILLS */}
          <div className="py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Quick VIP Demonstration Portals:
              </span>
              {selectedRole && (
                <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Autofilled
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCreds('sarah.ochieng@gmail.com', 'Tourist@2026', 'TOURIST')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  selectedRole === 'TOURIST'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Compass className="h-4 w-4 text-amber-400 mb-1" />
                <span className="text-[11px] font-bold">Traveler</span>
                <span className="text-[9px] text-slate-400 font-mono">Sarah O.</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCreds('james.mwangi@mtravel.co.ke', 'Owner@2026', 'OWNER')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  selectedRole === 'OWNER'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Car className="h-4 w-4 text-amber-400 mb-1" />
                <span className="text-[11px] font-bold">Fleet Host</span>
                <span className="text-[9px] text-slate-400 font-mono">James M.</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCreds('safari@jambo.africa', 'Admin@2026', 'ADMIN')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 scale-[1.02]'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Crown className="h-4 w-4 text-amber-400 mb-1" />
                <span className="text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">Safari Desk</span>
              </button>
            </div>
          </div>

          {/* MAIN LOGIN FORM */}
          <form onSubmit={onSubmit} className="pt-4 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="traveler@example.com"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 pl-10 pr-4 py-3 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="login-password">
                  Password
                </label>
                <a
                  href="https://wa.me/254791888840?text=Hello%20M-Travel,%20I%20need%20assistance%20with%20my%20password"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
                >
                  Concierge Recovery?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/20 focus:border-amber-400 text-white placeholder:text-slate-400 pl-10 pr-11 py-3 text-sm transition outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition p-0.5"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Security Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950 cursor-pointer"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 256-Bit SSL
              </span>
            </div>

            {/* Submit Action */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="relative group/btn w-full mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] text-xs uppercase tracking-widest"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 font-display">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Authenticating Credentials…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-display font-extrabold">
                  Sign In to M-TRAVEL <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              )}
            </button>

            {/* Footer Registration & Trust Badges */}
            <div className="border-t border-white/10 pt-4 text-center space-y-3">
              <p className="text-xs text-slate-300">
                New to M-TRAVEL?{' '}
                <Link to="/register" className="font-bold text-amber-400 hover:text-amber-300 hover:underline">
                  Create Bespoke Explorer Account
                </Link>
              </p>

              <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 font-medium">
                <span>Official Safaricom Daraja</span>
                <span>•</span>
                <span>PCI-DSS Secured</span>
                <span>•</span>
                <span>24/7 VIP Concierge</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthVideoBackground>
  );
}
