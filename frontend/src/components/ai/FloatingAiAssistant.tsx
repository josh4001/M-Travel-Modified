import { useState } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { AiTravelAssistant } from './AiTravelAssistant';

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && (
          <div className="mb-2 hidden sm:flex items-center gap-2 rounded-full border border-marigold/40 bg-ink-50/95 px-3.5 py-1.5 backdrop-blur-md shadow-3d-glow animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-marigold" />
            <span className="text-xs font-semibold text-bone">Ask AI Safari Guide & Cost Calculator</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-marigold via-coral to-teal text-ink shadow-3d-glow transition-transform duration-300 hover:scale-110 active:scale-95"
          title="Open M-TRAVEL AI Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-ink stroke-[2.5]" />
          ) : (
            <>
              <Bot className="h-7 w-7 text-ink" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-ink border-2 border-ink animate-pulse">
                •
              </span>
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
