import { supabase } from './supabaseClient';
import { getStoredBookings, getStoredVehicles, isValidUUID, isTripBooking } from './bookingStore';
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

export function extractBookingRef(text: string): string | null {
  if (!text) return null;
  const match = text.match(/(?:MT-\d+-[A-Z0-9]+|BK-[A-Z0-9-]+|b-\d+)/i);
  return match ? match[0].toUpperCase() : null;
}

export function getTransactionDedupeKey(t: { id?: string; reference?: string; description?: string; type?: string }): string {
  if (!t) return '';
  const text = `${t.reference || ''} ${t.description || ''} ${t.id || ''}`;
  const bkRef = extractBookingRef(text);
  if (bkRef && (t.type === 'BOOKING_PAYOUT' || t.type === 'COMMISSION')) {
    return `${t.type}:${bkRef}`;
  }
  return t.reference || t.id || '';
}

export function deduplicateTransactions<T extends { id?: string; reference?: string; description?: string; type?: string }>(txs: T[]): T[] {
  if (!Array.isArray(txs)) return [];
  const map = new Map<string, T>();
  for (const t of txs) {
    if (!t) continue;
    const key = getTransactionDedupeKey(t);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, t);
    }
  }
  return Array.from(map.values());
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
    if (!Array.isArray(w.transactions)) w.transactions = [];
    w.transactions = deduplicateTransactions(w.transactions);

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
            if (h.bookingId) handoverBookingIds.add(String(h.bookingId).trim().toLowerCase());
            if (h.bookingRef) handoverBookingIds.add(String(h.bookingRef).trim().toLowerCase());
          });
        }
      }
    } catch {}

    const isHandoverVerified = (b: any): boolean => {
      if (!b) return false;
      const s = (b.status || '').toUpperCase();
      if (['IN_PROGRESS', 'COMPLETED'].includes(s)) return true;
      const bId = (b.id ? String(b.id) : '').trim().toLowerCase();
      const bRef = (b.bookingRef ? String(b.bookingRef) : '').trim().toLowerCase();
      return (bId !== '' && handoverBookingIds.has(bId)) || (bRef !== '' && handoverBookingIds.has(bRef));
    };

    // Merge transactions from alias host accounts if user is host
    if (checkIsHost && typeof window !== 'undefined') {
      const aliasKeys = ['a0000000-0000-0000-0000-000000000002', 'owner-safari-1', 'user-host-1'];
      for (const ak of aliasKeys) {
        if (ak !== userId) {
          try {
            const rawAlias = localStorage.getItem(`mt_local_wallet_${ak}`);
            if (rawAlias) {
              const aliasData = JSON.parse(rawAlias);
              if (Array.isArray(aliasData?.transactions)) {
                for (const at of aliasData.transactions) {
                  const key = getTransactionDedupeKey(at);
                  const already = (w.transactions || []).some(t => getTransactionDedupeKey(t) === key);
                  if (!already) {
                    w.transactions.unshift(at);
                  }
                }
              }
            }
          } catch {}
        }
      }
      w.transactions = deduplicateTransactions(w.transactions);
    }

    if (checkIsAdmin) {
      // Exclude CANCELLED and REJECTED bookings
      const validBookings = allBookings.filter(b => {
        const s = (b.status || '').toUpperCase();
        if (['CANCELLED', 'REJECTED'].includes(s)) return false;
        return ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'ACCEPTED'].includes(s) || b.paymentStatus === 'PAID';
      });

      // Split into vehicle bookings and tour/package bookings
      const vehicleBookings = validBookings.filter(b => !isTripBooking(b));
      const tripBookings = validBookings.filter(b => isTripBooking(b));

      // Handover escrow strictly applies to fleet vehicle rentals awaiting executive handover
      const verifiedVehicleBookings = vehicleBookings.filter(b => isHandoverVerified(b));
      const pendingVehicleBookings = vehicleBookings.filter(b => !isHandoverVerified(b));

      // Pending escrow: 25% of unverified vehicle rentals
      const pendingAdminRevenue = pendingVehicleBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * ADMIN_COMMISSION_RATE;

      // Ensure transaction history has entries for verified vehicle bookings and paid tour packages
      const earnBookings = [...verifiedVehicleBookings, ...tripBookings];
      for (const b of earnBookings) {
        const ref = b.bookingRef || b.id;
        const cleanRef = String(ref).replace(/^(PAYOUT-|COMM-)/, '');
        const exists = (w.transactions || []).some(t => {
          const bk = extractBookingRef(`${t.reference || ''} ${t.description || ''} ${t.id || ''}`);
          return (bk && bk === cleanRef.toUpperCase()) ||
            (t.reference && t.reference.includes(cleanRef)) ||
            (t.description && t.description.includes(cleanRef));
        });
        if (!exists) {
          w.transactions.unshift({
            id: `tx-comm-${cleanRef}`,
            type: 'COMMISSION',
            amount: Number(b.totalAmount || 0) * ADMIN_COMMISSION_RATE,
            status: 'COMPLETED',
            reference: `COMM-${cleanRef}`,
            description: `Platform commission (25%) unlocked for trip ${cleanRef} (${isTripBooking(b) ? 'Package Confirmed' : 'Handover Verified'})`,
            created_at: b.createdAt || new Date().toISOString(),
          });
        }
      }
      w.transactions = deduplicateTransactions(w.transactions);

      const totalIn = (w.transactions || [])
        .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalWithdrawn = (w.transactions || [])
        .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      w.balance = Math.max(0, totalIn - totalWithdrawn);
      w.pendingBalance = Math.max(0, pendingAdminRevenue);
    } else if (checkIsHost) {
      const allVehicles = getStoredVehicles();
      const isUserJames = (userEmail && userEmail.toLowerCase().includes('james')) ||
                          userId === 'a0000000-0000-0000-0000-000000000002' ||
                          userId === 'owner-safari-1' ||
                          userId === 'user-host-1';

      const ownerVehicleIds = new Set(
        allVehicles
          .filter(v => 
            v.ownerId === userId || 
            (userEmail && v.ownerEmail && v.ownerEmail.toLowerCase() === userEmail.toLowerCase()) ||
            (isUserJames && (
              v.ownerId === 'a0000000-0000-0000-0000-000000000002' || 
              v.ownerId === 'owner-safari-1' ||
              v.ownerId === 'user-host-1' ||
              (v.ownerEmail && v.ownerEmail.toLowerCase().includes('james')) ||
              (v.ownerName && v.ownerName.toLowerCase().includes('james'))
            ))
          )
          .map(v => v.id)
      );

      const ownerBookings = allBookings.filter(b => {
        if (isTripBooking(b)) return false;
        const s = (b.status || '').toUpperCase();
        if (['CANCELLED', 'REJECTED'].includes(s)) return false;
        const isPaid = ['COMPLETED', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'ACCEPTED'].includes(s) || b.paymentStatus === 'PAID';
        if (!isPaid) return false;

        const bOwner = (b.ownerId || '').toLowerCase();
        const matchesOwner = bOwner === userId.toLowerCase() ||
          (userEmail && bOwner === userEmail.toLowerCase()) ||
          (isUserJames && (
            bOwner === 'a0000000-0000-0000-0000-000000000002' ||
            bOwner === 'owner-safari-1' ||
            bOwner === 'user-host-1' ||
            bOwner.includes('james') ||
            !b.ownerId
          ));
        const matchesVehicle = ownerVehicleIds.has(b.vehicleId);
        const isHostFleet = isUserJames && (!b.ownerId || b.ownerId === 'owner-safari-1' || b.ownerId === 'a0000000-0000-0000-0000-000000000002');

        return matchesOwner || matchesVehicle || isHostFleet;
      });

      const verifiedBookings = ownerBookings.filter(b => isHandoverVerified(b));
      const pendingBookings = ownerBookings.filter(b => !isHandoverVerified(b));

      const pendingHostEarnings = pendingBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) * HOST_SHARE_RATE;

      // Ensure transaction history has entries for verified bookings
      for (const b of verifiedBookings) {
        const ref = b.bookingRef || b.id;
        const cleanRef = String(ref).replace(/^(PAYOUT-|COMM-)/, '');
        const exists = (w.transactions || []).some(t => {
          const bk = extractBookingRef(`${t.reference || ''} ${t.description || ''} ${t.id || ''}`);
          return (bk && bk === cleanRef.toUpperCase()) ||
            (t.reference && t.reference.includes(cleanRef)) ||
            (t.description && t.description.includes(cleanRef));
        });
        if (!exists) {
          w.transactions.unshift({
            id: `tx-payout-${cleanRef}`,
            type: 'BOOKING_PAYOUT',
            amount: Number(b.totalAmount || 0) * HOST_SHARE_RATE,
            status: 'COMPLETED',
            reference: `PAYOUT-${cleanRef}`,
            description: `Host earnings (75%) unlocked for trip ${cleanRef} (Handover Verified)`,
            created_at: b.createdAt || new Date().toISOString(),
          });
        }
      }
      w.transactions = deduplicateTransactions(w.transactions);

      const totalIn = (w.transactions || [])
        .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalWithdrawn = (w.transactions || [])
        .filter(t => ['WITHDRAWAL', 'BOOKING_PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Available balance is the exact ledger sum of inflows minus withdrawals
      w.balance = Math.max(0, totalIn - totalWithdrawn);
      w.pendingBalance = Math.max(0, pendingHostEarnings);
    } else {
      // Regular traveler / tourist account:
      // Ledger balance = sum of top-ups / refunds minus withdrawals / booking payments
      const totalIn = (w.transactions || [])
        .filter(t => ['TOPUP', 'MPESA_TOPUP', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalOut = (w.transactions || [])
        .filter(t => ['WITHDRAWAL', 'BOOKING_PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      if (w.transactions && w.transactions.length > 0) {
        w.balance = Math.max(0, totalIn - totalOut);
      }
      w.pendingBalance = 0;
    }

    w.transactions = deduplicateTransactions(w.transactions);
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

/**
 * Pay for a trip or vehicle reservation using the traveler's M-Travel Wallet balance.
 */
export async function payWithWallet(
  userId: string,
  amount: number,
  bookingRef: string,
  description?: string
): Promise<PaymentResult> {
  const localW = getLocalWallet(userId);
  const currentBalance = Number(localW.balance || 0);

  if (currentBalance < amount) {
    return {
      success: false,
      message: `Insufficient wallet balance. You have KES ${currentBalance.toLocaleString()} available, but this booking requires KES ${amount.toLocaleString()}. Please top up your wallet or pay directly via M-Pesa.`,
    };
  }

  const cleanBookingRef = String(bookingRef).replace(/^(PAYOUT-|COMM-|WAL-)/, '');
  const receipt = `WAL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const desc = description || `Payment for booking ${cleanBookingRef} funded from M-Travel Wallet`;

  // 1. Supabase Sync for valid UUID user
  if (isValidUUID(userId)) {
    try {
      let { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (wallet) {
        const newBalance = Math.max(0, Number(wallet.balance || 0) - amount);
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'COMPLETED',
          reference: receipt,
          description: desc,
        });
      }
    } catch (err) {
      console.warn('Supabase wallet deduction notice:', err);
    }
  }

  // 2. Local Wallet Update
  localW.balance = Math.max(0, currentBalance - amount);
  localW.transactions.unshift({
    id: `tx-wallet-pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'BOOKING_PAYMENT',
    amount,
    status: 'COMPLETED',
    reference: receipt,
    description: desc,
    created_at: new Date().toISOString(),
  });
  localW.transactions = deduplicateTransactions(localW.transactions);
  saveLocalWallet(userId, localW);

  // 3. Log Audit Event
  try {
    let actorName = 'Traveler';
    const rawUser = localStorage.getItem('mt_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      actorName = `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || 'Traveler';
    }
    logAuditEvent(
      'WALLET_BOOKING_PAYMENT',
      'Wallet',
      receipt,
      `${actorName} paid KES ${amount.toLocaleString()} for booking ${cleanBookingRef} using M-Travel Wallet balance (Receipt: ${receipt})`,
      actorName,
      'USER'
    );
  } catch {}

  return {
    success: true,
    message: `Payment of KES ${amount.toLocaleString()} completed successfully using your M-Travel Wallet balance.`,
    reference: receipt,
    checkoutRequestId: receipt,
  };
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
  const cleanBookingRef = String(bookingRef).replace(/^(PAYOUT-|COMM-)/, '');
  const ref = `PAYOUT-${cleanBookingRef}`;
  const desc = description || `Host net earnings (75%) released for trip ${cleanBookingRef}`;

  const JAMES_HOST_UUID = 'a0000000-0000-0000-0000-000000000002';
  const primaryHostUuid = isValidUUID(userId) ? userId : JAMES_HOST_UUID;

  // 1. Supabase Sync: Credit only one primary host wallet
  try {
    await supabase.from('users').upsert({
      id: primaryHostUuid,
      email: primaryHostUuid === JAMES_HOST_UUID ? 'james.mwangi@mtravel.co.ke' : `user_${primaryHostUuid.slice(0, 6)}@mtravel.co.ke`,
      first_name: primaryHostUuid === JAMES_HOST_UUID ? 'James' : 'Fleet',
      last_name: primaryHostUuid === JAMES_HOST_UUID ? 'Mwangi' : 'Host',
      role: 'VEHICLE_OWNER',
      is_active: true,
    }, { onConflict: 'id' });

    let { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', primaryHostUuid)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id: primaryHostUuid, balance: 0, currency: 'KES' })
        .select()
        .single();
      wallet = newWallet;
    }

    if (wallet) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('wallet_id', wallet.id)
        .or(`reference.ilike.%${cleanBookingRef}%,description.ilike.%${cleanBookingRef}%`)
        .maybeSingle();

      if (!existingTx) {
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          type: 'BOOKING_PAYOUT',
          amount,
          status: 'COMPLETED',
          reference: ref,
          description: desc,
        });
      }

      const { data: allTxs } = await supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('wallet_id', wallet.id)
        .eq('status', 'COMPLETED');

      if (Array.isArray(allTxs)) {
        const inflows = allTxs
          .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const outflows = allTxs
          .filter(t => t.type === 'WITHDRAWAL')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const computedLedgerBalance = Math.max(0, inflows - outflows);
        await supabase.from('wallets').update({ balance: computedLedgerBalance }).eq('id', wallet.id);
      }
    }
  } catch (err) {
    console.warn('Supabase host payout notice:', err);
  }

  // 2. Local Wallet Sync for all host aliases (keeping host accounts synchronized)
  const hostIds = new Set<string>();
  if (userId) hostIds.add(userId);
  hostIds.add(JAMES_HOST_UUID);
  hostIds.add('owner-safari-1');
  hostIds.add('user-host-1');

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mt_user');
      if (stored) {
        const u = JSON.parse(stored);
        if ((u.role === 'VEHICLE_OWNER' || u.role === 'OWNER') && u.id) hostIds.add(u.id);
      }
      const rawAccounts = localStorage.getItem('mt_user_credentials_v2') || localStorage.getItem('mt_local_accounts');
      if (rawAccounts) {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs)) {
          accs.filter((a: any) => a.role === 'VEHICLE_OWNER' || a.role === 'OWNER').forEach((a: any) => hostIds.add(a.id));
        }
      }
    } catch {}
  }

  for (const hId of hostIds) {
    const localW = getLocalWallet(hId, true);
    const alreadyCredited = (localW.transactions || []).some(t => {
      const bk = extractBookingRef(`${t.reference || ''} ${t.description || ''} ${t.id || ''}`);
      return (bk && bk === cleanBookingRef.toUpperCase()) ||
        (t.reference && t.reference.includes(cleanBookingRef)) ||
        (t.description && t.description.includes(cleanBookingRef));
    });

    if (!alreadyCredited) {
      localW.transactions.unshift({
        id: `tx-payout-${cleanBookingRef}`,
        type: 'BOOKING_PAYOUT',
        amount,
        status: 'COMPLETED',
        reference: ref,
        description: desc,
        created_at: new Date().toISOString(),
      });
    }

    localW.transactions = deduplicateTransactions(localW.transactions);

    const totalIn = (localW.transactions || [])
      .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalWithdrawn = (localW.transactions || [])
      .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    localW.balance = Math.max(0, totalIn - totalWithdrawn);
    saveLocalWallet(hId, localW);
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
  const cleanBookingRef = String(bookingRef).replace(/^(PAYOUT-|COMM-)/, '');
  const ref = `COMM-${cleanBookingRef}`;
  const desc = description || `Platform commission (25%) released for trip ${cleanBookingRef}`;

  const ADMIN_UUID = 'a0000000-0000-0000-0000-000000000001';

  // 1. Supabase Sync: Credit only one primary admin wallet
  try {
    await supabase.from('users').upsert({
      id: ADMIN_UUID,
      email: 'safari@jambo.africa',
      first_name: 'Safari',
      last_name: 'Desk',
      role: 'ADMIN',
      is_active: true,
    }, { onConflict: 'id' });

    let { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', ADMIN_UUID)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id: ADMIN_UUID, balance: 0, currency: 'KES' })
        .select()
        .single();
      wallet = newWallet;
    }

    if (wallet) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('wallet_id', wallet.id)
        .or(`reference.ilike.%${cleanBookingRef}%,description.ilike.%${cleanBookingRef}%`)
        .maybeSingle();

      if (!existingTx) {
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          type: 'COMMISSION',
          amount,
          status: 'COMPLETED',
          reference: ref,
          description: desc,
        });
      }

      const { data: allTxs } = await supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('wallet_id', wallet.id)
        .eq('status', 'COMPLETED');

      if (Array.isArray(allTxs)) {
        const inflows = allTxs
          .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const outflows = allTxs
          .filter(t => t.type === 'WITHDRAWAL')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const computedLedgerBalance = Math.max(0, inflows - outflows);
        await supabase.from('wallets').update({ balance: computedLedgerBalance }).eq('id', wallet.id);
      }
    }
  } catch (err) {
    console.warn('Supabase commission notice:', err);
  }

  // 2. Local Wallet Sync for all admin aliases
  const adminIds = new Set<string>([
    ADMIN_UUID,
    'admin-safari-1',
    'admin-mtravel-1',
  ]);

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mt_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'ADMIN' && u.id) adminIds.add(u.id);
      }
      const rawAccounts = localStorage.getItem('mt_user_credentials_v2') || localStorage.getItem('mt_local_accounts');
      if (rawAccounts) {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs)) {
          accs.filter((a: any) => a.role === 'ADMIN').forEach((a: any) => adminIds.add(a.id));
        }
      }
    } catch {}
  }

  for (const adminId of adminIds) {
    const localW = getLocalWallet(adminId, false, undefined, true);
    const alreadyCredited = (localW.transactions || []).some(t => {
      const bk = extractBookingRef(`${t.reference || ''} ${t.description || ''} ${t.id || ''}`);
      return (bk && bk === cleanBookingRef.toUpperCase()) ||
        (t.reference && t.reference.includes(cleanBookingRef)) ||
        (t.description && t.description.includes(cleanBookingRef));
    });

    if (!alreadyCredited) {
      localW.transactions.unshift({
        id: `tx-comm-${cleanBookingRef}`,
        type: 'COMMISSION',
        amount,
        status: 'COMPLETED',
        reference: ref,
        description: desc,
        created_at: new Date().toISOString(),
      });
    }

    localW.transactions = deduplicateTransactions(localW.transactions);

    const totalIn = (localW.transactions || [])
      .filter(t => ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalWithdrawn = (localW.transactions || [])
      .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    localW.balance = Math.max(0, totalIn - totalWithdrawn);
    saveLocalWallet(adminId, localW);
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
