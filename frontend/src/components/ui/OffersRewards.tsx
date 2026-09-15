import React from 'react';
import { Sparkles, Crown, ArrowRight, Tag, Star, Gift, Check } from 'lucide-react';
import { MpesaLogo } from './MpesaLogo';
import { useCurrency } from '@/context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

export const OffersRewards: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const offers = [
    {
      id: 'mara-safari',
      title: 'Maasai Mara 3-Day Safari Cruiser Package',
      subtitle: 'Includes Toyota Land Cruiser 4x4 + Professional Driver + Fuel',
      badge: 'Exclusive 15% Off',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      price: 18500,
      originalPrice: 22000,
      rating: 4.9,
      reviews: 128,
      mpesaCashback: 'Earn 925 M-PESA Points',
    },
    {
      id: 'diani-coastal',
      title: 'Diani Beach VIP Coastal Shuttle & Self-Drive',
      subtitle: 'Luxury Alphard Executive Van or Prado SUV with Airport Pick-up',
      badge: 'Best Value',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      price: 12000,
      originalPrice: 15000,
      rating: 4.85,
      reviews: 94,
      mpesaCashback: 'Earn 600 M-PESA Points',
    },
    {
      id: 'nairobi-chauffeur',
      title: 'Nairobi Executive Airport Chauffeur Transfer',
      subtitle: 'Mercedes-Benz E-Class or Land Cruiser V8 from JKIA to hotel',
      badge: 'VIP Transfer',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      price: 6500,
      originalPrice: 8000,
      rating: 4.95,
      reviews: 210,
      mpesaCashback: 'Earn 325 M-PESA Points',
    },
  ];

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
              Fly, Drive & Earn with <span className="bg-gold-gradient bg-clip-text text-transparent">M-PESA</span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-xl">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with instant M-PESA payment rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MpesaLogo variant="badge" />
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              100% Instant STK Confirmation
            </span>
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
              Earn <span className="text-amber-700 font-bold">5 M-PESA Loyalty Points</span> for every KES 1,000 spent on car hire, safaris, and bus reservations. Redeem points instantly for M-PESA cashbacks or free vehicle upgrades.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Instant M-PESA Cashbacks</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                <Check className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Complimentary Airport Pickup</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-medium">
                <Check className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Priority Safari Vehicle Booking</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-200 text-center space-y-3 w-full lg:w-72 shrink-0 shadow-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-white shadow-md">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-800">Welcome Bonus</p>
            <p className="font-serif text-2xl font-bold text-slate-900">500 Bonus Points</p>
            <p className="text-[11px] text-slate-500">Credited automatically on your first M-PESA booking</p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary w-full text-xs !py-2.5 font-bold"
            >
              Claim Privilege Pass
            </button>
          </div>
        </div>

        {/* OFFERS CARDS GRID */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="group rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-full"
            >
              <div className="flex flex-col flex-1">
                {/* IMAGE CONTAINER */}
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  <span className="absolute top-4 left-4 rounded-full bg-white/95 backdrop-blur-md text-amber-800 text-xs font-bold px-3 py-1 border border-amber-300 shadow-sm">
                    {offer.badge}
                  </span>

                  <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs text-white bg-slate-900/75 px-3 py-1 rounded-full backdrop-blur-md font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{offer.rating}</span>
                    <span className="text-slate-300">({offer.reviews})</span>
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 leading-snug group-hover:text-amber-700 transition-colors min-h-[3rem]">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 min-h-[2.5rem]">
                      {offer.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 text-[11px] text-emerald-700 font-semibold">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{offer.mpesaCashback}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER & PRICING */}
              <div className="p-6 pt-3 border-t border-slate-150 flex items-end justify-between mt-auto">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">From</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatPrice(offer.price)}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(offer.originalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/search')}
                  className="btn-primary text-xs !px-4 !py-2.5 flex items-center gap-1.5 shadow-sm"
                >
                  <MpesaLogo variant="icon" size="sm" />
                  <span>Book Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
