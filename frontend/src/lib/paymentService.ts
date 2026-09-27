import { supabase } from './supabaseClient';
import { getStoredBookings, getStoredVehicles, isValidUUID } from './bookingStore';
import { logAuditEvent } from './rentalLifecycleStore';

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

export const ADMIN_COMMISSION_RATE = 0.25; // 25% Platform Commission for Admin (Business)
export const HOST_SHARE_RATE = 0.75;       // 75% Host Share for Fleet Host

export interface LocalWalletData {
  id: string;
  balance: number;
  pendingBalance: number;
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

export function getLocalWallet(
  userId: string,
  isHost = false,
  userEmail?: string,
  isAdmin = false
): LocalWalletData {
  try {
    const raw = localStorage.getItem(`mt_local_wallet_${userId}`);
    let w: LocalWalletData = raw
      ? JSON.parse(raw)
      : { id: `w-${userId}`, balance: 0, pendingBalance: 0, currency: 'KES', transactions: [] };

    if (w.pendingBalance === undefined) w.pendingBalance = 0;

    let checkIsHost = isHost;
    let checkIsAdmin = isAdmin;
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

    if (userId.startsWith('admin-') || userId === 'admin') checkIsAdmin = true;

    const allBookings = getStoredBookings();
    
    // Retrieve recorded handovers to verify whether trip has passed handover
    let handoverBookingIds = new Set<string>();
    try {
      const rawHandovers = localStorage.getItem('mt_handovers_v1');
      if (rawHandovers) {
        const parsedHandovers = JSON.parse(rawHandovers);
        if (Array.isArray(parsedHandovers)) {
          parsedHandovers.forEach((h: any) => {
            if (h.bookingId) handoverBookingIds.add(h.bookingId);
            if (h.bookingRef) handoverBookingIds.add(h.bookingRef);
          });
        }
      }
    } catch {}

    const isHandoverVerified = (b: any): boolean => {
      const s = (b.status || '').toUpperCase();
      if (['IN_PROGRESS', 'COMPLETED'].includes(s)) return true;
      return handoverBookingIds.has(b.id) || (b.bookingRef && handoverBookingIds.has(b.bookingRef));
    };

    if (checkIsAdmin) {
      const paidBookings = allBookings.filter(b =>
        ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'ACCEPTED'].includes((b.status || '').toUpperCase()) ||
        b.paymentStatus === 'PAID'
      );

      const verifiedBookings = paidBookings.filter(b => isHandoverVerified(b));
      const pendingBookings = paidBookings.filter(b => !isHandoverVerified(b));

      const unlockedAdminRevenue = verifiedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * ADMIN_COMMISSION_RATE;
      const pendingAdminRevenue = pendingBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * ADMIN_COMMISSION_RATE;

      const totalWithdrawn = (w.transactions || [])
        .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      w.balance = Math.max(0, unlockedAdminRevenue - totalWithdrawn);
      w.pendingBalance = Math.max(0, pendingAdminRevenue);

      // Ensure transaction history has entries for verified bookings
      for (const b of verifiedBookings) {
        const ref = b.bookingRef || b.id;
        const exists = (w.transactions || []).some(
          t => (t.reference && t.reference.includes(ref)) || (t.description && t.description.includes(ref))
        );
        if (!exists) {
          w.transactions.unshift({
            id: `tx-comm-${ref}`,
            type: 'COMMISSION',
            amount: Number(b.totalAmount || 0) * ADMIN_COMMISSION_RATE,
            status: 'COMPLETED',
            reference: `COMM-${ref}`,
            description: `Platform commission (25%) unlocked for trip ${ref} (Handover Verified)`,
            created_at: b.createdAt || new Date().toISOString(),
          });
        }
      }
    } else if (checkIsHost) {
      const allVehicles = getStoredVehicles();
      const ownerVehicleIds = new Set(
        allVehicles
          .filter(v => v.ownerId === userId || (userEmail && v.ownerEmail && v.ownerEmail.toLowerCase() === userEmail.toLowerCase()))
          .map(v => v.id)
      );

      const ownerBookings = allBookings.filter(b =>
        (b.ownerId && (b.ownerId === userId || (userEmail && b.ownerId.toLowerCase() === userEmail.toLowerCase()))) ||
        ownerVehicleIds.has(b.vehicleId)
      );

      const paidBookings = ownerBookings.filter(b =>
        ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'ACCEPTED'].includes((b.status || '').toUpperCase()) ||
        b.paymentStatus === 'PAID'
      );

      const verifiedBookings = paidBookings.filter(b => isHandoverVerified(b));
      const pendingBookings = paidBookings.filter(b => !isHandoverVerified(b));

      const unlockedHostEarnings = verifiedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * HOST_SHARE_RATE;
      const pendingHostEarnings = pendingBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * HOST_SHARE_RATE;

      const totalWithdrawn = (w.transactions || [])
        .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      w.balance = Math.max(0, unlockedHostEarnings - totalWithdrawn);
      w.pendingBalance = Math.max(0, pendingHostEarnings);

      // Ensure transaction history has entries for verified bookings
      for (const b of verifiedBookings) {
        const ref = b.bookingRef || b.id;
        const exists = (w.transactions || []).some(
          t => (t.reference && t.reference.includes(ref)) || (t.description && t.description.includes(ref))
        );
        if (!exists) {
          w.transactions.unshift({
            id: `tx-payout-${ref}`,
            type: 'BOOKING_PAYOUT',
            amount: Number(b.totalAmount || 0) * HOST_SHARE_RATE,
            status: 'COMPLETED',
            reference: `PAYOUT-${ref}`,
            description: `Host earnings (75%) unlocked for trip ${ref} (Handover Verified)`,
            created_at: b.createdAt || new Date().toISOString(),
          });
        }
      }
    }

