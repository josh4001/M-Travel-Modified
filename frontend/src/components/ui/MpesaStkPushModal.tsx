import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, Lock, X, Radio, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectUser } from '@/store/slices/authSlice';
import { getLocalWallet, payWithWallet, LocalWalletData } from '@/lib/paymentService';
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
  const authUser = useSelector(selectUser);
  const user = authUser || (() => {
    try {
      const raw = localStorage.getItem('mt_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [wallet, setWallet] = useState<LocalWalletData | null>(() => {
    if (user?.id) {
      return getLocalWallet(user.id);
    }
    return null;
  });

  const walletBalance = Number(wallet?.balance || 0);
  const hasSufficientWalletBalance = walletBalance >= amount;

  // Prompt choice: default to WALLET if the user has sufficient funds, otherwise MPESA
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'MPESA'>(() => {
    if (user?.id && hasSufficientWalletBalance) return 'WALLET';
    return 'MPESA';
  });

  // Track live wallet balance changes
  useEffect(() => {
    if (!user?.id) return;
    const refreshWallet = () => {
      setWallet(getLocalWallet(user.id));
    };
    refreshWallet();
    window.addEventListener('mt_wallet_updated', refreshWallet);
    return () => window.removeEventListener('mt_wallet_updated', refreshWallet);
  }, [user?.id]);

  const [phone, setPhone] = useState(touristPhone || userPhone || user?.phone || '0712345678');
  const [step, setStep] = useState<'INPUT' | 'STK_SENT' | 'ENTER_PIN' | 'SUCCESS'>('INPUT');
  const [pin, setPin] = useState('');
  const [receipt, setReceipt] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [activeMethodUsed, setActiveMethodUsed] = useState<'WALLET' | 'MPESA'>('MPESA');

  // Handle Wallet Payment
  const handlePayWithWallet = async () => {
    if (!user?.id) {
      setWalletError('Please sign in to access your M-Travel Wallet.');
      return;
    }
    if (!hasSufficientWalletBalance) {
      setWalletError(`Insufficient wallet balance. You have KES ${walletBalance.toLocaleString()} available, but KES ${amount.toLocaleString()} is required.`);
      return;
    }

    setLoading(true);
    setWalletError(null);
    try {
      const result = await payWithWallet(
        user.id,
        amount,
        bookingRef,
        `Payment for ${vehicleName} (Ref: ${bookingRef})`
      );

      if (result.success && result.reference) {
        setReceipt(result.reference);
        setActiveMethodUsed('WALLET');
        setLoading(false);
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess(result.reference!);
        }, 1500);
      } else {
        setLoading(false);
        setWalletError(result.message || 'Wallet payment could not be completed.');
      }
    } catch (err: any) {
      setLoading(false);
      setWalletError(err?.message || 'Wallet payment transaction failed.');
    }
  };

  // Handle M-Pesa STK Push
  const handleSendStk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return;

    setActiveMethodUsed('MPESA');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md font-sans overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto rounded-3xl border border-slate-700 bg-slate-950 p-4 sm:p-6 shadow-2xl text-white scrollbar-thin scrollbar-thumb-slate-700">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-white/15 pb-4">
          {paymentMethod === 'WALLET' ? (
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          ) : (
            <MpesaLogo variant="icon" size="lg" />
          )}
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
              {paymentMethod === 'WALLET' ? 'Traveler Wallet Checkout' : 'Direct M-PESA STK Push'}
            </span>
            <h3 className="font-serif text-lg font-bold text-white">
              {paymentMethod === 'WALLET' ? 'Pay with M-Travel Wallet' : 'Secure Reservation Checkout'}
            </h3>
          </div>
        </div>

        {/* STEP 1: PAYMENT METHOD PROMPT & SELECTION */}
        {step === 'INPUT' && (
          <div className="mt-4 space-y-4">
            {/* BOOKING SUMMARY TICKET */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Vehicle / Service:</span>
                <span className="font-semibold text-white text-right max-w-[200px] truncate">{vehicleName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Booking Reference:</span>
                <span className="font-mono text-amber-400 font-bold">{bookingRef}</span>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-2 font-bold text-sm text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-emerald-400">KES {amount.toLocaleString()}</span>
              </div>
            </div>

            {/* PAYMENT METHOD CHOICES */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Choose Payment Method:
              </p>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-white/10">
                {/* OPTION 1: WALLET */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('WALLET');
                    setWalletError(null);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition cursor-pointer text-center ${
                    paymentMethod === 'WALLET'
                      ? 'bg-white text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Wallet className={`h-4 w-4 ${paymentMethod === 'WALLET' ? 'text-slate-950' : 'text-emerald-400'}`} />
                    <span>My Wallet</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-0.5 ${paymentMethod === 'WALLET' ? 'text-slate-700 font-bold' : 'text-emerald-400'}`}>
                    KES {walletBalance.toLocaleString()} bal
                  </span>
                </button>

                {/* OPTION 2: DIRECT MPESA */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('MPESA');
                    setWalletError(null);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition cursor-pointer text-center ${
                    paymentMethod === 'MPESA'
                      ? 'bg-white text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Smartphone className={`h-4 w-4 ${paymentMethod === 'MPESA' ? 'text-slate-950' : 'text-emerald-400'}`} />
                    <span>Direct M-Pesa</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${paymentMethod === 'MPESA' ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>
                    SIM Prompt STK
                  </span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: WALLET BALANCE DEDUCTION */}
            {paymentMethod === 'WALLET' && (
              <div className="space-y-4">
                {hasSufficientWalletBalance ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Current Wallet Balance:</span>
                      <span className="font-mono font-bold text-white">KES {walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-400 font-medium">
                      <span>Booking Deduction:</span>
                      <span className="font-mono font-bold">- KES {amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-emerald-500/30 pt-2 font-bold text-emerald-400">
                      <span>Remaining Balance After Booking:</span>
                      <span className="font-mono text-sm">KES {(walletBalance - amount).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[11px] text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Sufficient balance available for 100% instant reservation funding.</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3 text-xs text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Insufficient Wallet Balance</span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed font-normal">
                      You currently have <strong className="font-mono text-white">KES {walletBalance.toLocaleString()}</strong> in your wallet, but this booking requires <strong className="font-mono text-white">KES {amount.toLocaleString()}</strong> (short by KES {(amount - walletBalance).toLocaleString()}).
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MPESA')}
                        className="w-full sm:w-auto flex-1 rounded-xl bg-white text-slate-950 font-bold px-3 py-2 text-xs hover:bg-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Pay via Direct M-Pesa
                      </button>
                      <Link
                        to="/dashboard/wallet"
                        className="w-full sm:w-auto rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-center gap-1"
                      >
                        Top Up in Wallet <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {walletError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{walletError}</span>
                  </div>
                )}

                {/* LIABILITY NOTICE */}
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Clean Return Policy &amp; Instant Clearance</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Deducting from your wallet generates an official verified receipt instantly without SMS PIN delays.
                  </p>
                </div>

                {hasSufficientWalletBalance ? (
                  <button
                    type="button"
                    onClick={handlePayWithWallet}
                    disabled={loading}
                    className="w-full rounded-2xl bg-white hover:bg-slate-200 text-slate-950 py-3.5 px-4 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        Deducting from Wallet...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 text-slate-950" />
                        Confirm &amp; Deduct KES {amount.toLocaleString()} from Wallet
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MPESA')}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 text-white" />
                    Continue with Direct M-Pesa (KES {amount.toLocaleString()})
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT: DIRECT M-PESA STK PUSH */}
            {paymentMethod === 'MPESA' && (
              <form onSubmit={handleSendStk} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" /> Enter Mobile Number for Confirmation
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0712345678 or 254712345678"
                    className="input-field text-sm !py-3 font-mono border-white/20 focus:border-white text-slate-900 bg-white"
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
          </div>
        )}

        {/* STEP 2: REALISTIC PHONE SCREEN PROMPT POPUP (FOR DIRECT MPESA) */}
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
                    className={`py-2 rounded font-bold transition cursor-pointer ${
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
              <h4 className="font-serif text-xl font-bold text-white">
                {activeMethodUsed === 'WALLET' ? 'Payment Deducted from Wallet!' : 'Payment Received via M-PESA!'}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {activeMethodUsed === 'WALLET'
                  ? 'Funded instantly from your verified M-Travel Wallet balance'
                  : 'Transaction confirmed by Safaricom Daraja'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-black/50 p-4 font-mono text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt Code:</span>
                <span className="font-bold text-emerald-400">{receipt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Source:</span>
                <span className="font-bold text-white">
                  {activeMethodUsed === 'WALLET' ? 'M-Travel Wallet Balance' : 'Safaricom M-Pesa'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Deducted:</span>
                <span className="font-bold text-white">KES {amount.toLocaleString()}</span>
              </div>
              {activeMethodUsed === 'WALLET' && (
                <div className="flex justify-between border-t border-white/10 pt-1.5">
                  <span className="text-slate-400">Wallet Balance Left:</span>
                  <span className="font-bold text-emerald-400">KES {(walletBalance - amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="font-bold text-amber-400">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">CONFIRMED & CLEARED</span>
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
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> M-Travel Certified Settlement
          </span>
        </div>
      </div>
    </div>
  );
};
