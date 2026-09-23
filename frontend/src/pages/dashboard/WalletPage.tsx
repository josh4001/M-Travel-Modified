import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState } from '@/store';
import { supabase } from '@/lib/supabaseClient';
import { topUpWallet, withdrawFromWallet, getLocalWallet } from '@/lib/paymentService';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, RefreshCw, Plus, Phone, Smartphone, Banknote, CheckCircle2, AlertCircle, ShieldAlert, Navigation } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaLogo } from '@/components/ui/MpesaLogo';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  created_at: string;
}

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

const TYPE_ICONS: Record<string, { icon: any; label: string; color: string }> = {
  TOPUP:          { icon: ArrowDownLeft, label: 'Top Up',         color: 'text-emerald-400' },
  MPESA_TOPUP:    { icon: ArrowDownLeft, label: 'M-Pesa Top Up',  color: 'text-emerald-400' },
  BOOKING_PAYOUT: { icon: ArrowDownLeft, label: 'Booking Payout', color: 'text-teal' },
  REFUND:         { icon: ArrowDownLeft, label: 'Refund',          color: 'text-blue-400' },
  WITHDRAWAL:     { icon: ArrowUpRight,  label: 'Withdrawal',      color: 'text-coral' },
  COMMISSION:     { icon: ArrowUpRight,  label: 'Commission',      color: 'text-marigold' },
};

