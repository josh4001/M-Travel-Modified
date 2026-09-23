import { supabase } from './supabaseClient';
import { getStoredBookings, getStoredVehicles, isValidUUID } from './bookingStore';

// ─── M-Pesa Payment Gateway Service ─────────────────────────────────────────
// Demo Mode implementation simulating instant M-Pesa STK push & B2C transactions.
// ─────────────────────────────────────────────────────────────────────────────

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  reference?: string;
  checkoutRequestId?: string;
}

/**
 * Initiate M-Pesa STK Push for booking payment (Demo Mode).
 * Simulates real-time Safaricom M-Pesa STK prompt and authorization.
 */
export async function payForBooking(
  _bookingId: string,
  _phone: string,
  amount: number,
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const receipt = `QK${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    success: true,
    message: `Payment of KES ${amount.toLocaleString()} processed successfully via M-Pesa (Demo).`,
    reference: receipt,
    checkoutRequestId: `ws_CO_${Date.now()}`,
  };
}

/**
 * Initiate M-Pesa STK Push for wallet top-up (Demo Mode).
 */
export async function topUpWallet(
  userId: string,
  _phone: string,
  amount: number,
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return directWalletTopUp(userId, amount);
}

/**
 * Initiate M-Pesa B2C withdrawal from wallet to owner's phone (Demo Mode).
 */
export async function withdrawFromWallet(
  userId: string,
  _phone: string,
  amount: number,
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return directWalletWithdraw(userId, amount);
}

// ─── Supabase Direct Wallet Operations (Fallback) ────────────────────────────

export interface LocalWalletData {
  id: string;
  balance: number;
  currency: string;
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    reference?: string;
    description?: string;
    created_at: string;
  }[];
}

export function getLocalWallet(userId: string, isHost = false, userEmail?: string): LocalWalletData {
  try {
    const raw = localStorage.getItem(`mt_local_wallet_${userId}`);
    let w: LocalWalletData = raw
      ? JSON.parse(raw)
      : { id: `w-${userId}`, balance: 0, currency: 'KES', transactions: [] };

    let checkIsHost = isHost;
    let checkIsAdmin = false;
    if (typeof window !== 'undefined') {
      try {
        const storedUserRaw = localStorage.getItem('mt_user');
        if (storedUserRaw) {
          const u = JSON.parse(storedUserRaw);
          if (u.id === userId) {
            if (u.role === 'ADMIN') checkIsAdmin = true;
            if (u.role === 'VEHICLE_OWNER' || u.role === 'OWNER') {
              checkIsHost = true;
              if (!userEmail) userEmail = u.email;
            }
          }
        }
      } catch {}
    }

    if (checkIsAdmin) {
      const allBookings = getStoredBookings();
      const totalRevenue = allBookings
        .filter(b => ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS'].includes((b.status || '').toUpperCase()))
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      const companyPlatformRevenue = Math.max(0, totalRevenue * 0.15);
      const totalWithdrawn = (w.transactions || [])
        .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      w.balance = Math.max(0, companyPlatformRevenue - totalWithdrawn);
    } else if (checkIsHost) {
      const allVehicles = getStoredVehicles();
      const allBookings = getStoredBookings();
      const ownerVehicleIds = new Set(
        allVehicles
          .filter(v => v.ownerId === userId || (userEmail && v.ownerEmail === userEmail))
          .map(v => v.id)
      );
      const ownerBookings = allBookings.filter(b =>
        (b.ownerId && (b.ownerId === userId || (userEmail && b.ownerId === userEmail))) ||
        ownerVehicleIds.has(b.vehicleId)
      );
      const totalGross = ownerBookings
        .filter(b => ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS'].includes((b.status || '').toUpperCase()))
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      const netEarningsFromBookings = Math.max(0, totalGross * 0.85);

      const totalWithdrawn = (w.transactions || [])
        .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      w.balance = Math.max(0, netEarningsFromBookings - totalWithdrawn);
    }

    localStorage.setItem(`mt_local_wallet_${userId}`, JSON.stringify(w));
    return w;
  } catch {
    return { id: `w-${userId}`, balance: 0, currency: 'KES', transactions: [] };
  }
}

export function saveLocalWallet(userId: string, data: LocalWalletData) {
  try {
    localStorage.setItem(`mt_local_wallet_${userId}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('mt_wallet_updated', { detail: data }));
  } catch {}
}

async function directWalletTopUp(userId: string, amount: number): Promise<PaymentResult> {
  const ref = `MPESA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (isValidUUID(userId)) {
    try {
      // 1. Ensure user row exists in Supabase users table so FK user_id doesn't fail
      await supabase.from('users').upsert({
        id: userId,
        email: `user_${userId.slice(0, 6)}@mtravel.co.ke`,
        first_name: 'Platform',
        last_name: 'User',
        role: 'TOURIST',
        is_active: true,
      }, { onConflict: 'id' });

      // 2. Get or create wallet in Supabase
      let { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0, currency: 'KES' })
          .select()
          .single();
        wallet = newWallet;
      }

      if (wallet) {
        const newBalance = Number(wallet.balance || 0) + amount;
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          type: 'MPESA_TOPUP',
          amount,
          status: 'COMPLETED',
          reference: ref,
          description: `M-Pesa top-up of KES ${amount.toLocaleString()}`,
        });
      }
    } catch (err) {
      console.warn('Supabase topup notice:', err);
    }
  }

  // Also sync to local wallet store so UI is 100% reactive
  const localW = getLocalWallet(userId);
  localW.balance += amount;
  localW.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'MPESA_TOPUP',
    amount,
    status: 'COMPLETED',
    reference: ref,
    description: `M-Pesa top-up of KES ${amount.toLocaleString()}`,
    created_at: new Date().toISOString(),
  });
  saveLocalWallet(userId, localW);

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} credited to your wallet via M-Pesa.`,
    reference: ref,
  };
}

async function directWalletWithdraw(userId: string, amount: number): Promise<PaymentResult> {
  const ref = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (isValidUUID(userId)) {
    try {
      // 1. Ensure user row exists in Supabase users table
      await supabase.from('users').upsert({
        id: userId,
        email: `user_${userId.slice(0, 6)}@mtravel.co.ke`,
        first_name: 'Platform',
        last_name: 'User',
        role: 'VEHICLE_OWNER',
        is_active: true,
      }, { onConflict: 'id' });

      // 2. Get or create wallet in Supabase
      let { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: amount, currency: 'KES' })
          .select()
          .single();
        wallet = newWallet;
      }

      if (wallet) {
        const newBalance = Math.max(0, Number(wallet.balance || 0) - amount);
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'COMPLETED',
          reference: ref,
          description: `Withdrawal of KES ${amount.toLocaleString()} to M-Pesa`,
        });
      }
    } catch (err) {
      console.warn('Supabase withdraw notice:', err);
    }
  }

  // Update local wallet store
  const localW = getLocalWallet(userId);
  localW.balance = Math.max(0, localW.balance - amount);
  localW.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'WITHDRAWAL',
    amount,
    status: 'COMPLETED',
    reference: ref,
    description: `Withdrawal of KES ${amount.toLocaleString()} to M-Pesa`,
    created_at: new Date().toISOString(),
  });
  saveLocalWallet(userId, localW);

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} sent to your M-Pesa.`,
    reference: ref,
  };
}
