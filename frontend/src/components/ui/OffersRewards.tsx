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
    <section className="py-20 px-6 relative border-y border-[#BA9E7E] overflow-hidden">
      {/* Photographic Background - Safari Giraffes & Land Cruiser HD */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/safari-giraffes-drive.jpg"
          alt="Safari Land Cruiser & Giraffes on the Golden Savannah Plains in Kenya"
          className="w-full h-full object-cover object-[center_35%]"
        />
        {/* Balanced scrim gradients ensuring the safari scene, giraffes, vehicle, and savannah shine through while keeping cards and text razor sharp */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/60" />
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/30 pointer-events-none" />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-amber-500/30 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-sm">
              <Crown className="h-4 w-4 text-amber-400" /> Upcoming Feature • M-TRAVEL Privilege Club
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Fly, Drive &amp; Explore with{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                M-TRAVEL
              </span>
            </h2>
            <p className="mt-2 text-slate-100 text-sm max-w-xl font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with upcoming bespoke privileges and member rewards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-200 font-bold bg-black/40 backdrop-blur-md border border-amber-400/40 px-3.5 py-1.5 rounded-full shadow-sm">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Feature in Development • Coming Soon</span>
          </div>
        </div>

        {/* REWARDS CALLOUT BANNER (COMING SOON FEATURE PREVIEW) */}
        <div className="mt-10 rounded-3xl border border-amber-900/20 bg-white/95 backdrop-blur-md p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 px-3 py-1 text-[11px] font-bold text-amber-950">
                <Sparkles className="h-3.5 w-3.5 text-amber-800" /> Coming Soon
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                <Clock className="h-3 w-3 text-slate-700" /> Future Roadmap Feature
              </span>
            </div>

            <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#1A0D05]">
              The M-TRAVEL Privilege Club is Coming Soon
            </h3>
            <p className="text-sm text-[#452C1A] leading-relaxed font-medium">
              We are crafting an exclusive rewards journey for our travelers! In our upcoming release, every booking — from 4x4 safari cruisers and safari vans to intercity coaches — will earn you <span className="text-amber-900 font-bold">Explorer Loyalty Points</span> redeemable for complimentary vehicle upgrades, VIP airport concierge, and bespoke seasonal travel perks.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#664933] mb-2">
                Preview of Upcoming Member Privileges:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-[#F8F2EA] p-2.5 rounded-xl border border-[#BA9E7E] shadow-2xs text-[#1A0D05] font-bold">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Complimentary Fleet Upgrades</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F8F2EA] p-2.5 rounded-xl border border-[#BA9E7E] shadow-2xs text-[#1A0D05] font-bold">
                  <Check className="h-4 w-4 text-amber-800 shrink-0" />
                  <span>VIP Airport Meet &amp; Greet</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F8F2EA] p-2.5 rounded-xl border border-[#BA9E7E] shadow-2xs text-[#1A0D05] font-bold">
                  <Check className="h-4 w-4 text-teal-800 shrink-0" />
                  <span>Priority 4x4 Cruiser Reservation</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT-HAND EARLY ACCESS PREVIEW CARD */}
          <div className="bg-[#F8F2EA] p-6 rounded-2xl border border-[#BA9E7E] text-center space-y-3 w-full lg:w-72 shrink-0 shadow-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-slate-950 shadow-md">
              <Gift className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
                Future Launch Bonus
              </span>
              <p className="font-serif text-2xl font-bold text-[#1A0D05] mt-1">500 Explorer Points</p>
            </div>
            <p className="text-[11px] text-[#452C1A] leading-snug font-medium">
              Will be automatically unlocked for all registered traveler accounts upon official feature launch.
            </p>

            {user ? (
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => setNotified(true)}
                  className="w-full rounded-xl bg-amber-500/20 border border-amber-400 py-2.5 px-3 text-xs font-bold text-amber-950 hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-800" />
                  {notified ? 'Early Access Confirmed!' : 'Early Access Reserved'}
                </button>
                <p className="text-[10px] text-[#664933]">Your account will automatically qualify.</p>
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
                <p className="text-[10px] text-[#664933]">100% Free • Early qualification when launched</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
