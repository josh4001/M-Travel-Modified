import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, Bus, Palmtree, Home, ShieldCheck, Star, ArrowRight,
  Compass, Crown, Search, CalendarCheck, Sparkles
} from 'lucide-react';
import { RouteGlobe } from '@/components/RouteGlobe';
import { Hero3DCanvas } from '@/components/ui/Hero3DCanvas';
import { Card3D } from '@/components/ui/Card3D';
import { AiConciergeShowcase } from '@/components/ui/AiConciergeShowcase';
import { OffersRewards } from '@/components/ui/OffersRewards';
import {
  LionWatermark,
  SafariCruiserWatermark
} from '@/components/ui/SafariBackgroundWatermarks';


const journey = [
  { label: 'Explore', desc: 'Browse curated safari cruisers, luxury vans, and private villas.' },
  { label: 'Reserve', desc: 'Select your travel dates & confirm your bespoke journey in seconds.' },
  { label: 'Ride', desc: 'Enjoy full comprehensive insurance & 24/7 roadside concierge.' },
  { label: 'Arrive', desc: 'Experience Kenya in comfort with world-class hospitality and support.' },
];

const categories = [
  { icon: Car, title: 'Vehicles & Safaris', desc: '4x4 Cruisers, Luxury SUVs, Executive Vans & Safari Shuttles', count: 'Verified Hosts', to: '/catalogue?category=vehicles' },
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
    <div className="relative overflow-hidden font-display text-slate-900 bg-[#F8F9FA]">
      {/* 3D BACKGROUND CANVAS */}
      <Hero3DCanvas />

      {/* HERO SECTION WITH LUXURY 4X4 EXPEDITION SUNSET PHOTOGRAPHY */}
      <section className="relative px-6 pt-10 pb-16 md:pt-14 md:pb-24 overflow-hidden">
        {/* Photographic Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-safari-luxury.jpg"
            alt="Kenya Luxury Safari 4x4 Cruiser Expedition Across Golden Dunes at Sunset"
            className="w-full h-full object-cover object-[center_35%]"
          />
          {/* Luminous gradient scrim balancing the glowing sunset, dunes & Land Cruiser with pristine typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50" />
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/30 pointer-events-none" />
        </div>

        <div className="mx-auto max-w-7xl space-y-8 md:space-y-10 relative z-10">
          {/* HERO HEADLINE & 3D GLOBE */}
          <div className="grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-2xl relative">
              {/* Trust Badge */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-sm">
                  <Crown className="h-3.5 w-3.5 text-amber-400" /> East Africa's Premier Travel Marketplace
                </span>
              </div>

              <h1 className="font-serif text-5xl font-bold leading-[1.06] tracking-tight md:text-7xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                Experience Kenya,
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                  In Unmatched Luxury.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base md:text-lg text-slate-200 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] font-medium">
                Seamless 4x4 safari cruiser hire, executive chauffeurs, VIP intercity coaches, and beachfront holiday villas — curated to world-class hospitality standards with white-glove concierge service.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/catalogue" className="btn-primary !px-7 !py-3.5 flex items-center gap-2 font-bold shadow-xl hover:shadow-2xl text-sm hover:scale-[1.02] transition-all">
                  <Compass className="h-4 w-4" /> Explore Vehicles &amp; Safaris
                </Link>
                <Link to="/register" className="rounded-xl border border-white/30 bg-slate-950/40 hover:bg-slate-950/60 backdrop-blur-md px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md hover:scale-[1.02]">
                  List Your Vehicle or Stay <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* SIGNATURE SAFARI SPECIALIST BADGE */}
              <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 shadow-xl max-w-xl">
                <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <Compass className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Jambo! Your Kenya Safari Specialist</span>
                    <span className="text-amber-400 font-bold">✨</span>
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                    Hand-inspected 4x4 Land Cruisers, executive safari vans, and coastal holiday stays ready for your Kenyan expedition.
                  </p>
                </div>
              </div>

              {/* LIVE PLATFORM METRICS */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/15 pt-6 relative">
                <div>
                  <p className="font-mono text-2xl font-bold text-white drop-shadow-sm">500+</p>
                  <p className="text-[11px] text-slate-300 font-medium">Cruisers &amp; Villas</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-white drop-shadow-sm">99.2%</p>
                  <p className="text-[11px] text-slate-300 font-medium">On-Time Trips</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-emerald-400 drop-shadow-sm">100%</p>
                  <p className="text-[11px] text-slate-300 font-medium">Verified Fleet</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-amber-400 drop-shadow-sm">24/7</p>
                  <p className="text-[11px] text-slate-300 font-medium">VIP Concierge</p>
                </div>
              </div>
            </motion.div>

            {/* 3D GLOBE (CLEAN & UNOBSTRUCTED) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
              className="perspective-1000 relative"
            >
              {/* Ambient Glow Aura */}
              <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-tr from-amber-500/25 via-amber-400/10 to-rose-500/15 blur-2xl opacity-75 -z-10" />
              <RouteGlobe />
            </motion.div>
          </div>
        </div>

        {/* JOURNEY PIPELINE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative mx-auto mt-14 max-w-5xl px-4"
        >
          <div className="relative flex items-start justify-between">
            {/* The connector line runs right through the center of the step badges (top-5), safely above text */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-amber-400/35" />
            {journey.map((stop, i) => {
              const stepIcons = [Search, CalendarCheck, Car, Sparkles];
              const StepIcon = stepIcons[i] || Sparkles;
              return (
                <motion.div
                  key={stop.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center text-center max-w-[11rem] px-2"
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/70 border-2 border-amber-400 shadow-md ring-4 ring-black/20 backdrop-blur-md transition-transform hover:scale-110">
                    <StepIcon className="h-4 w-4 text-amber-300" />
                  </div>
                  <h4 className="mt-3 font-serif text-sm font-bold text-white drop-shadow-sm">{stop.label}</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{stop.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CATEGORIES WITH 3D TACTILE CARDS */}
      <section className="px-6 py-20 relative bg-white border-y border-slate-200/70 overflow-hidden">

        {/* Subtle Watermarks */}
        <LionWatermark className="top-4 right-1/4 w-72 h-72 opacity-[0.025] md:opacity-[0.04]" />
        <SafariCruiserWatermark className="bottom-2 left-1/4 w-80 h-40 opacity-[0.025] md:opacity-[0.04]" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200/80 pb-6 gap-4">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs uppercase tracking-widest text-amber-700 font-bold">
                Curated Fleet &amp; Stays
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
                Everywhere you need to go in Kenya
              </h2>
            </motion.div>

            <Link to="/catalogue" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800">
              View all offerings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {categories.map((c, i) => (
              <motion.div
                key={c.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp} transition={{ delay: i * 0.08 }}
                className="h-full"
              >
                <Link to={c.to} className="block group h-full">
                  <Card3D intensity={10} className="p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700 shadow-sm group-hover:scale-110 transition-transform">
                          <c.icon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          {c.count}
                        </span>
                      </div>

                      <h3 className="mt-6 font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[2.5rem]">{c.desc}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                      Explore category <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Card3D>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* M-TRAVEL PRIVILEGE CLUB & SPECIAL OFFERS SECTION */}
      <OffersRewards />

      {/* AI SAFARI & TOUR CONCIERGE SHOWCASE SECTION */}
      <AiConciergeShowcase />

      {/* TRUST & INFRASTRUCTURE STRIP */}
      <section className="border-b border-slate-200/70 bg-[#FAF8F5] px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Verified & Insured Fleet', desc: 'Every 4x4 cruiser and executive van undergoes rigorous mechanical inspection and carries comprehensive PSV insurance.' },
            { icon: Compass, title: 'Seamless Flexible Booking', desc: 'Reserve frictionlessly in Kenyan Shillings or international currencies with transparent, all-inclusive pricing.' },
            { icon: Star, title: 'Rigorous Quality Assurance', desc: 'Hand-vetted safari guides, transparent vehicle specs, and strict service quality standards ensure top-tier experiences from Nairobi to the Mara.' },
          ].map((f) => (
            <Card3D key={f.title} intensity={6} className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-700 shadow-sm shrink-0">
                  <f.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-lg">{f.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* FINAL HIGH-IMPACT CTA WITH REAL SAFARI EXPEDITION PHOTOGRAPHY */}
      <section className="relative px-6 py-24 md:py-36 overflow-hidden text-center">
        {/* Photographic Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/adventure-safari.jpg"
            alt="Kenya Safari 4x4 Cruiser Expedition at Sunset"
            className="w-full h-full object-cover object-[center_60%]"
          />
          {/* Luminous warm vignette overlay preserving the golden sunset & landscape */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-black/15 to-slate-950/35" />
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/25 pointer-events-none" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-3xl relative z-10"
        >
          {/* Ambient Golden Safari Backlight Glow */}
          <div className="absolute -inset-1.5 rounded-[36px] bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 blur-2xl opacity-65 pointer-events-none -z-10" />

          {/* Ultra-Sheer Luxury Glass Console */}
          <div className="relative rounded-3xl border border-white/20 bg-slate-950/15 backdrop-blur-[3px] p-8 sm:p-12 md:p-14 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-amber-400/30 overflow-hidden">
            {/* Subtle inner glass gradient shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-200 shadow-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Bespoke Safari Expeditions
            </div>

            <h2 className="font-serif text-3xl font-bold tracking-tight md:text-5xl text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.95)]">
              Ready for your next Kenya adventure?
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-100 max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] font-medium">
              Create your free M-TRAVEL account, explore handpicked 4x4 safari fleets, and reserve your bespoke travel journey in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link
                to="/register"
                className="btn-primary !px-8 !py-3.5 text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/catalogue"
                className="rounded-xl border border-white/35 bg-slate-950/30 hover:bg-slate-950/50 backdrop-blur-sm px-8 py-3.5 text-sm font-bold text-white transition-all shadow-md hover:scale-[1.02]"
              >
                Browse Full Fleet
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

