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
    <section className="py-20 px-6 relative bg-white border-y border-slate-200 overflow-hidden text-slate-950 font-sans">
      {/* Subtle light background dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* SECTION HEADER - EXECUTIVE BLACK & WHITE */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
              <Crown className="h-4 w-4 text-slate-950" />
              <span>Upcoming Feature • M-TRAVEL Privilege Club</span>
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
              Fly, Drive &amp; Explore with <span className="underline decoration-slate-400 underline-offset-8">M-TRAVEL</span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-xl font-normal leading-relaxed">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with upcoming bespoke privileges and member rewards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-800 font-bold bg-slate-100 border border-slate-300 px-3.5 py-1.5 rounded-full shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-slate-900" />
            <span>Feature in Development • Coming Soon</span>
          </div>
        </div>

        {/* REWARDS CALLOUT BANNER (EXECUTIVE BLACK & WHITE PREVIEW) */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 text-white px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-white" /> Coming Soon
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-300 shadow-2xs">
                <Clock className="h-3 w-3 text-slate-700" /> Future Roadmap Feature
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
              The M-TRAVEL Privilege Club is Coming Soon
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              We are crafting an exclusive rewards journey for our travelers! In our upcoming release, every booking — from 4x4 safari cruisers and safari vans to intercity coaches — will earn you <strong className="text-slate-950 font-bold">Explorer Loyalty Points</strong> redeemable for complimentary vehicle upgrades, VIP airport concierge, and bespoke seasonal travel perks.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                Preview of Upcoming Member Privileges:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-slate-950 font-bold">
                  <Check className="h-4 w-4 text-slate-950 shrink-0" />
                  <span>Complimentary Fleet Upgrades</span>
                </div>
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-slate-950 font-bold">
                  <Check className="h-4 w-4 text-slate-950 shrink-0" />
                  <span>VIP Airport Meet &amp; Greet</span>
                </div>
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-slate-950 font-bold">
                  <Check className="h-4 w-4 text-slate-950 shrink-0" />
                  <span>Priority 4x4 Cruiser Reservation</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT-HAND EARLY ACCESS PREVIEW CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 w-full lg:w-72 shrink-0 shadow-md">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-sm">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                Future Launch Bonus
              </span>
              <p className="text-2xl font-extrabold text-slate-950 mt-1">500 Explorer Points</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug font-normal">
              Will be automatically unlocked for all registered traveler accounts upon official feature launch.
            </p>

            {user ? (
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => setNotified(true)}
                  className="w-full rounded-xl bg-slate-950 hover:bg-black text-white py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-slate-900"
                >
                  <ShieldCheck className="h-4 w-4 text-white" />
                  {notified ? 'Early Access Confirmed!' : 'Early Access Reserved'}
                </button>
                <p className="text-[10px] text-slate-500 font-mono">Your account will automatically qualify.</p>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full rounded-xl bg-slate-950 hover:bg-black text-white py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm border border-slate-900 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span>Register for Early Access</span>
                </button>
                <p className="text-[10px] text-slate-500 font-mono">100% Free • Early qualification when launched</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
