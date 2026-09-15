import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Bus, Palmtree, Home, ShieldCheck, Wallet, Star, ArrowRight, Bot, Compass, Crown } from 'lucide-react';
import { RouteGlobe } from '@/components/RouteGlobe';
import { Hero3DCanvas } from '@/components/ui/Hero3DCanvas';
import { Card3D } from '@/components/ui/Card3D';
import { AiTravelAssistant } from '@/components/ai/AiTravelAssistant';
import { BookingSearch } from '@/components/ui/BookingSearch';
import { OffersRewards } from '@/components/ui/OffersRewards';
import { TrackerWidget } from '@/components/ui/TrackerWidget';

const journey = [
  { label: 'Search', desc: 'Browse vehicles, buses, tours, and homes near you.' },
  { label: 'Book', desc: 'Pick your dates & pay instantly via M-Pesa STK.' },
  { label: 'Ride', desc: 'Track your driver live and chat with concierge.' },
  { label: 'Arrive', desc: 'Rate your trip & earn Privilege M-Pesa points.' },
];

const categories = [
  { icon: Car, title: 'Vehicles & Safaris', desc: '4x4 Cruisers, SUVs, Alphards, Trucks & boda bodas', count: '120+ available', to: '/search' },
  { icon: Bus, title: 'Bus Reservations', desc: 'Cross-country luxury bus routes & seat selection', count: '45 routes daily', to: '/services' },
  { icon: Palmtree, title: 'Safari Tours', desc: 'Maasai Mara, Amboseli, Diani beach & hiking', count: '80+ packages', to: '/services' },
  { icon: Home, title: 'Holiday Stays', desc: 'Beachfront villas, cottages & luxury apartments', count: '200+ stays', to: '/search' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Landing() {
  return (
    <div className="relative overflow-hidden font-display text-bone">
      {/* 3D BACKGROUND CANVAS */}
      <Hero3DCanvas />

      {/* HERO SECTION WITH M-TRAVEL LUXURY FLOATING SEARCH WIDGET */}
      <section className="relative px-6 pt-12 pb-20 md:pt-16">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* HERO HEADLINE & 3D GLOBE */}
          <div className="grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-mtravel-gold/40 bg-mtravel-burgundy/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-mtravel-lightGold backdrop-blur-md shadow-3d-sm">
                  <Crown className="h-3.5 w-3.5 text-mtravel-gold" /> East Africa's Premier Travel Marketplace
                </span>
              </div>

              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                Experience Kenya,
                <br />
                <span className="bg-gold-gradient bg-clip-text text-transparent">In Unmatched Luxury.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base md:text-lg text-bone/80 leading-relaxed">
                Seamless vehicle hire, safari cruises, bus express reservations, and beachfront villas — 
                curated to the highest luxury travel standards, paid instantly with M-PESA.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/search" className="btn-primary !bg-gold-gradient text-mtravel-obsidian font-bold shadow-gold-glow !px-7 !py-3.5 flex items-center gap-2">
                  <Compass className="h-4 w-4" /> Explore Vehicles & Safaris
                </Link>
                <Link to="/register" className="btn-ghost !px-6 !py-3.5 text-xs font-bold uppercase tracking-wider">
                  List Your Vehicle <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
              className="perspective-1000"
            >
              <div className="glass-card-3d p-4 shadow-3d-glow border-mtravel-gold/20">
                <RouteGlobe />
                <div className="mt-3 text-center text-xs text-bone/60 flex items-center justify-center gap-2 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Kenyan Destination & Route Network
                </div>
              </div>
            </motion.div>
          </div>

          {/* M-TRAVEL SIGNATURE TABBED SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="pt-4"
          >
            <BookingSearch />
          </motion.div>
        </div>

        {/* JOURNEY PIPELINE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative mx-auto mt-20 max-w-5xl px-4"
        >
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gold-gradient opacity-40 shadow-gold-glow" />
            {journey.map((stop, i) => (
              <motion.div
                key={stop.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-mtravel-obsidian border border-mtravel-gold shadow-gold-glow">
                  <span className="h-2.5 w-2.5 rounded-full bg-mtravel-gold animate-ping" />
                  <span className="absolute h-2 w-2 rounded-full bg-mtravel-gold" />
                </span>
                <p className="mt-3 font-serif text-sm font-bold text-bone">{stop.label}</p>
                <p className="mt-1 hidden max-w-[9rem] text-xs text-bone/50 sm:block">{stop.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* M-TRAVEL PRIVILEGE CLUB & SPECIAL OFFERS SECTION */}
      <OffersRewards />

      {/* LIVE TRANSPORT TRACKER SECTION */}
      <section className="px-6 py-12 relative bg-gradient-to-b from-transparent via-mtravel-burgundy/20 to-transparent">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mtravel-gold/20 border border-mtravel-gold/40 px-3.5 py-1 text-xs font-mono font-bold text-mtravel-lightGold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Easy & Simple Live Tracking
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-bone">
              Track Your Trip & Driver
            </h2>
            <p className="mt-2 text-xs md:text-sm text-bone/70">
              Already booked? Enter your booking reference or M-PESA code below for real-time status.
            </p>
          </div>

          <TrackerWidget />
        </div>
      </section>

      {/* AI SAFARI & TOUR CONCIERGE FEATURED SECTION */}
      <section className="px-6 py-16 relative bg-gradient-to-b from-transparent via-ink-100/50 to-transparent">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mtravel-gold/20 px-3.5 py-1 text-xs font-bold text-mtravel-lightGold border border-mtravel-gold/30">
              <Bot className="h-4 w-4 text-mtravel-gold" /> M-TRAVEL AI Travel Concierge
            </span>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl font-bold text-bone">
              Ask. Plan. Book with M-PESA.
            </h2>
            <p className="mt-2 text-bone/70 text-sm md:text-base">
              Our AI concierge answers any travel question — destination guides, vehicle recommendations, cost breakdowns, visa info, packing lists, safety tips, and live booking links. All in one conversation.
            </p>
          </div>

          <AiTravelAssistant />
        </div>
      </section>

      {/* CATEGORIES WITH 3D TILT */}
      <section className="px-6 py-20 relative">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between border-b border-white/10 pb-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs uppercase tracking-widest text-mtravel-lightGold font-mono font-bold">Premium Services</span>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight md:text-4xl">
                Everywhere you need to go in Kenya
              </h2>
            </motion.div>

            <Link to="/search" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-mtravel-lightGold hover:underline">
              View all vehicles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <motion.div
                key={c.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp} transition={{ delay: i * 0.08 }}
              >
                <Link to={c.to} className="block group">
                  <Card3D intensity={12} className="p-6 border-mtravel-gold/20 hover:border-mtravel-gold/50">
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl border border-mtravel-gold/40 bg-mtravel-burgundy/40 p-3 text-mtravel-lightGold shadow-3d-sm group-hover:scale-110 transition-transform">
                        <c.icon className="h-7 w-7" strokeWidth={1.75} />
                      </div>
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-mono text-bone/60">
                        {c.count}
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-xl font-bold text-bone group-hover:text-mtravel-lightGold transition-colors">{c.title}</h3>
                    <p className="mt-1.5 text-xs text-bone/60 leading-relaxed">{c.desc}</p>

                    <div className="mt-6 flex items-center gap-1 text-xs font-bold text-mtravel-lightGold group-hover:translate-x-1 transition-transform">
                      Explore category <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Card3D>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & INFRASTRUCTURE STRIP */}
      <section className="border-y border-white/10 bg-mtravel-gradient px-6 py-16 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Verified & Secure', desc: 'Insured vehicles, vetted owners, encrypted M-Pesa STK Push payments.' },
            { icon: Wallet, title: 'Unified M-Pesa Wallet', desc: 'Earn, spend, and withdraw instantly across every safari and car rental.' },
            { icon: Star, title: 'Rated by Travelers', desc: 'Verified reviews and transparent ratings for every journey.' },
          ].map((f) => (
            <Card3D key={f.title} intensity={8} className="p-6 border-mtravel-gold/20">
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-mtravel-gold/40 bg-mtravel-burgundy/40 p-3 text-mtravel-lightGold shadow-3d-sm">
                  <f.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-bone text-lg">{f.title}</h4>
                  <p className="mt-1 text-xs text-bone/70 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 text-center relative">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="mx-auto max-w-xl">
          <Card3D intensity={15} className="p-10 text-center border-mtravel-gold/40 bg-mtravel-gradient">
            <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl text-bone">
              Ready for your next Kenya adventure?
            </h2>
            <p className="mt-4 text-sm text-bone/80">Create your free M-TRAVEL account and book your next luxury travel experience in seconds with M-PESA.</p>
            <Link to="/register" className="btn-primary mt-8 shadow-gold-glow !bg-gold-gradient text-mtravel-obsidian font-bold">
              Get Started Free
            </Link>
          </Card3D>
        </motion.div>
      </section>
    </div>
  );
}

