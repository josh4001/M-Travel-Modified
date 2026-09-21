import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Compass, LayoutDashboard, Home } from 'lucide-react';
import type { RootState } from '@/store';

export default function NotFound() {
  const user = useSelector((s: RootState) => s.auth.user);
  const targetHome = user ? '/dashboard' : '/';

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 text-center font-display">
      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm mb-2">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 tracking-tight">Off the map</h1>
      <p className="mt-2 text-slate-600 font-medium max-w-sm">We couldn't find the expedition or page you were looking for.</p>
      <Link
        to={targetHome}
        className="btn-primary mt-6 inline-flex items-center gap-2 !py-3 !px-6 text-xs font-bold"
      >
        {user ? <LayoutDashboard className="h-4 w-4" /> : <Home className="h-4 w-4" />}
        <span>{user ? 'Back to Dashboard' : 'Back Home'}</span>
      </Link>
    </div>
  );
}
