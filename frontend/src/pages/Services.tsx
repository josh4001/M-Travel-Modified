import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Bus, Palmtree, Home, Wallet, ShieldCheck, MapPinned, Headset } from 'lucide-react';
import { CatalogueTabs } from '@/components/ui/CatalogueTabs';
import { PinterestThemes } from '@/components/ui/PinterestThemes';

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
    title: 'Live maps & tracking',
    desc: 'Google Maps-powered search, live directions, and nearby results for vehicles, homes, and tours.',
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
        <span className="mb-4 inline-block rounded-full border border-marigold/30 bg-marigold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-marigold font-display">
          What we offer
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-bone">
          Everything you need to travel, in one place.
        </h1>
        <p className="mt-4 max-w-2xl text-bone/70">
          M-TRAVEL brings vehicle hire, bus travel, tours, and holiday homes together under a
          single account, a single wallet, and a single support line.
        </p>
      </motion.div>

      {/* INTERACTIVE CATALOGUE TABS */}
      <CatalogueTabs />

      {/* PINTEREST TOURISM MOOD BOARDS */}
      <PinterestThemes />

      {/* CORE FEATURES GRID */}
      <div>
        <h2 className="font-display text-2xl font-bold text-bone mb-6">Platform Features & Services</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const cardContent = (
              <>
                <s.icon className="h-7 w-7 text-marigold group-hover:scale-110 transition-transform" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg font-bold text-bone group-hover:text-marigold transition-colors">{s.title}</h3>
                <p className="mt-2 text-xs text-bone/60 leading-relaxed">{s.desc}</p>
                {s.cat && (
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-marigold font-mono group-hover:underline">
                    Explore {s.title} Catalogue →
                  </span>
                )}
              </>
            );

            return s.cat ? (
              <Link
                key={s.title}
                to={`/catalogue?category=${s.cat}`}
                className="group glass-card p-6 rounded-2xl border border-white/10 hover:border-marigold/40 transition block"
              >
                {cardContent}
              </Link>
            ) : (
              <motion.div
                key={s.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp} transition={{ delay: i * 0.05 }}
                className="glass-card p-6 rounded-2xl border border-white/10 hover:border-marigold/40 transition"
              >
                {cardContent}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-8">
        <Link to="/search" className="btn-primary shadow-glow !px-8 !py-3 font-bold">Browse Available Vehicles & Trips</Link>
      </div>
    </div>
  );
}

