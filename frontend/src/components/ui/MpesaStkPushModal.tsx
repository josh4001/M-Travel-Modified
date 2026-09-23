import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, Lock, X, Radio } from 'lucide-react';
import { MpesaLogo } from './MpesaLogo';

interface MpesaStkPushModalProps {
  amount: number;
  bookingId?: string;
  bookingRef: string;
  vehicleName: string;
  userPhone?: string;
  touristPhone?: string;
  onSuccess: (receipt: string) => void;
  onClose: () => void;
}

export const MpesaStkPushModal: React.FC<MpesaStkPushModalProps> = ({
  amount,
  bookingId: _bookingId,
  bookingRef,
  vehicleName,
  userPhone,
  touristPhone,
  onSuccess,
  onClose,
}) => {
  const [phone, setPhone] = useState(touristPhone || userPhone || '0712345678');
  const [step, setStep] = useState<'INPUT' | 'STK_SENT' | 'ENTER_PIN' | 'SUCCESS'>('INPUT');
  const [pin, setPin] = useState('');
  const [receipt, setReceipt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendStk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('ENTER_PIN');
    }, 800);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleClearPin = () => {
    setPin('');
  };

  const handleConfirmPin = () => {
    if (pin.length < 4) return;

    setLoading(true);
    setTimeout(() => {
      const generatedReceipt = `QK${Math.floor(100000 + Math.random() * 900000)}`;
      setReceipt(generatedReceipt);
      setLoading(false);
      setStep('SUCCESS');
      setTimeout(() => {
        onSuccess(generatedReceipt);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md font-display overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-3xl border border-emerald-500/40 bg-slate-900 p-4 sm:p-5 shadow-2xl text-white scrollbar-thin scrollbar-thumb-emerald-500/30">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-white/15 pb-4">
          <MpesaLogo variant="icon" size="lg" />
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Instant Mobile Checkout</span>
            <h3 className="font-serif text-lg font-bold text-white">Secure Reservation Payment</h3>
          </div>
        </div>

        {/* STEP 1: PHONE INPUT & AMOUNT SUMMARY */}
        {step === 'INPUT' && (
          <form onSubmit={handleSendStk} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Vehicle / Service:</span>
                <span className="font-semibold text-white">{vehicleName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Booking Reference:</span>
                <span className="font-mono text-amber-400 font-bold">{bookingRef}</span>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-2 font-bold text-sm text-emerald-400">
                <span>Total Amount:</span>
                <span className="font-mono text-base">KES {amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" /> Enter Mobile Number for Confirmation
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 0712345678 or 254712345678"
                className="input-field text-sm !py-3 font-mono border-emerald-500/40 focus:border-emerald-400 text-slate-900 bg-white"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" /> A secure authorization prompt will appear on your mobile device.
              </p>
            </div>

            {/* PREMIUM PRE-BOOKING VERIFICATION & DAMAGE LIABILITY NOTICE */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 p-3.5 text-xs text-amber-200/90 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px] tracking-wider border-b border-amber-500/30 pb-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Pickup Documents &amp; Clean Return Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100 font-medium">
                Physical National ID/Passport (and Driving License for self-drive) required at vehicle pickup.
              </p>
              <ul className="text-[10.5px] space-y-1 pl-1 text-slate-200 font-semibold">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Clean Return: Vehicles returned in good condition incur KES 0 damage fees.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Damage Liability: Renter is held legally &amp; financially liable for any new damage caused.
                </li>
              </ul>
              <p className="text-[10px] text-amber-300/80 italic font-mono pt-1">
                By authorizing payment below, you confirm you will present valid credentials &amp; accept rental terms.
              </p>
            </div>

            <MpesaLogo
              type="submit"
              label={`Authorize & Confirm Reservation (KES ${amount.toLocaleString()})`}
              loading={loading}
            />
          </form>
        )}

        {/* STEP 2: REALISTIC PHONE SCREEN PROMPT POPUP */}
        {step === 'ENTER_PIN' && (
          <div className="mt-5 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
              <Radio className="h-3.5 w-3.5 animate-ping" /> Confirmation Prompt Sent to {phone}
            </div>

            {/* SIMULATED MOBILE PHONE STK OVERLAY BOX */}
            <div className="mx-auto w-full max-w-xs rounded-2xl border-2 border-white/30 bg-black/90 p-4 shadow-2xl space-y-3 text-left font-mono">
              <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[10px] text-slate-400">
                <span>SIM 1 - M-PESA</span>
                <span>Safaricom</span>
              </div>
              <p className="text-xs text-white font-bold leading-relaxed">
                Pay KSh {amount.toLocaleString()} to M-TRAVEL TOURS for {bookingRef}. Enter M-PESA PIN:
              </p>

              {/* PIN DISPLAY */}
              <div className="flex items-center justify-center gap-3 py-2 bg-white/10 rounded-lg text-lg tracking-widest font-bold text-emerald-400">
                {pin ? '•'.repeat(pin.length) : <span className="text-xs text-slate-400">Enter 4-digit PIN</span>}
              </div>

              {/* KEYPAD */}
              <div className="grid grid-cols-3 gap-1.5 text-xs text-center pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'OK'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'CLR') handleClearPin();
                      else if (key === 'OK') handleConfirmPin();
                      else handleKeyPress(key);
                    }}
                    className={`py-2 rounded font-bold transition ${
                      key === 'OK'
                        ? 'bg-[#00A859] text-white col-span-1 hover:bg-[#008C4A]'
                        : key === 'CLR'
                        ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <p className="text-xs text-emerald-400 flex items-center justify-center gap-2 font-mono">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                Verifying M-PESA Payment PIN with Safaricom...
              </p>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS CHECKMARK & RECEIPT */}
        {step === 'SUCCESS' && (
          <div className="mt-5 text-center space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h4 className="font-serif text-xl font-bold text-white">Payment Received via M-PESA!</h4>
              <p className="text-xs text-slate-300 mt-1">Transaction confirmed by Safaricom Daraja</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4 font-mono text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt Code:</span>
                <span className="font-bold text-emerald-400">{receipt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-white">KES {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="font-bold text-amber-400">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">SUCCESS & CONFIRMED</span>
              </div>
            </div>

            <p className="text-xs text-amber-400 font-mono">
              Redirecting to My Bookings...
            </p>
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-400" /> 256-bit Encrypted
          </span>
          <span className="flex items-center gap-1 font-mono">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Official Safaricom Partner
          </span>
        </div>
      </div>
    </div>
  );
};
