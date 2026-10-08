import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState } from '@/store';
import { supabase } from '@/lib/supabaseClient';
import { topUpWallet, withdrawFromWallet, getLocalWallet, saveLocalWallet, deduplicateTransactions } from '@/lib/paymentService';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, RefreshCw, Plus, Phone, Smartphone, Banknote, CheckCircle2, AlertCircle, ShieldAlert, Navigation, Clock } from 'lucide-react';
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
  pendingBalance?: number;
  currency: string;
  transactions: Transaction[];
}

const TYPE_ICONS: Record<string, { icon: any; label: string; color: string }> = {
  TOPUP:          { icon: ArrowDownLeft, label: 'Top Up',                    color: 'text-emerald-600' },
  MPESA_TOPUP:    { icon: ArrowDownLeft, label: 'M-Pesa Top Up',             color: 'text-emerald-600' },
  BOOKING_PAYOUT: { icon: ArrowDownLeft, label: 'Host Net Payout (75%)',     color: 'text-teal-600' },
  COMMISSION:     { icon: ArrowDownLeft, label: 'Platform Commission (25%)', color: 'text-amber-600' },
  REFUND:         { icon: ArrowDownLeft, label: 'Refund',                     color: 'text-blue-600' },
  WITHDRAWAL:     { icon: ArrowUpRight,  label: 'Withdrawal',                 color: 'text-rose-600' },
  BOOKING_PAYMENT:{ icon: ArrowUpRight,  label: 'Trip / Vehicle Payment',     color: 'text-amber-700' },
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
  const isCarOwner = user?.role === 'VEHICLE_OWNER' || user?.role === 'OWNER' || user?.role === 'HOST' || user?.role === 'FLEET_HOST';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isCarOwnerOrAdmin = isCarOwner || isAdmin;

  // Driver partners are compensated directly by the agency per contract
  if (user?.role === 'DRIVER') {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-6 flex items-center justify-center relative overflow-hidden font-sans">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-center shadow-lg text-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-sans text-2xl font-bold text-slate-950 mb-2">
            Agency Driver Compensation
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
            As an official M-TRAVEL driver partner, your compensation is paid directly by the tourism agency per your agency driver contract and verified trip manifests, not through the client wallet.
          </p>
          <Link
            to="/dashboard/driver"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-slate-950 hover:bg-slate-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition"
          >
            <Navigation className="h-4 w-4 -rotate-45 text-white" />
            Return to Driver Console
          </Link>
        </div>
      </div>
    );
  }

  // Pre-seed wallet immediately for instant 0ms load time
  const [wallet, setWallet] = useState<WalletData | null>(() => {
    if (user?.id) {
      const lw = getLocalWallet(user.id, isCarOwner, user?.email, isAdmin);
      const cleanTxs = deduplicateTransactions(lw.transactions || []);
      const ledgerIn = cleanTxs
        .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const ledgerOut = cleanTxs
        .filter(t => ['WITHDRAWAL', 'BOOKING_PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const ledgerBalance = Math.max(0, ledgerIn - ledgerOut);
      return {
        ...lw,
        transactions: cleanTxs,
        balance: ledgerBalance,
      };
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
    setLoading(true);

    // 1. Immediately ensure local wallet is active and ledger-balanced
    const localW = getLocalWallet(user.id, isCarOwner, user?.email, isAdmin);
    localW.transactions = deduplicateTransactions(localW.transactions || []);
    const initialLedgerIn = localW.transactions
      .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const initialLedgerOut = localW.transactions
      .filter(t => ['WITHDRAWAL', 'BOOKING_PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const initialLedgerBal = Math.max(0, initialLedgerIn - initialLedgerOut);
    localW.balance = initialLedgerBal;
    setWallet({ ...localW });

    // Determine target UUID for Supabase sync
    const isJames = (user?.email && user.email.toLowerCase().includes('james')) ||
                    user.id === 'a0000000-0000-0000-0000-000000000002' ||
                    user.id === 'owner-safari-1' ||
                    user.id === 'user-host-1';

    const isValidUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    const targetUserIds = new Set<string>();
    if (isValidUUID(user.id)) targetUserIds.add(user.id);
    if (isJames) targetUserIds.add('a0000000-0000-0000-0000-000000000002');
    if (isAdmin) targetUserIds.add('a0000000-0000-0000-0000-000000000001');

    // 2. Fetch Supabase remote wallet & transactions in background with 8s timeout
    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 8000)
      );

      let remoteWallets: any[] = [];
      for (const tId of targetUserIds) {
        const walletQuery = supabase
          .from('wallets')
          .select('id, balance, currency, user_id')
          .eq('user_id', tId)
          .maybeSingle();

        const { data: w } = await Promise.race([walletQuery, timeoutPromise]) as any;
        if (w) remoteWallets.push(w);
      }

      if (remoteWallets.length > 0) {
        const primaryWallet = remoteWallets[0];
        const walletIds = remoteWallets.map(rw => rw.id);

        const txTimeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 8000)
        );
        const txQuery = supabase
          .from('transactions')
          .select('*')
          .in('wallet_id', walletIds)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: txs } = await Promise.race([txQuery, txTimeoutPromise]) as any;

        const remoteTxs = Array.isArray(txs) ? txs : [];
        const localTxs = Array.isArray(localW.transactions) ? localW.transactions : [];
        const mergedTransactions = deduplicateTransactions([...localTxs, ...remoteTxs]);

        const ledgerIn = mergedTransactions
          .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const ledgerOut = mergedTransactions
          .filter(t => ['WITHDRAWAL', 'BOOKING_PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const ledgerBalance = Math.max(0, ledgerIn - ledgerOut);
        const computedBalance = ledgerBalance;

        // Keep remote Supabase wallet balances in sync with accurate ledger balance
        for (const rw of remoteWallets) {
          if (Number(rw.balance || 0) !== computedBalance) {
            supabase.from('wallets').update({ balance: computedBalance }).eq('id', rw.id).then();
          }
        }

        // Update local wallet store
        localW.balance = computedBalance;
        localW.transactions = mergedTransactions;
        saveLocalWallet(user.id, localW);
        if (isJames) {
          saveLocalWallet('a0000000-0000-0000-0000-000000000002', localW);
          saveLocalWallet('owner-safari-1', localW);
          saveLocalWallet('user-host-1', localW);
        }
        if (isAdmin) {
          saveLocalWallet('a0000000-0000-0000-0000-000000000001', localW);
          saveLocalWallet('admin-safari-1', localW);
          saveLocalWallet('admin-mtravel-1', localW);
        }

        setWallet({
          id: primaryWallet.id,
          balance: computedBalance,
          pendingBalance: localW.pendingBalance,
          currency: primaryWallet.currency ?? 'KES',
          transactions: mergedTransactions,
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
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans pb-16">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* SUCCESS / ERROR NOTIFICATION */}
        {msg && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {msg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
        )}
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 font-sans">Financial Centre</p>
            <h1 className="mt-1 font-sans text-3xl font-bold text-slate-950 flex items-center gap-2">
              <Wallet className="h-7 w-7 text-slate-950" /> My Wallet {isCarOwner && <span className="text-xs font-bold text-slate-500">(Vehicle Owner Account)</span>}
            </h1>
          </div>
          <button onClick={fetchWallet} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 transition shadow-sm cursor-pointer">
            <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading && !wallet ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            <p className="mt-4 text-slate-500 font-medium">Loading wallet…</p>
          </div>
        ) : !wallet ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
            <Wallet className="mx-auto h-14 w-14 text-slate-400" />
            <p className="mt-4 font-sans text-lg text-slate-950 font-bold">No wallet found</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Please contact support or register a new account.</p>
          </div>
        ) : (
          <>
            {/* BALANCE CARD (EXECUTIVE BLACK BANNER) */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-8 shadow-2xl text-white">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold">Available Withdrawable Balance</p>
                    <p className="mt-2 font-mono text-5xl font-bold text-white">
                      {formatPrice(wallet.balance)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {isCarOwner ? '75% Host Net Share (Unlocked from verified handovers)' : isAdmin ? '25% Platform Commission (Unlocked from verified handovers)' : 'Ready for direct M-Pesa withdrawal'}
                    </p>
                  </div>

                  {(wallet.pendingBalance || 0) > 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 text-right max-w-sm">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 justify-end">
                        <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> Pending Handover Escrow ({isCarOwner ? '75% Cut' : isAdmin ? '25% Cut' : 'Escrow'})
                      </span>
                      <p className="font-mono text-2xl font-bold text-white mt-1">
                        {formatPrice(wallet.pendingBalance || 0)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                        Paid via M-Pesa &amp; held in escrow. Released to Available Balance once the traveler passes Admin vehicle handover verification.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 space-y-4">
                  {/* M-PESA TOP UP — REMOVED FOR CAR OWNERS & ADMIN ACCOUNTS PER REQUIREMENT */}
                  {!isCarOwnerOrAdmin && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <MpesaLogo variant="icon" /> M-Pesa Wallet Top Up
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[140px]">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                          <input
                            type="tel"
                            placeholder="07XX XXX XXX"
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none font-mono font-medium"
                            value={topupPhone}
                            onChange={e => setTopupPhone(e.target.value)}
                          />
                        </div>
                        <div className="relative flex-1 min-w-[120px]">
                          <Plus className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                          <input
                            type="number"
                            min="10"
                            placeholder="Amount (KES)"
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none font-mono font-medium"
                            value={topupAmt}
                            onChange={e => { setTopupAmt(e.target.value); setMsg(null); }}
                          />
                        </div>
                        <button
                          onClick={doTopup}
                          disabled={submitting || !topupAmt}
                          className="rounded-xl bg-[#00A859] hover:bg-[#008C4A] px-5 py-2 text-xs font-bold text-white disabled:opacity-50 transition shadow-lg shadow-[#00A859]/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          {submitting ? 'Processing…' : 'Send STK Push'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* M-PESA WITHDRAWAL */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <ArrowUpRight className="h-4 w-4" /> M-Pesa Withdrawal
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-rose-400" />
                        <input
                          type="tel"
                          placeholder="07XX XXX XXX"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none font-medium"
                          value={withdrawPhone}
                          onChange={e => setWithdrawPhone(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1 min-w-[120px]">
                        <ArrowUpRight className="absolute left-3 top-2.5 h-4 w-4 text-rose-400" />
                        <input
                          type="number"
                          min="10"
                          placeholder="Amount (KES)"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none font-medium"
                          value={withdrawAmt}
                          onChange={e => { setWithdrawAmt(e.target.value); setMsg(null); }}
                        />
                      </div>
                      <button
                        onClick={doWithdraw}
                        disabled={submitting || !withdrawAmt}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white disabled:opacity-50 transition shadow-lg shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total In',
                  value: wallet.transactions.filter(t => ['TOPUP','MPESA_TOPUP','BOOKING_PAYOUT','COMMISSION','REFUND'].includes(t.type) && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0),
                  color: 'text-emerald-700',
                  icon: ArrowDownLeft,
                  bg: 'bg-emerald-50 border border-emerald-200',
                },
                {
                  label: 'Total Out',
                  value: wallet.transactions.filter(t => ['WITHDRAWAL'].includes(t.type) && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0),
                  color: 'text-rose-700',
                  icon: ArrowUpRight,
                  bg: 'bg-rose-50 border border-rose-200',
                },
                {
                  label: 'Transactions',
                  value: wallet.transactions.length,
                  color: 'text-amber-700',
                  icon: TrendingUp,
                  bg: 'bg-amber-50 border border-amber-200',
                },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition text-slate-900">
                  <div className={`inline-flex p-2 rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-950">
                    {typeof s.value === 'number' && s.label !== 'Transactions'
                      ? formatPrice(s.value)
                      : s.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 font-semibold">{s.label}</p>
                </div>
              ))}
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="space-y-3">
              <h2 className="font-sans text-xl font-bold text-slate-950">Transaction History</h2>

              {wallet.transactions.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium text-sm shadow-sm">
                  {isCarOwner ? 'No transactions yet. Host earnings will appear here once trips are booked and verified.' : isAdmin ? 'No transactions yet. Platform commissions and payout records will appear here.' : 'No transactions yet. Top up your wallet to get started.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {wallet.transactions.map(t => {
                    const cfg = TYPE_ICONS[t.type] ?? { icon: ArrowDownLeft, label: t.type, color: 'text-slate-700' };
                    const isIn = ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type);
                    return (
                      <div key={t.id} className="rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4 p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            <cfg.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-950">{cfg.label}</p>
                            <p className="text-xs text-slate-500 font-medium">{t.description ?? '—'}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{new Date(t.created_at).toLocaleString('en-KE')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-bold ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isIn ? '+' : '-'} {formatPrice(t.amount)}
                          </p>
                          <p className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${t.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : t.status === 'FAILED' ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
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
    </div>
  );
}
