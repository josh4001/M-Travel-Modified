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
    <section className="py-16 px-6 relative">
      <div className="mx-auto max-w-7xl">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-mtravel-gold/20 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-mtravel-gold/40 bg-mtravel-burgundy/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-mtravel-lightGold backdrop-blur-md">
              <Crown className="h-4 w-4 text-mtravel-gold" /> M-TRAVEL Privilege Club & Special Offers
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-bone tracking-tight">
              Fly, Drive & Earn with <span className="text-mtravel-lightGold">M-PESA</span>
            </h2>
            <p className="mt-2 text-bone/70 text-sm max-w-xl">
              Enjoy curated luxury Kenyan travel packages inspired by global hospitality standards, with instant M-PESA payment rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MpesaLogo variant="badge" />
            <span className="text-xs text-mtravel-lightGold font-mono">100% Guaranteed Instant STK Confirmation</span>
          </div>
        </div>

        {/* M-TRAVEL PRIVILEGE CLUB BANNER */}
        <div className="mt-10 rounded-3xl border border-mtravel-gold/30 bg-mtravel-gradient p-6 md:p-8 shadow-3d-glow relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mtravel-gold/20 border border-mtravel-gold/40 px-3 py-1 text-[11px] font-mono font-bold text-mtravel-lightGold">
              <Sparkles className="h-3.5 w-3.5 text-mtravel-gold" /> Loyalty Privilege Rewards
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-bone">
              Join the M-TRAVEL Privilege Club
            </h3>
            <p className="text-sm text-bone/80 leading-relaxed">
              Earn <span className="text-mtravel-lightGold font-bold">5 M-PESA Loyalty Points</span> for every KES 1,000 spent on car hire, safaris, and bus reservations. Redeem points instantly for M-PESA cashbacks or free vehicle upgrades.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant M-PESA STK Cashbacks</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                <Check className="h-4 w-4 text-mtravel-gold shrink-0" />
                <span>Complimentary Airport Pickup</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                <Check className="h-4 w-4 text-teal shrink-0" />
                <span>Priority Safari Vehicle Booking</span>
              </div>
            </div>
          </div>

          <div className="bg-black/50 p-6 rounded-2xl border border-mtravel-gold/40 text-center space-y-3 w-full lg:w-72 shrink-0">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-mtravel-obsidian shadow-gold-glow">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-mtravel-lightGold">Welcome Bonus</p>
            <p className="font-serif text-xl font-bold text-bone">500 Bonus Points</p>
            <p className="text-[11px] text-bone/60">Credited automatically on your first M-PESA booking</p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary w-full text-xs !py-2.5 !bg-gold-gradient text-mtravel-obsidian font-bold"
            >
              Claim Privilege Pass
            </button>
          </div>
        </div>

        {/* OFFERS CARDS GRID */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="group rounded-3xl border border-white/10 bg-ink-100/80 overflow-hidden shadow-3d-md hover:border-mtravel-gold/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div>
                {/* IMAGE CONTAINER */}
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
                  
                  <span className="absolute top-4 left-4 rounded-full bg-mtravel-burgundy/90 backdrop-blur-md text-mtravel-lightGold text-xs font-bold px-3 py-1 border border-mtravel-gold/40 shadow-md">
                    {offer.badge}
                  </span>

                  <span className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-bone/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 font-mono">
                    <Star className="h-3.5 w-3.5 fill-mtravel-gold text-mtravel-gold" />
                    <span>{offer.rating}</span>
                    <span className="text-bone/50">({offer.reviews})</span>
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-bone leading-snug group-hover:text-mtravel-lightGold transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-bone/60 leading-relaxed">
                    {offer.subtitle}
                  </p>

                  <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-400 font-mono">
                    <Tag className="h-3.5 w-3.5" />
                    <span>{offer.mpesaCashback}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER & PRICING */}
              <div className="p-6 pt-0 border-t border-white/10 flex items-end justify-between mt-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-bone/40 block">From</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-mtravel-lightGold">
                      {formatPrice(offer.price)}
                    </span>
                    <span className="text-xs text-bone/40 line-through font-mono">
                      {formatPrice(offer.originalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/search')}
                  className="btn-primary text-xs !px-4 !py-2.5 shadow-glow flex items-center gap-1.5"
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
