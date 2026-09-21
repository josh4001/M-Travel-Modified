import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu, Wallet, Sparkles, X, User as UserIcon, Shield, Car,
  Globe, Phone, Crown, LayoutDashboard, CalendarCheck, PlusCircle, Palmtree
} from 'lucide-react';
import { useState } from 'react';
import type { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useCurrency, CURRENCIES, type CurrencyCode } from '@/context/CurrencyContext';

interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

export function Navbar() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const handleSignOut = () => {
    dispatch(logout());
    localStorage.removeItem('mt_access_token');
    localStorage.removeItem('mt_refresh_token');
    localStorage.removeItem('mt_user');
    window.location.href = '/login';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const role = user.role?.toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700">
          <Shield className="h-3 w-3 text-purple-600" /> Admin
        </span>
      );
    }
    if (role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST') {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
          <Car className="h-3 w-3 text-amber-600" /> Fleet Host
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
        <UserIcon className="h-3 w-3 text-emerald-600" /> Traveler
      </span>
    );
  };

  /**
   * Tailored role-based navigation links:
   * Leaves only the essential, high-value components for each account persona,
   * centered around their respective Dashboard.
   */
  const getNavItems = (): NavItem[] => {
    if (!user) {
      return [
        { label: 'Home', path: '/', isActive: (p) => p === '/' },
        { label: 'Explore Fleet', path: '/catalogue', isActive: (p) => p === '/catalogue' || p === '/search' },
        { label: 'Holidays & Tours', path: '/holidays-and-tours', isActive: (p) => p === '/holidays-and-tours' },
        { label: 'Services', path: '/services', isActive: (p) => p === '/services' },
        { label: 'Contact', path: '/contact', isActive: (p) => p === '/contact' },
      ];
    }

    const role = user?.role?.toUpperCase();

    // 1. ADMIN ACCOUNT — Mission Control & Fleet Oversight (No consumer marketing fluff)
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/admin',
          icon: LayoutDashboard,
          isActive: (p) => p.startsWith('/dashboard/admin') || p === '/dashboard',
        },
        {
          label: 'Live Fleet',
          path: '/catalogue?category=vehicles',
          icon: Car,
          isActive: (p) => p === '/catalogue' || p === '/search' || p.startsWith('/vehicles'),
        },
        {
          label: 'Wallet & Payouts',
          path: '/dashboard/wallet',
          icon: Wallet,
          isActive: (p) => p === '/dashboard/wallet',
        },
      ];
    }

    // 2. FLEET HOST ACCOUNT — Only Host Dashboard, My Registered Cars, Bookings, Register Car & Wallet
    if (role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST') {
      return [
        {
          label: 'Host Dashboard',
          path: '/dashboard/owner',
          icon: LayoutDashboard,
          isActive: (p) => (p === '/dashboard/owner' || p === '/dashboard') && (!location.search || location.search.includes('overview')),
        },
        {
          label: 'My Registered Cars',
          path: '/dashboard/owner?tab=fleet',
          icon: Car,
          isActive: (p) => p.startsWith('/dashboard/owner') && location.search.includes('tab=fleet'),
        },
        {
          label: 'Bookings',
          path: '/dashboard/owner?tab=bookings',
          icon: CalendarCheck,
          isActive: (p) => p.startsWith('/dashboard/owner') && location.search.includes('tab=bookings'),
        },
        {
          label: 'Register Car',
          path: '/dashboard/owner?tab=add',
          icon: PlusCircle,
          isActive: (p) => p.startsWith('/dashboard/owner') && location.search.includes('tab=add'),
        },
        {
          label: 'My Wallet',
          path: '/dashboard/wallet',
          icon: Wallet,
          isActive: (p) => p === '/dashboard/wallet',
        },
      ];
    }

    // 3. TRAVELER / TOURIST ACCOUNT — Booking, Active Trips & Wallet
    return [
      {
        label: 'Dashboard',
        path: '/dashboard/tourist',
        icon: LayoutDashboard,
        isActive: (p) => p.startsWith('/dashboard/tourist') || p === '/dashboard',
      },
      {
        label: 'Explore Fleet',
        path: '/catalogue',
        icon: Car,
        isActive: (p) => p === '/catalogue' || p === '/search' || p.startsWith('/vehicles'),
      },
      {
        label: 'Holidays and Tours',
        path: '/holidays-and-tours',
        icon: Palmtree,
        isActive: (p) => p === '/holidays-and-tours',
      },
      {
        label: 'My Bookings',
        path: '/dashboard/bookings',
        icon: CalendarCheck,
        isActive: (p) => p === '/dashboard/bookings',
      },
      {
        label: 'Wallet',
        path: '/dashboard/wallet',
        icon: Wallet,
        isActive: (p) => p === '/dashboard/wallet',
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 font-display">
      {/* LUXURY TOP UTILITY STRIP */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 px-4 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Phone className="h-3 w-3 text-amber-400" /> 24/7 Concierge: <strong className="text-white font-semibold">0722 374 535</strong>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 border-l border-slate-700/80 pl-4">
              <Crown className="h-3 w-3 text-amber-400" /> East Africa's Luxury Travel Network
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/254791888840"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              WhatsApp Concierge
            </a>

            {/* CURRENCY SELECTOR */}
            <div className="relative flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[11px] text-slate-200">
              <Globe className="h-3 w-3 text-amber-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer pr-1 text-[11px]"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FROSTED NAVIGATION BAR */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] px-4 py-2.5">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="M-TRAVEL"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* DYNAMIC ROLE-TAILORED NAVIGATION LINKS */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = item.isActive(location.pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.label}-${item.path}`}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 rounded-full ${
                    isActive
                      ? 'text-amber-900 bg-amber-500/15 border border-amber-500/30 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-700' : 'text-slate-500'}`} />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* USER PROFILE & ACTIONS */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                {getRoleBadge()}
                <span className="text-xs font-semibold text-slate-700">
                  {user.firstName ? `${user.firstName} ${user.lastName ?? ''}` : user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary !px-4 !py-1.5 text-xs font-semibold tracking-wide uppercase"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-amber-700 px-3 py-1.5 transition tracking-wide uppercase"
                >
                  Log in
                </Link>
                <Link
                  to="/catalogue"
                  className="btn-primary !px-5 !py-2.5 text-xs uppercase tracking-wider"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Book a Ride
                </Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <button
            className="md:hidden text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* MOBILE DRAWER */}
        {open && (
          <div className="mt-3 mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-5 shadow-float lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2.5">
              {user && (
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <span className="text-xs font-semibold text-slate-800">
                    {user.firstName ? `${user.firstName} ${user.lastName ?? ''}` : user.email}
                  </span>
                  {getRoleBadge()}
                </div>
              )}

              {navItems.map((item) => {
                const isActive = item.isActive(location.pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.label}-${item.path}`}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-800 font-bold border border-amber-500/20'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {Icon && <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user ? (
                <div className="border-t border-slate-150 pt-3 flex items-center justify-end">
                  <button
                    onClick={() => { setOpen(false); handleSignOut(); }}
                    className="text-xs text-rose-600 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="border-t border-slate-150 pt-3 flex gap-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-1/2 !py-2.5 text-xs text-center">
                    Log in
                  </Link>
                  <Link to="/catalogue" onClick={() => setOpen(false)} className="btn-primary w-1/2 !py-2.5 text-xs text-center font-bold">
                    Book Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

