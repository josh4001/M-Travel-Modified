import React from 'react';
import { Star, CheckCircle2, MapPin, Car, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestimonialStory {
  name: string;
  location: string;
  experience: string;
  destination: string;
  vehicle: string;
  avatarUrl: string;
  sceneryUrl: string;
  quote: string;
  rating: number;
}

const stories: TestimonialStory[] = [
  {
    name: 'Sarah & David Jenkins',
    location: 'London, United Kingdom',
    experience: 'Maasai Mara Great Migration Game Drive',
    destination: 'Maasai Mara National Reserve',
    vehicle: '4x4 Safari Land Cruiser (Pop-up Roof)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    sceneryUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    quote: 'The 4x4 Land Cruiser was spotless and tackled the Mara terrain effortlessly. Spotting a lion pride at dawn with our driver-guide was an unforgettable highlight!',
    rating: 5,
  },
  {
    name: 'Amina, Tariq & Family',
    location: 'Nairobi & Dubai',
    experience: 'Diani Beach & Shimba Hills Coastal Holiday',
    destination: 'Diani Beach & Coast',
    vehicle: 'Executive Safari Van & Palm Villa',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    sceneryUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    quote: 'Having our safari van waiting right at Ukunda airstrip to take us to our beachfront villa made the entire family holiday completely stress-free. 10/10 hospitality!',
    rating: 5,
  },
  {
    name: 'Marcus Vance',
    location: 'Cape Town, South Africa',
    experience: 'Amboseli Big Tusker Safari',
    destination: 'Amboseli National Park',
    vehicle: '4x4 Rugged Safari Cruiser',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    sceneryUrl: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
    quote: 'Seeing large elephant herds cross the dry salt pans with Mount Kilimanjaro towering in the background was awe-inspiring. M-Travel took care of every detail.',
    rating: 5,
  },
];

export const TravelerSmilesShowcase: React.FC = () => {
  return (
    <section className="py-20 px-6 relative bg-white border-y border-slate-200/70 overflow-hidden font-display">
      {/* Subtle ambient savannah aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* ── SECTION HEADER WITH SMILING TRAVELER MICRO-BADGE ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-8">
          <div>
            {/* Friendly Smiling Statement Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-300 bg-amber-50/80 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-2xs mb-3">
              <div className="flex -space-x-1.5 overflow-hidden">
                <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Smiling Explorer" />
                <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Smiling Explorer" />
                <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="Smiling Explorer" />
              </div>
              <span className="uppercase tracking-widest text-[10px] font-black">
                Genuine Smiles from 42+ Countries
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Real Expeditions, <span className="bg-gold-gradient bg-clip-text text-transparent">Genuine Smiles</span>
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
              From thrilling Big Five encounters in the Maasai Mara to relaxed walks under Diani's palm trees, discover how travelers experience Kenya in style.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl shadow-2xs self-start md:self-auto">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>100% Verified Guest Reviews</span>
          </div>
        </div>

        {/* ── 3 VIBRANT TRAVELER STORY CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {stories.map((story) => (
            <div
              key={story.name}
              className="group rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:border-amber-300"
            >
              {/* Card Photo Header (Destination & Vehicle Context) */}
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={story.sceneryUrl}
                  alt={story.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Destination Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-900 border border-white/40 shadow-xs">
                    <MapPin className="h-3 w-3 text-amber-600" />
                    {story.destination}
                  </span>
                </div>

                {/* Vehicle Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                  <span className="flex items-center gap-1 font-semibold truncate bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <Car className="h-3 w-3 text-amber-400 shrink-0" />
                    {story.vehicle}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {/* 5-Star Rating & Verified Trip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Trip
                  </span>
                </div>

                {/* Quote */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                  "{story.quote}"
                </p>

                {/* Author with Smiling Avatar */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={story.avatarUrl}
                      alt={story.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/80 shadow-2xs"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{story.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{story.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CALL TO ACTION STRIP ── */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-500/10 border border-amber-300/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Ready to embark on your bespoke Kenya safari?</p>
              <p className="text-slate-600 text-xs">Explore all 4x4 cruisers, executive vans, and coastal holiday packages.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/catalogue"
              className="btn-primary !px-6 !py-2.5 text-xs font-bold shadow-xs flex items-center gap-2"
            >
              <Car className="h-3.5 w-3.5" /> Explore Live Fleet
            </Link>
            <a
              href="https://wa.me/254791888840"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !px-5 !py-2.5 text-xs font-bold"
            >
              WhatsApp Concierge
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
