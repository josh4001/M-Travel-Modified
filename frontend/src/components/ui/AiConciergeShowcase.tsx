import React from 'react';
import {
  Bot,
  Sparkles,
  Compass,
  Car,
  Calculator,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const AI_CAPABILITIES = [
  {
    icon: Compass,
    title: 'Custom Safari Itineraries',
    desc: 'Bespoke day-by-day plans for Maasai Mara, Amboseli, Samburu, and Diani Beach tailored to your group size, travel dates, and budget.',
    tag: 'Bespoke Routes',
  },
  {
    icon: Car,
    title: 'Smart Fleet Matching',
    desc: 'Get matched with the ideal ride — rugged 4x4 Land Cruisers with pop-up safari roofs, executive vans, or luxury group coaster buses.',
    tag: 'Verified 4x4 Fleet',
  },
  {
    icon: Calculator,
    title: 'Transparent Cost Estimates',
    desc: 'Instant calculations covering park conservation fees, fuel estimates, driver allowances, and transparent daily vehicle hire rates.',
    tag: 'Live Calculations',
  },
  {
    icon: ShieldCheck,
    title: 'Local Travel Advisory & Prep',
    desc: 'Up-to-date guidance on Great Migration seasons, visa requirements, packing checklists, health advisories, and local M-Pesa payments.',
    tag: '24/7 Advice',
  },
];

const PRESET_QUESTIONS = [
  'Plan a Maasai Mara safari for 4 people',
  'What 4x4 vehicle do I need for Amboseli?',
  'How much is a luxury Diani Beach trip?',
  'How does direct M-Pesa payment work?',
];

export const AiConciergeShowcase: React.FC = () => {
  const handleLaunch = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent('open-ai-concierge', {
        detail: { prompt },
      })
    );
  };

  return (
    <section className="px-6 py-20 relative bg-[#D4BEA3] border-y border-[#BA9E7E] overflow-hidden">
      {/* BACKGROUND DECORATIVE ACCENTS */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-800/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10 space-y-12">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-100/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-950 shadow-2xs">
            <Bot className="h-4 w-4 text-amber-800" />
            <span>M-TRAVEL AI Travel Concierge</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1A0D05] tracking-tight">
            Your Dedicated Safari &amp; Travel AI,{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent">Available 24/7</span>
          </h2>

          <p className="text-[#452C1A] text-sm md:text-base leading-relaxed font-medium">
            Planning a journey across Kenya has never been simpler. Our intelligent concierge provides real-time
            safari planning, vehicle recommendations, route budget calculations, and local travel advice in seconds.
          </p>
        </div>

        {/* 4 FEATURE CAPABILITY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="group relative rounded-2xl border border-[#BA9E7E] bg-[#F8F2EA] p-6 shadow-sm hover:border-amber-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-amber-100/90 border border-amber-400 flex items-center justify-center text-amber-900 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-2xs">
                    <cap.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#C4AC90] border border-[#AF9374] px-2.5 py-0.5 text-[10px] font-bold text-[#1A0D05] uppercase font-mono">
                    {cap.tag}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A0D05] group-hover:text-amber-900 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#452C1A] leading-relaxed font-medium">{cap.desc}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#D9C4AC] flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>Instant AI Consultation</span>
              </div>
            </div>
          ))}
        </div>

        {/* INTERACTIVE PREVIEW & LAUNCH BANNER */}
        <div className="rounded-3xl border border-[#BA9E7E] bg-[#F8F2EA] p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT: SAMPLE DIALOGUE PREVIEW */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-800" />
                <span>Live Travel Intelligence Preview</span>
              </div>

              {/* MOCK CHAT MESSAGES */}
              <div className="space-y-3 bg-white rounded-2xl border border-[#BA9E7E] p-4 shadow-2xs">
                {/* USER QUERY */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-none bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold p-3 text-xs md:text-sm shadow-sm">
                    What vehicle do I need for a 4-person safari to Maasai Mara in July?
                  </div>
                </div>

                {/* AI RESPONSE */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-xl rounded-2xl rounded-tl-none border border-[#BA9E7E] bg-[#F8F2EA] p-3 text-xs md:text-sm text-[#1A0D05] space-y-1.5 shadow-2xs">
                    <p className="font-bold text-[#1A0D05]">
                      Recommendation: 4x4 Toyota Land Cruiser Safari Edition
                    </p>
                    <p className="text-[#452C1A] leading-relaxed text-xs font-medium">
                      July is peak Great Migration season. A 4x4 Land Cruiser with a pop-up roof is ideal: high clearance
                      navigates rough terrain during Mara river crossings, and 360° roof visibility ensures premier wildlife viewing for 4 passengers.
                    </p>
                  </div>
                </div>
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#664933] uppercase tracking-wider">
                  Try asking the concierge:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleLaunch(question)}
                      className="rounded-full border border-[#BA9E7E] bg-white px-3.5 py-1.5 text-xs text-[#1A0D05] font-bold hover:border-amber-700 hover:bg-amber-50 hover:text-amber-950 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3 text-amber-800" />
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: CTA & FLOATING CONCIERGE CALLOUT */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-[#24150c] via-[#1a0f07] to-[#140b05] border border-amber-600/30 rounded-2xl text-white shadow-xl space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg">
                  <Bot className="h-8 w-8" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#1a0f07] animate-pulse" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-amber-100">Ask the AI Concierge Now</h3>
                <p className="mt-1 text-xs text-amber-100/75 max-w-xs leading-relaxed font-medium">
                  Open an interactive session for instant trip planning, cost breakdowns, and live fleet advice.
                </p>
              </div>

              <button
                onClick={() => handleLaunch()}
                className="btn-primary w-full !py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Chatting with Concierge</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <div className="pt-2 border-t border-[#3b2516] w-full flex items-center justify-center gap-2 text-[11px] text-amber-200/60 font-medium">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Always available via the floating button at bottom right</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
