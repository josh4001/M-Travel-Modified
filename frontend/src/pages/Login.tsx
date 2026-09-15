import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { AuthVideoBackground } from '@/components/auth/AuthVideoBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const fillQuickCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <AuthVideoBackground
      title="Welcome Back"
      subtitle="Welcome back, explorer. Sign in to your M-TRAVEL account."
    >
      <div className="space-y-4">
        {/* HINT CHIPS FOR SYSTEM ACCOUNTS */}
        <div className="glass-card p-3 rounded-xl border border-white/10 text-xs space-y-1.5">
          <span className="text-[10px] text-marigold font-bold uppercase tracking-wider block font-mono">
            💡 Sample Registered Accounts (Click to Fill):
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => fillQuickCreds('sarah.ochieng@gmail.com', 'Tourist@2026')}
              className="rounded-lg bg-teal/10 border border-teal/30 px-2 py-1 text-teal hover:bg-teal/20 transition"
            >
              🧳 Tourist
            </button>
            <button
              type="button"
              onClick={() => fillQuickCreds('james.mwangi@mtravel.co.ke', 'Owner@2026')}
              className="rounded-lg bg-marigold/10 border border-marigold/30 px-2 py-1 text-marigold hover:bg-marigold/20 transition"
            >
              🚗 Car Owner
            </button>
            <button
              type="button"
              onClick={() => fillQuickCreds('safari@jambo.africa', 'Admin@2026')}
              className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-2 py-1 text-purple-300 hover:bg-purple-500/20 transition"
            >
              👑 Admin
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="glass-card-3d space-y-4 p-8 border border-white/20 shadow-2xl">
          {error && (
            <div className="rounded-xl bg-coral/15 border border-coral/30 px-4 py-3 text-sm text-coral flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-marigold" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="traveler@example.com"
                className="input-field pl-10 bg-ink-100/90 focus:border-marigold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-marigold" />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-field pl-10 pr-10 bg-ink-100/90 focus:border-marigold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-3.5 text-bone/40 hover:text-bone/80 transition"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                Authenticating…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In to M-TRAVEL <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-sm text-bone/70">
              New to M-TRAVEL?{' '}
              <Link to="/register" className="font-semibold text-marigold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthVideoBackground>
  );
}
