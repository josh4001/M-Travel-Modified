import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Sparkles, X } from 'lucide-react';
import { AiTravelAssistant } from './AiTravelAssistant';

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Hide on auth pages to avoid obstructing the login/register forms
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* FLOATING CONCIERGE BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2.5 rounded-full bg-slate-950/95 text-white border border-amber-400/40 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:border-amber-400 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Open M-TRAVEL AI Safari Concierge"
        >
          {isOpen ? (
            <>
              <X className="h-4 w-4 text-slate-300 group-hover:text-white" />
              <span className="text-xs font-bold text-slate-200">Close</span>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <Bot className="h-4 w-4 text-amber-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
              </div>
              <span className="text-xs font-bold tracking-wide font-display text-white">AI Concierge</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400/80" />
            </>
          )}
        </button>
      </div>

      {/* OVERLAY MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl">
            <AiTravelAssistant isModal onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
