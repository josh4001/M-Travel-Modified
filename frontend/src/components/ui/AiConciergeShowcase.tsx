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
    <section className="px-6 py-20 relative bg-white border-y border-slate-200/70 overflow-hidden">
      {/* BACKGROUND DECORATIVE ACCENTS */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10 space-y-12">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800 shadow-sm">
            <Bot className="h-4 w-4 text-amber-600" />
            <span>M-TRAVEL AI Travel Concierge</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Your Dedicated Safari & Travel AI,{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent">Available 24/7</span>
          </h2>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Planning a journey across Kenya has never been simpler. Our intelligent concierge provides real-time
            safari planning, vehicle recommendations, route budget calculations, and local travel advice in seconds.
          </p>
        </div>

        {/* 4 FEATURE CAPABILITY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="group relative rounded-2xl border border-slate-200/80 bg-[#FAF8F5] p-6 shadow-sm hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-amber-700 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <cap.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase font-mono">
                    {cap.tag}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Instant AI Consultation</span>
              </div>
            </div>
          ))}
        </div>

        {/* INTERACTIVE PREVIEW & LAUNCH BANNER */}
        <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT: SAMPLE DIALOGUE PREVIEW */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Live Travel Intelligence Preview</span>
              </div>

              {/* MOCK CHAT MESSAGES */}
              <div className="space-y-3 bg-white/90 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                {/* USER QUERY */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-none bg-amber-500 text-white p-3 text-xs md:text-sm font-medium shadow-sm">
                    What vehicle do I need for a 4-person safari to Maasai Mara in July?
                  </div>
                </div>

                {/* AI RESPONSE */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-xl rounded-2xl rounded-tl-none border border-slate-200 bg-slate-50/70 p-3 text-xs md:text-sm text-slate-800 space-y-1.5 shadow-sm">
                    <p className="font-semibold text-slate-900">
                      Recommendation: 4x4 Toyota Land Cruiser Safari Edition
                    </p>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      July is peak Great Migration season. A 4x4 Land Cruiser with a pop-up roof is ideal: high clearance
                      navigates rough terrain during Mara river crossings, and 360° roof visibility ensures premier wildlife viewing for 4 passengers.
                    </p>
                  </div>
                </div>
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Try asking the concierge:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleLaunch(question)}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 font-semibold hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 transition shadow-xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3 w-3 text-amber-600" />
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: CTA & FLOATING CONCIERGE CALLOUT */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center text-center p-6 bg-slate-900 rounded-2xl text-white shadow-lg space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-teal flex items-center justify-center shadow-lg">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-white">Ask the AI Concierge Now</h3>
                <p className="mt-1 text-xs text-slate-300 max-w-xs leading-relaxed">
                  Open an interactive session for instant trip planning, cost breakdowns, and live fleet advice.
                </p>
              </div>

              <button
                onClick={() => handleLaunch()}
                className="btn-primary w-full !py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Chatting with Concierge</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-2 text-[11px] text-slate-400">
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
