import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Bus, Palmtree, Home, Wallet, ShieldCheck, MapPinned, Headset, CheckCircle, Sparkles, Award, Smartphone } from 'lucide-react';
import { CatalogueTabs } from '@/components/ui/CatalogueTabs';
import { PinterestThemes } from '@/components/ui/PinterestThemes';
import {
  SatisfiedExplorerIllustration,
  PalmTreeCartoon,
  SavannahGrassTuft
} from '@/components/ui/CartoonSafariIllustrations';

const services = [
  {
    icon: Car,
    title: 'Vehicle hire',
    cat: 'vehicles',
    desc: 'Executive cars, 4×4 safari SUVs, safari vans, and pickups — search nearby, filter by price and location, and book with M-Pesa in a few taps.',
  },
  {
    icon: Bus,
    title: 'Bus reservations',
    cat: 'buses',
    desc: 'Compare routes and prices, pick your seat, and get a QR ticket with SMS confirmation — no queueing at the stage.',
  },
  {
    icon: Palmtree,
    title: 'Tours & travel',
    cat: 'tours',
    desc: 'Safari, beach, hiking, camping, and city-tour packages from vetted local operators, bookable end-to-end.',
  },
  {
    icon: Home,
    title: 'Holiday homes',
    cat: 'homes',
    desc: 'Apartments, villas, cottages, and Airbnb-style stays searchable by county, guests, bedrooms, and amenities.',
  },
  {
    icon: Wallet,
    title: 'Provider wallet',
    desc: 'Every vehicle owner, bus company, tour operator, and home owner gets a wallet with transaction history and withdrawals.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & safety',
    desc: 'Verified insurance details, rated reviews, and secure M-Pesa, card, and PayPal payments on every booking.',
  },
  {
    icon: MapPinned,
    title: 'Interactive Maps & Search',
    desc: 'Google Maps-powered search, directions, and location results for vehicles, homes, and tours.',
  },
  {
    icon: Headset,
    title: 'Support',
    desc: 'In-app chat, support tickets, and a responsive team behind every booking.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Services() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <span className="mb-4 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
          What we offer
        </span>
        <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl text-slate-900">
          Everything you need to travel, in one place.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 text-base leading-relaxed">
          M-TRAVEL brings vehicle hire, bus travel, tours, and holiday homes together under a
          single account, a single wallet, and a single support line.
        </p>
      </motion.div>

      {/* INTERACTIVE CATALOGUE TABS */}
      <CatalogueTabs />

      {/* TOURISM VIBES AND MOOD BOARDS */}
      <PinterestThemes />

      {/* ── TRAVELER SATISFACTION & SERVICE EXCELLENCE BANNER WITH CARTOON EXPLORER ── */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="rounded-3xl border-2 border-amber-300/90 bg-gradient-to-r from-amber-50/95 via-white to-amber-100/50 p-6 md:p-10 shadow-sm relative overflow-hidden"
      >
        {/* Background Tropical Palm & Savannah Grass Illustrations */}
        <div className="absolute top-2 right-4 opacity-20 md:opacity-35 pointer-events-none -z-10">
          <PalmTreeCartoon size={140} />
        </div>
        <div className="absolute -bottom-4 right-32 opacity-30 pointer-events-none -z-10">
          <SavannahGrassTuft size={110} />
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Satisfied Cartoon Explorer with Thumbs-up */}
          <div className="shrink-0 flex flex-col items-center">
            <SatisfiedExplorerIllustration />
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> 100% Safari Ready
              </span>
            </div>
          </div>

          {/* Description & Confidence Commitments */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Service Excellence Commitment</span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Designed for Pure Travel Joy &amp; Complete Peace of Mind
            </h2>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
              Whether you are booking a rugged 4x4 game drive cruiser to the Maasai Mara, an executive coastal safari van, or a private beachfront villa, M-TRAVEL delivers dependable, stress-free hospitality on every journey.
            </p>

            {/* Satisfaction Guarantees Grid with Premium Brand Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 border border-amber-200/90 p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)] shrink-0 ring-2 ring-amber-300/40 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mechanically Inspected Fleet</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Every 4x4 &amp; van verified for road safety</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 border border-amber-200/90 p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)] shrink-0 ring-2 ring-amber-300/40 group-hover:scale-105 transition-transform">
                  <Award className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Certified Professional Drivers</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Experienced terrain &amp; wildlife experts</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 border border-amber-200/90 p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)] shrink-0 ring-2 ring-amber-300/40 group-hover:scale-105 transition-transform">
                  <Smartphone className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Direct M-Pesa Confirmations</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Instant receipts &amp; secure booking tickets</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 border border-amber-200/90 p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)] shrink-0 ring-2 ring-amber-300/40 group-hover:scale-105 transition-transform">
                  <Headset className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">24/7 Roadside Assistance</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Rapid local concierge response across Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CORE FEATURES GRID */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">Platform Features & Services</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {services.map((s, i) => {
            const cardContent = (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="inline-flex rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700 shadow-sm group-hover:scale-110 transition-transform">
                    <s.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{s.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[3rem]">{s.desc}</p>
                </div>
                {s.cat ? (
                  <span className="mt-4 pt-3 border-t border-slate-150 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                    Explore {s.title} Catalogue →
                  </span>
                ) : (
                  <span className="mt-4 pt-3 border-t border-slate-100 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    Included in All Trips
                  </span>
                )}
              </div>
            );

            return s.cat ? (
              <Link
                key={s.title}
                to={`/catalogue?category=${s.cat}`}
                className="group card-luxe p-6 rounded-2xl border border-slate-200/80 hover:border-amber-400/50 transition flex flex-col justify-between h-full"
              >
                {cardContent}
              </Link>
            ) : (
              <motion.div
                key={s.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp} transition={{ delay: i * 0.05 }}
                className="card-luxe p-6 rounded-2xl border border-slate-200/80 hover:border-amber-400/50 transition flex flex-col justify-between h-full"
              >
                {cardContent}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-8">
        <Link to="/catalogue" className="btn-primary !px-8 !py-3 font-bold shadow-md">Browse Available Vehicles & Trips</Link>
      </div>
    </div>
  );
}

