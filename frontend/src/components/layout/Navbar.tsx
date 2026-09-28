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
  const isHome = location.pathname === '/';
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const handleSignOut = () => {
    dispatch(logout());
    localStorage.removeItem('mt_access_token');
    localStorage.removeItem('mt_refresh_token');
    localStorage.removeItem('mt_user');
    window.location.href = '/login';
  };

  const getRoleBadgeUI = () => {
    if (!user) return null;
    const role = user.role?.toUpperCase();

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white border border-purple-600 shadow-2xs">
          <Shield className="h-3 w-3 shrink-0 fill-purple-300" />
          <span>Admin</span>
        </span>
      );
    }
    if (role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-400 shadow-2xs">
          <Car className="h-3 w-3 shrink-0" />
          <span>Fleet Host</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white border border-emerald-500 shadow-2xs">
        <UserIcon className="h-3 w-3 shrink-0" />
        <span>Traveler</span>
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
      <div className={`${isHome ? 'bg-black border-b border-white/10 text-slate-300' : 'bg-[#C4AC90] border-b border-[#AF9374] text-[#221207]'} text-[11px] px-4 py-1.5 font-medium transition-colors`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 ${isHome ? 'text-amber-400 font-bold' : 'text-amber-950 font-bold'}`}>
              <Phone className={`h-3 w-3 ${isHome ? 'text-amber-400' : 'text-amber-900'}`} /> 24/7 Concierge: <strong className={isHome ? 'text-white font-extrabold' : 'text-[#1A0D05] font-extrabold'}>0722 374 535</strong>
            </span>
            <span className={`hidden sm:inline-flex items-center gap-1 ${isHome ? 'text-slate-300 border-l border-white/15' : 'text-[#452C1A] border-l border-[#AF9374]'} pl-4 font-semibold`}>
              <Crown className={`h-3 w-3 ${isHome ? 'text-amber-400' : 'text-amber-900'}`} /> East Africa's Luxury Travel Network
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/254791888840"
              target="_blank"
              rel="noreferrer"
              className={`hidden md:inline-flex items-center gap-1 ${isHome ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-950 hover:text-black'} font-bold transition`}
            >
              WhatsApp Concierge
            </a>

            {/* CURRENCY SELECTOR */}
            <div className={`relative flex items-center gap-1 rounded-full border ${isHome ? 'border-white/20 bg-slate-950 text-slate-200' : 'border-[#AF9374] bg-[#D4BEA3] text-[#221207]'} px-2.5 py-0.5 text-[11px] font-bold shadow-2xs`}>
              <Globe className={`h-3 w-3 ${isHome ? 'text-amber-400' : 'text-amber-900'}`} />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className={`bg-transparent font-bold ${isHome ? 'text-slate-200' : 'text-[#221207]'} focus:outline-none cursor-pointer pr-1 text-[11px]`}
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className={isHome ? 'bg-slate-950 text-white' : 'bg-[#D4BEA3] text-[#221207]'}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FROSTED NAVIGATION BAR */}
      <div className={`${isHome ? 'bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.7)]' : 'bg-[#D4BEA3]/95 backdrop-blur-xl border-b border-[#BA9E7E] shadow-[0_4px_20px_-4px_rgba(34,18,7,0.12)]'} px-4 py-2.5 transition-colors`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="M-TRAVEL"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
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
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wide uppercase transition-all duration-200 rounded-full ${
                    isActive
                      ? isHome
                        ? 'text-white bg-amber-500/25 border border-amber-400/50 font-extrabold shadow-xs'
                        : 'text-[#221207] bg-amber-700/25 border border-amber-800/40 font-extrabold shadow-xs'
                      : isHome
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                      : 'text-[#2C180B] hover:text-[#0F0702] hover:bg-[#C4AC90]/70 border border-transparent'
                  }`}
                >
                  {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? (isHome ? 'text-amber-400' : 'text-amber-950') : (isHome ? 'text-slate-400' : 'text-[#5C3A20]')}`} />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className={`absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full ${isHome ? 'bg-amber-400' : 'bg-amber-800'}`} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* USER PROFILE & ACTIONS */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <Link
                  to="/profile"
                  title="My Profile — Click to view & manage your account credentials, standing and settings"
                  className={`group flex items-center gap-2.5 rounded-full border pl-1.5 pr-3 py-1 transition-all duration-200 shadow-2xs cursor-pointer ${
                    location.pathname === '/profile' || location.pathname === '/dashboard/profile'
                      ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-400 shadow-xs'
                      : isHome
                      ? 'border-white/20 bg-white/10 hover:border-amber-400 hover:bg-white/15'
                      : 'border-[#BA9E7E] bg-[#F8F2EA] hover:border-amber-700 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  {/* User Initial Avatar */}
                  <div className="w-6 h-6 rounded-full bg-[#1A0D05] text-amber-300 flex items-center justify-center font-bold text-[11px] shadow-2xs ring-1 ring-amber-700/50">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>

                  {/* User Name */}
                  <span className={`text-xs font-bold ${isHome ? 'text-white' : 'text-[#1A0D05]'} group-hover:text-amber-300 transition max-w-[130px] truncate`}>
                    {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
                  </span>

                  {/* High-Visibility Role Badge */}
                  {getRoleBadgeUI()}

                  {/* Dedicated Profile Action Pill */}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950 bg-amber-200 group-hover:bg-amber-300 border border-amber-400 px-2 py-0.5 rounded-full transition flex items-center gap-1 shadow-2xs">
                    <UserIcon className="h-2.5 w-2.5" /> Profile →
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className={`rounded-full border ${isHome ? 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30' : 'border-[#BA9E7E] bg-[#F8F2EA] text-[#221207] hover:bg-white hover:border-[#967B5E]'} !px-3.5 !py-1.5 text-xs font-bold tracking-wide uppercase transition shadow-2xs cursor-pointer`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-xs font-bold ${isHome ? 'text-slate-200 hover:text-white' : 'text-[#221207] hover:text-black'} px-3 py-1.5 transition tracking-wide uppercase`}
                >
                  Log in
                </Link>
                <Link
                  to="/catalogue"
                  className="btn-primary !px-5 !py-2.5 text-xs uppercase tracking-wider font-bold shadow-md hover:shadow-lg"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Book a Ride
                </Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <button
            className={`md:hidden ${isHome ? 'text-white hover:bg-white/10' : 'text-[#221207] hover:text-[#0F0702] hover:bg-[#C4AC90]'} p-1.5 rounded-lg transition-colors`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* MOBILE DRAWER */}
        {open && (
          <div className={`mt-3 mx-auto max-w-7xl rounded-2xl border ${isHome ? 'border-white/20 bg-black/95 text-white' : 'border-[#BA9E7E] bg-[#D4BEA3]'} p-5 shadow-float lg:hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
            <div className="flex flex-col gap-2.5">
              {user && (
                <div className={`border-b ${isHome ? 'border-white/15' : 'border-[#BA9E7E]'} pb-3`}>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl ${isHome ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white' : 'bg-[#F8F2EA] border-[#BA9E7E] hover:border-amber-700 hover:bg-white'} border transition group`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1A0D05] text-amber-300 flex items-center justify-center font-bold text-xs ring-1 ring-amber-700/50">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`text-xs font-bold ${isHome ? 'text-white' : 'text-[#1A0D05]'} group-hover:text-amber-300`}>
                          {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
                        </span>
                        <span className={`text-[10px] ${isHome ? 'text-slate-400' : 'text-[#452C1A]'} font-medium`}>Manage Account &amp; Credentials</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadgeUI()}
                      <span className="text-[11px] font-bold text-amber-950 bg-amber-200 border border-amber-400 px-2.5 py-0.5 rounded-full">
                        Profile →
                      </span>
                    </div>
                  </Link>
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
                        ? isHome
                          ? 'bg-amber-500/25 text-white font-bold border border-amber-400/50'
                          : 'bg-amber-700/25 text-[#221207] font-bold border border-amber-800/40'
                        : isHome
                        ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'text-[#2C180B] hover:bg-[#C4AC90]'
                    }`}
                  >
                    {Icon && <Icon className={`h-4 w-4 ${isActive ? (isHome ? 'text-amber-400' : 'text-amber-950') : (isHome ? 'text-slate-400' : 'text-[#5C3A20]')}`} />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user ? (
                <div className={`border-t ${isHome ? 'border-white/15' : 'border-[#BA9E7E]'} pt-3 flex items-center justify-end`}>
                  <button
                    onClick={() => { setOpen(false); handleSignOut(); }}
                    className="text-xs text-rose-400 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className={`border-t ${isHome ? 'border-white/15' : 'border-[#BA9E7E]'} pt-3 flex gap-2`}>
                  <Link to="/login" onClick={() => setOpen(false)} className={`w-1/2 !py-2.5 text-xs text-center rounded-full font-bold ${isHome ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : 'btn-secondary !bg-[#F8F2EA] !border-[#BA9E7E] !text-[#1A0D05]'}`}>
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

