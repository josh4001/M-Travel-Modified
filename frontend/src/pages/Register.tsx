import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowRight, Mail, Lock, Phone, User, Car, Shield, Eye, EyeOff } from 'lucide-react';
import { register } from '@/lib/authService';
import { setUser } from '@/store/slices/authSlice';
import { AuthVideoBackground } from '@/components/auth/AuthVideoBackground';

const ROLES = [
  {
    value: 'TOURIST',
    label: '🧳 Tourist / Traveler',
    description: 'Book safaris & vehicle hire',
    icon: User,
    color: 'teal',
  },
  {
    value: 'VEHICLE_OWNER',
    label: '🚗 Car Owner',
    description: 'List vehicles & earn rental income',
    icon: Car,
    color: 'marigold',
  },
  {
    value: 'ADMIN',
    label: '👑 System Admin',
    description: 'Platform control & vehicle monitoring',
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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function redirectByRole(role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') navigate('/dashboard/admin');
    else if (role === 'VEHICLE_OWNER') navigate('/dashboard/owner');
    else navigate('/dashboard/tourist');
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
      title="Create Your Account"
      subtitle="Join thousands of travelers discovering East Africa with M-TRAVEL."
    >
      <form onSubmit={onSubmit} className="glass-card-3d space-y-4 p-8 border border-white/20 shadow-2xl">
        {error && (
          <div className="rounded-xl bg-coral/15 border border-coral/30 px-4 py-3 text-sm text-coral flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">
              First Name
            </label>
            <input
              id="reg-first-name"
              required
              placeholder="Juma"
              className="input-field bg-ink-100/90"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">
              Last Name
            </label>
            <input
              id="reg-last-name"
              required
              placeholder="Mwangi"
              className="input-field bg-ink-100/90"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-marigold" />
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              placeholder="user@example.com"
              className="input-field pl-10 bg-ink-100/90"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">
            Phone Number (M-Pesa)
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-teal" />
            <input
              id="reg-phone"
              placeholder="+254 7xx xxx xxx"
              className="input-field pl-10 bg-ink-100/90"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-marigold" />
            <input
              id="reg-password"
              type={showPw ? 'text' : 'password'}
              minLength={6}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className="input-field pl-10 pr-10 bg-ink-100/90"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
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

        {/* Role selector — card style */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-bone/80">
            Account Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const active = form.role === r.value;
              const colorMap: Record<string, string> = {
                teal: 'border-teal/60 bg-teal/15 text-teal',
                marigold: 'border-marigold/60 bg-marigold/15 text-marigold',
                purple: 'border-purple-500/60 bg-purple-500/15 text-purple-300',
              };
              const inactiveMap: Record<string, string> = {
                teal: 'border-white/10 text-bone/60 hover:border-teal/30',
                marigold: 'border-white/10 text-bone/60 hover:border-marigold/30',
                purple: 'border-white/10 text-bone/60 hover:border-purple-500/30',
              };
              return (
                <button
                  key={r.value}
                  type="button"
                  id={`role-${r.value.toLowerCase()}`}
                  onClick={() => update('role', r.value)}
                  className={`rounded-xl border p-3 text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${active ? colorMap[r.color] : inactiveMap[r.color]}`}
                >
                  <r.icon className="h-5 w-5" />
                  <span className="leading-tight">{r.label.split(' ')[0]}</span>
                  <span className="text-[10px] font-normal text-bone/50 leading-tight hidden sm:block">{r.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              Creating account…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Account <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </button>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-bone/70">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-marigold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </AuthVideoBackground>
  );
}
