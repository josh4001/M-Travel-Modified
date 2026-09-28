import React, { useState } from 'react';
import { Sparkles, Crown, Gift, Check, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export const OffersRewards: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [notified, setNotified] = useState(false);

  return (
    <section className="py-20 px-6 relative bg-black border-y border-white/10 overflow-hidden text-white font-display">
      {/* Subtle warm amber rim glow at the edges */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />

      {/* Ambient background light cones */}
      <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-sm">
              <Crown className="h-4 w-4 text-amber-400" /> Upcoming Feature • M-TRAVEL Privilege Club
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
              Fly, Drive &amp; Explore with{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                M-TRAVEL
              </span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-xl font-medium">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with upcoming bespoke privileges and member rewards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-200 font-bold bg-white/5 backdrop-blur-md border border-amber-400/30 px-3.5 py-1.5 rounded-full shadow-sm">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Feature in Development • Coming Soon</span>
          </div>
        </div>

        {/* REWARDS CALLOUT BANNER (COMING SOON FEATURE PREVIEW) */}
        <div className="mt-10 rounded-3xl border border-white/15 bg-gradient-to-br from-slate-950 via-[#101010] to-black p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-[11px] font-bold text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Coming Soon
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                <Clock className="h-3 w-3 text-slate-400" /> Future Roadmap Feature
              </span>
            </div>

            <h3 className="font-serif text-2xl md:text-3xl font-bold text-white">
              The M-TRAVEL Privilege Club is Coming Soon
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              We are crafting an exclusive rewards journey for our travelers! In our upcoming release, every booking — from 4x4 safari cruisers and safari vans to intercity coaches — will earn you <span className="text-amber-400 font-bold">Explorer Loyalty Points</span> redeemable for complimentary vehicle upgrades, VIP airport concierge, and bespoke seasonal travel perks.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/70 mb-2">
                Preview of Upcoming Member Privileges:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10 shadow-2xs text-white font-bold backdrop-blur-sm">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Complimentary Fleet Upgrades</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10 shadow-2xs text-white font-bold backdrop-blur-sm">
                  <Check className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>VIP Airport Meet &amp; Greet</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10 shadow-2xs text-white font-bold backdrop-blur-sm">
                  <Check className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Priority 4x4 Cruiser Reservation</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT-HAND EARLY ACCESS PREVIEW CARD */}
          <div className="bg-black/60 p-6 rounded-2xl border border-amber-500/30 text-center space-y-3 w-full lg:w-72 shrink-0 shadow-xl backdrop-blur-md">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-slate-950 shadow-md">
              <Gift className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                Future Launch Bonus
              </span>
              <p className="font-serif text-2xl font-bold text-white mt-1">500 Explorer Points</p>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug font-medium">
              Will be automatically unlocked for all registered traveler accounts upon official feature launch.
            </p>

            {user ? (
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => setNotified(true)}
                  className="w-full rounded-xl bg-amber-500/20 border border-amber-400/50 py-2.5 px-3 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  {notified ? 'Early Access Confirmed!' : 'Early Access Reserved'}
                </button>
                <p className="text-[10px] text-slate-400">Your account will automatically qualify.</p>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary w-full text-xs !py-2.5 font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Register for Early Access</span>
                </button>
                <p className="text-[10px] text-slate-400">100% Free • Early qualification when launched</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
