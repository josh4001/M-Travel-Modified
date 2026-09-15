import React from 'react';

interface MpesaLogoProps {
  className?: string;
  variant?: 'badge' | 'button' | 'icon' | 'card' | 'inline';
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

export const MpesaLogo: React.FC<MpesaLogoProps> = ({
  className = '',
  variant = 'button',
  label = 'Pay with M-PESA',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  size = 'md',
}) => {
  const logoImage = (
    <img
      src="/mpesa-logo.png"
      alt="M-PESA Official"
      className={`object-contain shrink-0 transition-transform duration-300 rounded ${
        size === 'sm' ? 'h-5 w-auto' : size === 'lg' ? 'h-9 w-auto' : 'h-7 w-auto'
      }`}
    />
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {logoImage}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 font-bold text-emerald-400 ${className}`}>
        {logoImage}
        <span>M-PESA Express</span>
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00A859] to-[#008C4A] px-3 py-1.5 text-xs font-bold text-white shadow-md border border-emerald-400/30 ${className}`}>
        {logoImage}
        <span className="text-[10px] uppercase font-mono tracking-wider bg-black/25 px-2 py-0.5 rounded-full text-emerald-200">
          STK Express Verified
        </span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#00A859]/20 via-ink-100 to-ink-50 p-4 text-bone shadow-3d-md ${className}`}>
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
          {logoImage}
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/40">
            Instant 1-Tap Payment
          </span>
        </div>
        <p className="mt-3 text-xs text-bone/70 leading-relaxed">
          Pay directly via Safaricom M-PESA STK Push prompt on your mobile phone. Instant booking confirmation guaranteed.
        </p>
      </div>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#00A859] via-[#009650] to-[#008C4A] px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-[#00A859]/30 border border-emerald-400/40 group ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="font-display tracking-wide">Sending M-PESA STK Prompt to phone…</span>
        </span>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {logoImage}
          </div>
          <span className="font-semibold tracking-wide text-white group-hover:translate-x-0.5 transition-transform">{label}</span>
        </>
      )}
    </button>
  );
};

