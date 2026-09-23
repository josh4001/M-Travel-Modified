import React from 'react';
import { Sparkles, Crown, Gift, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OffersRewards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 relative bg-[#FAF8F5] border-y border-slate-200/70">
      <div className="mx-auto max-w-7xl">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
              <Crown className="h-4 w-4 text-amber-600" /> M-TRAVEL Privilege Club & Curated Offers
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Fly, Drive & Explore with <span className="bg-gold-gradient bg-clip-text text-transparent">M-TRAVEL</span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-xl">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with bespoke privileges and member rewards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Guaranteed Safari Departures</span>
          </div>
        </div>

        {/* REWARDS CALLOUT BANNER */}
        <div className="mt-10 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 px-3 py-1 text-[11px] font-bold text-amber-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Loyalty Privilege Rewards
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
              Join the M-TRAVEL Privilege Club
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Earn <span className="text-amber-700 font-bold">5 Explorer Loyalty Points</span> for every KES 1,000 spent on car hire, safaris, and luxury coaches. Redeem points for complimentary vehicle upgrades or private airport pickups.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Complimentary Upgrades</span>
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

          <div className="bg-white p-6 rounded-2xl border border-amber-200 text-center space-y-3 w-full lg:w-72 shrink-0 shadow-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-white shadow-md">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-800">Welcome Bonus</p>
            <p className="font-serif text-2xl font-bold text-slate-900">500 Explorer Points</p>
            <p className="text-[11px] text-slate-500">Credited automatically on your first journey reservation</p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary w-full text-xs !py-2.5 font-bold"
            >
              Claim Privilege Pass
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
