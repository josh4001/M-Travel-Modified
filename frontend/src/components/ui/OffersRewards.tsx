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
    <section className="py-20 px-6 relative bg-[#FAF8F5] border-y border-slate-200/70">
      <div className="mx-auto max-w-7xl">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
              <Crown className="h-4 w-4 text-amber-600" /> Upcoming Feature • M-TRAVEL Privilege Club
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Fly, Drive & Explore with <span className="bg-gold-gradient bg-clip-text text-transparent">M-TRAVEL</span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-xl">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with upcoming bespoke privileges and member rewards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-sm">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Feature in Development • Coming Soon</span>
          </div>
        </div>

        {/* REWARDS CALLOUT BANNER (COMING SOON FEATURE PREVIEW) */}
        <div className="mt-10 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 px-3 py-1 text-[11px] font-bold text-amber-800">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Coming Soon
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900/80 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                <Clock className="h-3 w-3 text-amber-600" /> Future Roadmap Feature
              </span>
            </div>

            <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
              The M-TRAVEL Privilege Club is Coming Soon
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We are crafting an exclusive rewards journey for our travelers! In our upcoming release, every booking — from 4x4 safari cruisers and safari vans to intercity coaches — will earn you <span className="text-amber-700 font-bold">Explorer Loyalty Points</span> redeemable for complimentary vehicle upgrades, VIP airport concierge, and bespoke seasonal travel perks.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Preview of Upcoming Member Privileges:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Complimentary Fleet Upgrades</span>
                </div>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                  <Check className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>VIP Airport Meet & Greet</span>
                </div>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                  <Check className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Priority 4x4 Cruiser Reservation</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT-HAND EARLY ACCESS PREVIEW CARD */}
          <div className="bg-white p-6 rounded-2xl border border-amber-200 text-center space-y-3 w-full lg:w-72 shrink-0 shadow-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-white shadow-md">
              <Gift className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Future Launch Bonus
              </span>
              <p className="font-serif text-2xl font-bold text-slate-900 mt-1">500 Explorer Points</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Will be automatically unlocked for all registered traveler accounts upon official feature launch.
            </p>

            {user ? (
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => setNotified(true)}
                  className="w-full rounded-xl bg-amber-500/10 border border-amber-300 py-2.5 px-3 text-xs font-bold text-amber-900 hover:bg-amber-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
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
