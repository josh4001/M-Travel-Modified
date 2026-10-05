import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, Bus, Palmtree, Home, ShieldCheck, Star, ArrowRight,
  Compass, Crown, Search, CalendarCheck, Sparkles, Phone
} from 'lucide-react';
import { Hero3DCanvas } from '@/components/ui/Hero3DCanvas';
import { Card3D } from '@/components/ui/Card3D';
import { AiConciergeShowcase } from '@/components/ui/AiConciergeShowcase';
import { OffersRewards } from '@/components/ui/OffersRewards';
import { MinimalistTravelerGreeting } from '@/components/ui/MinimalistTravelerGreeting';
import { AmbientTourismLines } from '@/components/ui/AmbientTourismLines';


const journey = [
  { label: 'Explore', desc: 'Browse curated safari cruisers, luxury vans, and private villas.' },
  { label: 'Reserve', desc: 'Select your travel dates & confirm your bespoke journey in seconds.' },
  { label: 'Ride', desc: 'Enjoy full comprehensive insurance & 24/7 roadside concierge.' },
  { label: 'Arrive', desc: 'Experience Kenya in comfort with world-class hospitality and support.' },
];

const categories = [
  { icon: Car, title: 'Vehicles & Safaris', desc: '4x4 Cruisers, Luxury SUVs, Executive Vans & Safari Shuttles', count: 'Verified Hosts', to: '/catalogue?category=vehicles', iconColor: 'text-amber-600', iconBg: 'bg-amber-50/80 border-amber-200 group-hover:bg-amber-100', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { icon: Bus, title: 'Bus Reservations', desc: 'Cross-country luxury bus routes & seat selection', count: '45 routes daily', to: '/services', iconColor: 'text-purple-700', iconBg: 'bg-purple-50/80 border-purple-200 group-hover:bg-purple-100', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  { icon: Palmtree, title: 'Safari Tours', desc: 'Maasai Mara, Amboseli, Diani beach & hiking', count: '80+ packages', to: '/services', iconColor: 'text-emerald-700', iconBg: 'bg-emerald-50/80 border-emerald-200 group-hover:bg-emerald-100', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { icon: Home, title: 'Holiday Stays', desc: 'Beachfront villas, cottages & luxury apartments', count: '200+ stays', to: '/search', iconColor: 'text-teal-700', iconBg: 'bg-teal-50/80 border-teal-200 group-hover:bg-teal-100', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Landing() {
  return (
    <div className="relative overflow-hidden font-sans text-slate-900 bg-white">
      {/* 3D AMBIENT LIGHTING CANVAS */}
      <Hero3DCanvas />

      {/* HERO SECTION - PURE EXECUTIVE LUXURY */}
      <section className="relative px-6 pt-12 pb-16 md:pt-18 md:pb-24 overflow-hidden border-b border-slate-100">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            {/* HERO HEADLINE & LUXURY EXPERIENCE OVERVIEW (LEFT COLUMN) */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-7 xl:col-span-7 space-y-8 md:space-y-10 relative">
              {/* Trust Badge */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50/90 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-amber-950 shadow-2xs">
                  <Crown className="h-3.5 w-3.5 text-amber-600" /> East Africa's Premier Travel Marketplace
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-950 font-semibold bg-emerald-50/90 px-3.5 py-1 rounded-full border border-emerald-300/80">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Curated 4x4 Safari Fleets &amp; Beachfront Villas
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.08] tracking-tight md:text-7xl lg:text-[4.6rem] xl:text-[5.2rem] text-slate-950">
                Experience Kenya,
                <br />
                <span className="underline decoration-amber-500/80 underline-offset-8">
                  In Unmatched Luxury.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base md:text-xl text-slate-600 leading-relaxed font-normal">
                Seamless 4x4 safari cruiser hire, executive chauffeurs, VIP intercity coaches, and beachfront holiday villas — curated to world-class hospitality standards with white-glove concierge service.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/catalogue" className="btn-primary !px-8 !py-4 flex items-center gap-2 font-bold shadow-md hover:shadow-xl text-sm hover:scale-[1.02] transition-all">
                  <Compass className="h-4 w-4 text-amber-400" /> Explore Vehicles &amp; Safaris
                </Link>
                <Link to="/register" className="rounded-full border border-slate-300 bg-white hover:bg-amber-50/40 hover:border-amber-300 px-7 py-4 text-xs font-bold uppercase tracking-wider text-slate-900 transition-all shadow-xs hover:scale-[1.02]">
                  List Your Vehicle or Stay <ArrowRight className="h-4 w-4 inline ml-1 text-amber-700" />
                </Link>
                <a
                  href="https://wa.me/254791888840"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-6 py-4 text-xs font-bold uppercase tracking-wider text-emerald-800 transition-all shadow-xs hover:scale-[1.02]"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Concierge
                </a>
              </div>

              {/* TWIN SIGNATURE SAFARI SPECIALIST CARDS */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-400 transition-all">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                    <Compass className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                      <span>Jambo! Your Kenya Safari Specialist</span>
                      <span className="text-amber-500 font-bold">✨</span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                      Hand-inspected 4x4 Land Cruisers, executive safari vans, and coastal holiday stays.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs hover:border-emerald-400 transition-all">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                      <span>Certified PSV &amp; Safari Insured</span>
                      <span className="text-emerald-600 font-bold">✓</span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                      Full PSV insurance, vetted chauffeurs, and 24/7 emergency roadside support.
                    </p>
                  </div>
                </div>
              </div>

              {/* LIVE PLATFORM METRICS */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-slate-200 pt-6 max-w-2xl">
                <div>
                  <p className="font-mono text-3xl font-extrabold text-amber-600">500+</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Cruisers &amp; Villas</p>
                </div>
                <div>
                  <p className="font-mono text-3xl font-extrabold text-slate-950">99.2%</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">On-Time Trips</p>
                </div>
                <div>
                  <p className="font-mono text-3xl font-extrabold text-emerald-600">100%</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Verified Fleet</p>
                </div>
                <div>
                  <p className="font-mono text-3xl font-extrabold text-purple-700">24/7</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">VIP Concierge</p>
                </div>
              </div>
            </motion.div>

            {/* MINIMALIST TRAVELER GREETING & AMBIENT TOURISM SKETCH (RIGHT COLUMN) */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-5 xl:col-span-5 flex flex-col items-center lg:items-end justify-center relative mt-6 lg:mt-0"
            >
              <MinimalistTravelerGreeting />
            </motion.div>
          </div>
        </div>

        {/* AMBIENT SAFARI EXPEDITION ROUTE LINE ART */}
        <div className="relative mx-auto mt-6 max-w-4xl px-4 pointer-events-none select-none opacity-40 hidden sm:block">
          <AmbientTourismLines variant="safari-route" />
        </div>

        {/* JOURNEY PIPELINE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative mx-auto mt-10 max-w-5xl px-4"
        >
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:flex md:items-start md:justify-between">
            {/* The connector line runs right through the center of the step badges (top-5), safely above text on desktop */}
            <div className="hidden md:block absolute left-8 right-8 top-5 h-0.5 bg-slate-200" />
            {journey.map((stop, i) => {
              const stepIcons = [Search, CalendarCheck, Car, Sparkles];
              const StepIcon = stepIcons[i] || Sparkles;
              return (
                <motion.div
                  key={stop.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/70 md:bg-transparent border border-slate-200/80 md:border-transparent md:max-w-[11rem] md:px-2 shadow-2xs md:shadow-none"
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-slate-950 shadow-sm ring-4 ring-slate-100 transition-transform hover:scale-110">
                    <StepIcon className="h-4 w-4 text-slate-950" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-950">{stop.label}</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{stop.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CATEGORIES WITH 3D TACTILE CARDS - CLEAN LUXURY ENTERPRISE GRID */}
      <section className="px-6 py-20 relative bg-slate-50/70 border-b border-slate-200/80 overflow-hidden">
        {/* Subtle Ambient Savannah Horizon Background Sketch */}
        <AmbientTourismLines variant="savannah" className="absolute bottom-0 inset-x-0 opacity-25 pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-6 gap-4">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1 text-xs uppercase tracking-widest text-slate-800 font-mono font-bold mb-2 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-slate-950" /> Curated Fleet &amp; Stays
              </span>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl text-slate-950">
                Everywhere you need to go in Kenya
              </h2>
            </motion.div>

            <Link to="/catalogue" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-black transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:border-slate-400">
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
                  <Card3D intensity={10} className="p-6 h-full flex flex-col justify-between !bg-white hover:!bg-white !border-slate-200/90 hover:!border-amber-400/80 shadow-sm hover:shadow-xl transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`rounded-2xl border p-3 shadow-2xs group-hover:scale-110 transition-all ${c.iconBg} ${c.iconColor}`}>
                          <c.icon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${c.badgeColor}`}>
                          {c.count}
                        </span>
                      </div>

                      <h3 className="mt-6 text-xl font-bold text-slate-950 group-hover:text-black transition-colors">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[2.5rem] font-normal">{c.desc}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-slate-950 group-hover:text-black group-hover:translate-x-1 transition-all">
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
      <section className="relative border-y border-slate-200 bg-white px-6 py-16 overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3 relative z-10">
          {[
            { icon: ShieldCheck, title: 'Verified & Insured Fleet', desc: 'Every 4x4 cruiser and executive van undergoes rigorous mechanical inspection and carries comprehensive PSV insurance.' },
            { icon: Compass, title: 'Seamless Flexible Booking', desc: 'Reserve frictionlessly in Kenyan Shillings or international currencies with transparent, all-inclusive pricing.' },
            { icon: Star, title: 'Rigorous Quality Assurance', desc: 'Hand-vetted safari guides, transparent vehicle specs, and strict service quality standards ensure top-tier experiences from Nairobi to the Mara.' },
          ].map((f) => (
            <Card3D key={f.title} intensity={6} className="p-6 !bg-slate-50 !border-slate-200 shadow-sm hover:!border-slate-900 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3.5 text-slate-900 shadow-2xs shrink-0">
                  <f.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-lg">{f.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">{f.desc}</p>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* FINAL HIGH-IMPACT EXECUTIVE CTA */}
      <section className="relative px-6 py-20 md:py-28 overflow-hidden text-center bg-slate-50/70">
        {/* Subtle Ambient Great Rift Valley & Mt. Kenya Contour Lines */}
        <AmbientTourismLines variant="contours" className="absolute top-0 inset-x-0 opacity-20 pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-4xl relative z-10"
        >
          {/* Executive Pure Black Luxury Console */}
          <div className="relative rounded-3xl border border-slate-800 bg-black p-8 sm:p-14 text-center shadow-2xl overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-200 shadow-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-white" /> Bespoke Safari Expeditions
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl text-white">
              Ready for your next Kenya adventure?
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
              Create your free M-TRAVEL account, explore handpicked 4x4 safari fleets, and reserve your bespoke travel journey in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link
                to="/register"
                className="btn-primary !px-8 !py-3.5 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/catalogue"
                className="rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-850 px-8 py-3.5 text-sm font-bold text-white transition-all shadow-sm hover:scale-[1.02]"
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

