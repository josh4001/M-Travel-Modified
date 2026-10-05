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

import { getStoredDestinations } from '@/lib/destinationsStore';
import { getStoredVehicles, isVehicleLive } from '@/lib/bookingStore';

const AI_CAPABILITIES = [
  {
    icon: Compass,
    title: 'Custom Safari Itineraries',
    desc: 'Bespoke day-by-day plans tailored to your group size, travel dates, and budget across verified Kenya travel destinations.',
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

export const AiConciergeShowcase: React.FC = () => {
  const [presetQuestions, setPresetQuestions] = React.useState<string[]>([
    'What vehicles are available for hire?',
    'How does direct M-Pesa payment work?',
    'What are Kenya travel visa requirements?',
    'What should I pack for safari?',
  ]);

  React.useEffect(() => {
    const updateQuestions = () => {
      const dests = getStoredDestinations().filter((d) => d.isLive !== false);
      const vehs = getStoredVehicles().filter(
        (v) => isVehicleLive(v.id) && (v.status || '').toUpperCase() === 'APPROVED'
      );
      const questions: string[] = [];

      if (dests.length > 0) {
        questions.push(`Plan a trip to ${dests[0].title}`);
        if (dests.length > 1) {
          questions.push(`Tell me about ${dests[1].title}`);
        }
      }
      if (vehs.length > 0) {
        questions.push(`Is the ${vehs[0].make} ${vehs[0].model} available?`);
      }
      questions.push('How does direct M-Pesa payment work?');
      if (questions.length < 4) {
        questions.push('What should I pack for a safari?');
      }
      if (dests.length === 0 && vehs.length === 0) {
        questions.unshift('Are any tours or vehicles available right now?');
      }
      setPresetQuestions(questions.slice(0, 4));
    };

    updateQuestions();
    window.addEventListener('mt_destinations_updated', updateQuestions);
    window.addEventListener('mt_vehicle_updated', updateQuestions);
    return () => {
      window.removeEventListener('mt_destinations_updated', updateQuestions);
      window.removeEventListener('mt_vehicle_updated', updateQuestions);
    };
  }, []);
  const handleLaunch = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent('open-ai-concierge', {
        detail: { prompt },
      })
    );
  };

  return (
    <section className="px-6 py-20 relative bg-white border-y border-slate-200 overflow-hidden font-sans">
      <div className="mx-auto max-w-7xl relative z-10 space-y-12">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
            <Bot className="h-4 w-4 text-slate-950" />
            <span>M-TRAVEL AI Travel Concierge</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
            Your Dedicated Safari &amp; Travel AI,{' '}
            <span className="underline decoration-slate-400 underline-offset-8">
              Available 24/7
            </span>
          </h2>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed font-normal max-w-3xl mx-auto">
            Planning a journey across Kenya has never been simpler. Our intelligent concierge provides real-time
            safari planning, vehicle recommendations, route budget calculations, and local travel advice in seconds.
          </p>
        </div>

        {/* 4 FEATURE CAPABILITY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="group relative rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white p-6 shadow-xs hover:shadow-xl hover:border-slate-900 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 group-hover:scale-110 group-hover:bg-slate-200 transition-all duration-300 shadow-2xs">
                    <cap.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-200/80 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 uppercase font-mono">
                    {cap.tag}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-950 group-hover:text-black transition-colors">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">{cap.desc}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Instant AI Consultation</span>
              </div>
            </div>
          ))}
        </div>

        {/* INTERACTIVE PREVIEW & LAUNCH BANNER */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT: SAMPLE DIALOGUE PREVIEW */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-slate-950" />
                <span>Live Travel Intelligence Preview</span>
              </div>

              {/* MOCK CHAT MESSAGES */}
              <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                {/* USER QUERY */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-none bg-slate-950 text-white font-semibold p-3 text-xs md:text-sm shadow-xs">
                    What vehicle do I need for a 4-person safari to Maasai Mara in July?
                  </div>
                </div>

                {/* AI RESPONSE */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-950 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="max-w-xl rounded-2xl rounded-tl-none border border-slate-200 bg-slate-50 p-3 text-xs md:text-sm text-slate-900 space-y-1.5 shadow-2xs">
                    <p className="font-bold text-slate-950">
                      Recommendation: 4x4 Toyota Land Cruiser Safari Edition
                    </p>
                    <p className="text-slate-600 leading-relaxed text-xs font-normal">
                      July is peak Great Migration season. A 4x4 Land Cruiser with a pop-up roof is ideal: high clearance
                      navigates rough terrain during Mara river crossings, and 360° roof visibility ensures premier wildlife viewing for 4 passengers.
                    </p>
                  </div>
                </div>
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Try asking the concierge:
                </span>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleLaunch(question)}
                      className="rounded-full border border-slate-300 bg-white hover:bg-slate-100 px-3.5 py-1.5 text-xs text-slate-800 font-semibold hover:border-slate-900 hover:text-slate-950 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3 text-slate-950" />
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: CTA & FLOATING CONCIERGE CALLOUT */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center text-center p-6 bg-black border border-slate-800 rounded-2xl text-white shadow-xl space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-white text-slate-950 flex items-center justify-center shadow-lg">
                  <Bot className="h-8 w-8" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
              </div>

              <div>
                <h3 className="font-bold text-xl text-white">Ask the AI Concierge Now</h3>
                <p className="mt-1 text-xs text-slate-300 max-w-xs leading-relaxed font-normal">
                  Open an interactive session for instant trip planning, cost breakdowns, and live fleet advice.
                </p>
              </div>

              <button
                onClick={() => handleLaunch()}
                className="w-full rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all cursor-pointer border border-white"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Chatting with Concierge</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Always available via the floating button at bottom right</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