export default function WalletPage() {
  const authUser = useSelector((s: RootState) => s.auth.user);
  const user = authUser || (() => {
    try {
      const raw = localStorage.getItem('mt_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const { formatPrice } = useCurrency();
  const isCarOwner = user?.role === 'VEHICLE_OWNER';
  const isAdmin = user?.role === 'ADMIN';
  const isCarOwnerOrAdmin = isCarOwner || isAdmin;

  // Driver partners are compensated directly by the agency per contract
  if (user?.role === 'DRIVER') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-[24px] bg-slate-900 border border-amber-500/30 p-6 sm:p-8 text-center shadow-2xl ring-1 ring-amber-400/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white mb-2">
            Agency Driver Compensation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            As an official M-TRAVEL driver partner, your compensation is paid directly by the tourism agency per your agency driver contract and verified trip manifests, not through the client wallet.
          </p>
          <Link
            to="/dashboard/driver"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-500 transition"
          >
            <Navigation className="h-4 w-4 -rotate-45 text-slate-950" />
            Return to Driver Console
          </Link>
        </div>
      </div>
    );
  }

  // Pre-seed wallet immediately for instant 0ms load time
  const [wallet, setWallet]   = useState<WalletData | null>(() => {
    if (user?.id) {
      return getLocalWallet(user.id, isCarOwner, user?.email);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [topupAmt, setTopupAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [topupPhone, setTopupPhone] = useState(user?.phone || '');
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    if (!user?.id) return;
    // 1. Immediately ensure local wallet is active
    const localW = getLocalWallet(user.id, isCarOwner, user?.email);
    setWallet(localW);

    // 2. Fetch Supabase remote wallet & transactions in background with 1.5s timeout
    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500)
      );

      const walletQuery = supabase
        .from('wallets')
        .select('id, balance, currency')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: w } = await Promise.race([walletQuery, timeoutPromise]) as any;

      if (w) {
        const txTimeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 1500)
        );
        const txQuery = supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', w.id)
          .order('created_at', { ascending: false })
          .limit(30);

        const { data: txs } = await Promise.race([txQuery, txTimeoutPromise]) as any;

        setWallet({
          id: w.id,
          balance: isCarOwner ? localW.balance : Number(w.balance ?? localW.balance),
          currency: w.currency ?? 'KES',
          transactions: (txs && txs.length > 0) ? txs : localW.transactions,
        });
      }
    } catch (err) {
      console.warn('Supabase wallet fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    const handleWalletUpdate = () => fetchWallet();
    window.addEventListener('mt_wallet_updated', handleWalletUpdate);
    return () => {
      window.removeEventListener('mt_wallet_updated', handleWalletUpdate);
    };
  }, [user?.id]);

  const doTopup = async () => {
    const amt = Number(topupAmt);
    if (!amt || amt < 10 || !wallet || !user?.id) return;
    if (!topupPhone || topupPhone.length < 9) {
      setMsg({ type: 'err', text: 'Please enter a valid M-Pesa phone number.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const result = await topUpWallet(user.id, topupPhone, amt);
    if (result.success) {
      setMsg({ type: 'ok', text: result.message });
      setTopupAmt('');
      fetchWallet();
    } else {
      setMsg({ type: 'err', text: result.message });
    }
    setSubmitting(false);
  };

  const doWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (!amt || amt < 10 || !wallet || !user?.id) return;
    if (amt > wallet.balance) { setMsg({ type: 'err', text: 'Insufficient balance.' }); return; }
    if (!withdrawPhone || withdrawPhone.length < 9) {
      setMsg({ type: 'err', text: 'Please enter a valid M-Pesa phone number.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const result = await withdrawFromWallet(user.id, withdrawPhone, amt);
    if (result.success) {
      setMsg({ type: 'ok', text: result.message });
      setWithdrawAmt('');
      fetchWallet();
    } else {
      setMsg({ type: 'err', text: result.message });
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8 font-display text-slate-900">
      {/* SUCCESS / ERROR NOTIFICATION */}
      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${msg.type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {msg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 font-display">Financial Centre</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-amber-600" /> My Wallet {isCarOwner && <span className="text-xs font-bold text-slate-500">(Vehicle Owner Account)</span>}
          </h1>
        </div>
        <button onClick={fetchWallet} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2 font-bold text-slate-800 border-slate-200 hover:text-slate-950">
          <RefreshCw className={`h-4 w-4 text-amber-600 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && !wallet ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="mt-4 text-slate-600 font-medium">Loading wallet…</p>
        </div>
      ) : !wallet ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <Wallet className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-display text-lg text-slate-800 font-bold">No wallet found</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Please contact support or register a new account.</p>
        </div>
      ) : (
        <>
          {/* BALANCE CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mtravel-burgundy via-mtravel-darkBurgundy to-mtravel-obsidian border border-mtravel-gold/30 p-8 shadow-xl">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-mtravel-gold/10 blur-3xl" />
            <div className="relative">
              <p className="text-sm text-amber-200 font-semibold">Available Balance</p>
              <p className="mt-2 font-mono text-5xl font-bold text-amber-400">
                {formatPrice(wallet.balance)}
              </p>
              <div className="mt-6 space-y-4">
                {/* M-PESA TOP UP — REMOVED FOR CAR OWNERS & ADMIN ACCOUNTS PER REQUIREMENT */}
                {!isCarOwnerOrAdmin && (
                  <div className="rounded-2xl border border-[#00A859]/40 bg-black/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <MpesaLogo variant="icon" /> M-Pesa Wallet Top Up
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400/80" />
                        <input
                          type="tel"
                          placeholder="07XX XXX XXX"
                          className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none font-mono font-medium"
                          value={topupPhone}
                          onChange={e => setTopupPhone(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1 min-w-[120px]">
                        <Plus className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400/80" />
                        <input
                          type="number"
                          min="10"
                          placeholder="Amount (KES)"
                          className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none font-mono font-medium"
                          value={topupAmt}
                          onChange={e => { setTopupAmt(e.target.value); setMsg(null); }}
                        />
                      </div>
                      <button
                        onClick={doTopup}
                        disabled={submitting || !topupAmt}
                        className="rounded-xl bg-[#00A859] hover:bg-[#008C4A] px-5 py-2 text-xs font-bold text-white disabled:opacity-50 transition shadow-lg shadow-[#00A859]/25 flex items-center gap-1.5"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        {submitting ? 'Processing…' : 'Send STK Push'}
                      </button>
                    </div>
                  </div>
                )}

                {/* M-PESA WITHDRAWAL */}
                <div className="rounded-2xl border border-rose-500/40 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <ArrowUpRight className="h-4 w-4" /> M-Pesa Withdrawal
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[140px]">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-rose-400/80" />
                      <input
                        type="tel"
                        placeholder="07XX XXX XXX"
                        className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-400 focus:border-rose-400 focus:outline-none font-medium"
                        value={withdrawPhone}
                        onChange={e => setWithdrawPhone(e.target.value)}
                      />
                    </div>
                    <div className="relative flex-1 min-w-[120px]">
                      <ArrowUpRight className="absolute left-3 top-2.5 h-4 w-4 text-rose-400/80" />
                      <input
                        type="number"
                        min="10"
                        placeholder="Amount (KES)"
                        className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-400 focus:border-rose-400 focus:outline-none font-medium"
                        value={withdrawAmt}
                        onChange={e => { setWithdrawAmt(e.target.value); setMsg(null); }}
                      />
                    </div>
                    <button
                      onClick={doWithdraw}
                      disabled={submitting || !withdrawAmt}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white disabled:opacity-50 transition shadow-lg shadow-rose-600/25 flex items-center gap-1.5"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      {submitting ? 'Processing…' : 'Withdraw'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total In',
                value: wallet.transactions.filter(t => ['TOPUP','BOOKING_PAYOUT','REFUND'].includes(t.type) && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0),
                color: 'text-emerald-700',
                icon: ArrowDownLeft,
                bg: 'bg-emerald-50',
              },
              {
                label: 'Total Out',
                value: wallet.transactions.filter(t => ['WITHDRAWAL','COMMISSION'].includes(t.type) && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0),
                color: 'text-rose-700',
                icon: ArrowUpRight,
                bg: 'bg-rose-50',
              },
              {
                label: 'Transactions',
                value: wallet.transactions.length,
                color: 'text-amber-700',
                icon: TrendingUp,
                bg: 'bg-amber-50',
              },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition">
                <div className={`inline-flex p-2 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                  {typeof s.value === 'number' && s.label !== 'Transactions'
                    ? formatPrice(s.value)
                    : s.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Transaction History</h2>

            {wallet.transactions.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium text-sm shadow-sm">
                No transactions yet. Top up your wallet to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {wallet.transactions.map(t => {
                  const cfg = TYPE_ICONS[t.type] ?? { icon: ArrowDownLeft, label: t.type, color: 'text-slate-800' };
                  const isIn = ['TOPUP', 'BOOKING_PAYOUT', 'REFUND'].includes(t.type);
                  return (
                    <div key={t.id} className="rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cfg.label}</p>
                          <p className="text-xs text-slate-600 font-medium">{t.description ?? '—'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{new Date(t.created_at).toLocaleString('en-KE')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIn ? '+' : '-'} {formatPrice(t.amount)}
                        </p>
                        <p className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${t.status === 'COMPLETED' ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : t.status === 'FAILED' ? 'text-rose-800 bg-rose-50 border border-rose-200' : 'text-yellow-800 bg-yellow-50 border border-yellow-200'}`}>
                          {t.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
