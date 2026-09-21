import React from 'react';
import { Navigation, Radio, UserCheck, KeyRound, Clock, Pause } from 'lucide-react';

interface VehicleStatusBadgeProps {
  isHired?: boolean;
  isLive?: boolean;
  isPendingApproval?: boolean;
  variant?: 'overlay' | 'light' | 'pill';
  labelOverride?: string;
  className?: string;
}

/**
 * Enterprise Luxury Status Badge
 * Replaces raw emojis (🚗, 🟢, ⏸️, ⏳) with precision SVG icons, pulsing live beacons,
 * and high-contrast luxury glassmorphic finishes inspired by Uber Black & Porsche Drive.
 */
export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({
  isHired = false,
  isLive = true,
  isPendingApproval = false,
  variant = 'overlay',
  labelOverride,
  className = '',
}) => {
  // 1. Pending Admin Verification State
  if (isPendingApproval) {
    if (variant === 'overlay') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 shadow-md ${className}`}>
          <Clock className="h-3 w-3 text-amber-400" />
          <span>{labelOverride || 'Under Review'}</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ${className}`}>
        <Clock className="h-3 w-3 text-amber-600" />
        <span>{labelOverride || 'Under Review'}</span>
      </span>
    );
  }

  // 2. On Trip / In Use (Hired) State
  if (isHired) {
    if (variant === 'overlay') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40 shadow-lg ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <Navigation className="h-3 w-3 text-amber-300 -rotate-45 shrink-0" />
          <span>{labelOverride || 'On Trip'}</span>
        </span>
      );
    }

    if (variant === 'light') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 shadow-xs ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
          </span>
          <Navigation className="h-3 w-3 text-amber-700 -rotate-45 shrink-0" />
          <span>{labelOverride || 'On Trip'}</span>
        </span>
      );
    }

    // Default Pill
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 shadow-xs ${className}`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
        </span>
        <Navigation className="h-3 w-3 text-amber-300 -rotate-45" />
        <span>{labelOverride || 'In Use (Hired)'}</span>
      </span>
    );
  }

  // 3. Live & Ready State
  if (isLive) {
    if (variant === 'overlay') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/40 shadow-lg ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Radio className="h-3 w-3 text-emerald-300 shrink-0" />
          <span>{labelOverride || 'Live & Ready'}</span>
        </span>
      );
    }

    if (variant === 'light') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-xs ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Radio className="h-3 w-3 text-emerald-600 shrink-0" />
          <span>{labelOverride || 'Live'}</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <Radio className="h-3 w-3 text-emerald-600" />
        <span>{labelOverride || 'Available Now'}</span>
      </span>
    );
  }

  // 4. Standby / Offline State
  if (variant === 'overlay') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-white/20 shadow-lg ${className}`}>
        <Pause className="h-3 w-3 text-slate-400 shrink-0" />
        <span>{labelOverride || 'Standby'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ${className}`}>
      <Pause className="h-2.5 w-2.5 text-slate-500" />
      <span>{labelOverride || 'Standby'}</span>
    </span>
  );
};

interface ChauffeurServiceBadgeProps {
  method?: string;
  hasChauffeur?: boolean;
  driverName?: string;
  variant?: 'badge' | 'inline';
  className?: string;
}

/**
 * Ultra-Premium Chauffeur Service Badge
 * Replaces informal cartoon emojis ('🚗 Chauffeur', '🔑 Self-Drive')
 * with sleek, five-star chauffeur service badges.
 */
export const ChauffeurServiceBadge: React.FC<ChauffeurServiceBadgeProps> = ({
  method,
  hasChauffeur,
  driverName,
  variant = 'badge',
  className = '',
}) => {
  const isChauffeur = hasChauffeur || Boolean(driverName) || method === 'WITH_CHAUFFEUR' || method === 'DRIVER_DELIVER' || method === 'CHAUFFEUR';

  if (!isChauffeur) {
    if (variant === 'inline') {
      return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 ${className}`}>
          <KeyRound className="h-3 w-3 text-teal-600 shrink-0" />
          <span>Self-Drive</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-teal-800 border border-teal-200 shadow-xs ${className}`}>
        <KeyRound className="h-3 w-3 text-teal-600" />
        <span>Self-Drive</span>
      </span>
    );
  }

  // Station Chauffeur Badge
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 ${className}`}>
        <UserCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span>Station Chauffeur</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-300 border border-amber-400/30 shadow-xs ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      <UserCheck className="h-3 w-3 text-amber-400" />
      <span>Station Chauffeur</span>
    </span>
  );
};