    localStorage.setItem(`mt_local_wallet_${userId}`, JSON.stringify(w));
    return w;
  } catch {
    return { id: `w-${userId}`, balance: 0, pendingBalance: 0, currency: 'KES', transactions: [] };
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

  let actorName = 'Traveler';
  let actorRole = 'TOURIST';
  try {
    const raw = localStorage.getItem('mt_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u) {
        actorName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Traveler';
        actorRole = u.role || 'TOURIST';
      }
    }
  } catch {}

  logAuditEvent(
    'WALLET_TOPUP',
    'Wallet',
    ref,
    `Traveler ${actorName} topped up KES ${amount.toLocaleString()} to wallet via M-Pesa (Ref: ${ref})`,
    actorName,
    actorRole
  );

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} credited to your wallet via M-Pesa.`,
    reference: ref,
  };
}

export async function creditHostPayout(
  userId: string,
  amount: number,
  bookingRef: string,
  description?: string
): Promise<PaymentResult> {
  const ref = `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const desc = description || `Host net earnings (75%) released for trip ${bookingRef}`;

  if (isValidUUID(userId)) {
    try {
      await supabase.from('users').upsert({
        id: userId,
        email: `user_${userId.slice(0, 6)}@mtravel.co.ke`,
        first_name: 'Fleet',
        last_name: 'Host',
        role: 'VEHICLE_OWNER',
        is_active: true,
      }, { onConflict: 'id' });

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
          type: 'BOOKING_PAYOUT',
          amount,
          status: 'COMPLETED',
          reference: ref,
          description: desc,
        });
      }
    } catch (err) {
      console.warn('Supabase payout notice:', err);
    }
  }

  const localW = getLocalWallet(userId, true);
  const alreadyCredited = (localW.transactions || []).some(
    t => (t.reference && t.reference.includes(bookingRef)) || (t.description && t.description.includes(bookingRef))
  );

  if (!alreadyCredited) {
    localW.balance += amount;
    localW.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'BOOKING_PAYOUT',
      amount,
      status: 'COMPLETED',
      reference: ref,
      description: desc,
      created_at: new Date().toISOString(),
    });
    saveLocalWallet(userId, localW);
  }

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} host net earnings credited to wallet.`,
    reference: ref,
  };
}

export async function creditAdminCommission(
  amount: number,
  bookingRef: string,
  description?: string
): Promise<PaymentResult> {
  const ref = `COMM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const desc = description || `Platform commission (25%) released for trip ${bookingRef}`;

  const adminIds = new Set<string>(['admin-safari-1', 'admin-mtravel-1']);
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mt_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'ADMIN' && u.id) adminIds.add(u.id);
      }
      const rawAccounts = localStorage.getItem('mt_local_accounts');
      if (rawAccounts) {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs)) {
          accs.filter((a: any) => a.role === 'ADMIN').forEach((a: any) => adminIds.add(a.id));
        }
      }
    } catch {}
  }

  for (const adminId of adminIds) {
    if (isValidUUID(adminId)) {
      try {
        let { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', adminId)
          .maybeSingle();

        if (wallet) {
          const newBalance = Number(wallet.balance || 0) + amount;
          await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
          await supabase.from('transactions').insert({
            wallet_id: wallet.id,
            type: 'COMMISSION',
            amount,
            status: 'COMPLETED',
            reference: ref,
            description: desc,
          });
        }
      } catch (err) {
        console.warn('Supabase commission notice:', err);
      }
    }

    const localW = getLocalWallet(adminId, false, undefined, true);
    const alreadyCredited = (localW.transactions || []).some(
      t => (t.reference && t.reference.includes(bookingRef)) || (t.description && t.description.includes(bookingRef))
    );

    if (!alreadyCredited) {
      localW.balance += amount;
      localW.transactions.unshift({
        id: `tx-comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'COMMISSION',
        amount,
        status: 'COMPLETED',
        reference: ref,
        description: desc,
        created_at: new Date().toISOString(),
      });
      saveLocalWallet(adminId, localW);
    }
  }

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} platform commission credited to Admin wallet.`,
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

  let actorName = 'User';
  let actorRole = 'USER';
  try {
    const raw = localStorage.getItem('mt_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u) {
        actorName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';
        actorRole = u.role || 'USER';
      }
    }
  } catch {}

  let actionName = 'WALLET_WITHDRAWAL';
  let roleLabel = 'User';
  if (actorRole === 'ADMIN') {
    actionName = 'ADMIN_WALLET_WITHDRAWAL';
    roleLabel = 'Admin';
  } else if (actorRole === 'VEHICLE_OWNER' || actorRole === 'OWNER') {
    actionName = 'FLEET_HOST_WALLET_WITHDRAWAL';
    roleLabel = 'Fleet Host';
  } else {
    actionName = 'TRAVELER_WALLET_WITHDRAWAL';
    roleLabel = 'Traveler';
  }

  logAuditEvent(
    actionName,
    'Wallet',
    ref,
    `${roleLabel} ${actorName} withdrew KES ${amount.toLocaleString()} from wallet via M-Pesa (Ref: ${ref})`,
    actorName,
    actorRole
  );

  return {
    success: true,
    message: `KES ${amount.toLocaleString()} sent to your M-Pesa.`,
    reference: ref,
  };
}
