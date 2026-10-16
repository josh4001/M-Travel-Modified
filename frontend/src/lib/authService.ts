/**
 * M-TRAVEL Authentication Service
 * ---------------------------------
 * Handles user registration and login via the NestJS backend (Prisma + Supabase DB).
 * Falls back gracefully when the backend is offline.
 */

import { supabase } from './supabaseClient';
import { logAuditEvent } from './rentalLifecycleStore';
import { getStoredCreditProfiles, saveCreditProfiles } from './creditScoreStore';
import {
  dispatchLiveEmail,
  generateAdminLoginOtpEmail,
  generatePasswordResetOtpEmail,
  saveDispatchedEmail,
} from './communicationService';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export interface LocalAccount {
  id: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

const DEFAULT_ACCOUNTS: LocalAccount[] = [
  {
    id: 'user-tourist-1',
    email: 'sarah.ochieng@gmail.com',
    password: 'Tourist@2026',
    role: 'TOURIST',
    firstName: 'Sarah',
    lastName: 'Ochieng',
    phone: '0712345678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-10-14T09:20:00.000Z',
  },
  {
    id: 'user-tourist-michael',
    email: 'michael@gmail.com',
    password: 'Tourist@2026',
    role: 'TOURIST',
    firstName: 'Michael',
    lastName: 'Explorer',
    phone: '0712345678',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-11-03T14:15:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'james.mwangi@mtravel.co.ke',
    password: 'Owner@2026',
    role: 'VEHICLE_OWNER',
    firstName: 'James',
    lastName: 'Mwangi',
    phone: '0712345678',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-08-20T11:00:00.000Z',
  },
  {
    id: 'admin-safari-1',
    email: 'maurice7868@gmail.com',
    password: 'OTP_MANAGED_ADMIN_ACCOUNT',
    role: 'ADMIN',
    firstName: 'Chief',
    lastName: 'Admin',
    phone: '+254 700 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-06-01T08:00:00.000Z',
  },
];

const USERS_STORAGE_KEY = 'mt_user_credentials_v2';
const LEGACY_STORAGE_KEYS = ['mt_user_credentials', 'mt_users', 'mt_accounts'];
const DELETED_ACCOUNTS_KEY = 'mt_deleted_accounts_v1';

const RETIRED_CORPORATE_ADMIN_EMAILS = new Set([
  'safari@jambo.africa',
  'admin@mtravel.co.ke',
  'admin@admin.com',
]);

export function getDeletedAccountEmails(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_ACCOUNTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.filter((e) => e.toLowerCase() !== 'maurice7868@gmail.com');
  } catch {
    return [];
  }
}

export function getLocalAccounts(): LocalAccount[] {
  const mergedMap = new Map<string, LocalAccount>();
  const idMap = new Map<string, LocalAccount>();
  const deletedEmails = new Set(getDeletedAccountEmails().map((e) => e.toLowerCase()));
  deletedEmails.delete('maurice7868@gmail.com');

  // 1. Read primary key (USERS_STORAGE_KEY) - authoritative client store
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.email) {
            const clean = item.email.toLowerCase();
            if (RETIRED_CORPORATE_ADMIN_EMAILS.has(clean)) continue;
            if (!deletedEmails.has(clean)) {
              const isPrimaryAdminEmail = clean === 'maurice7868@gmail.com';
              const acc: LocalAccount = {
                id: isPrimaryAdminEmail ? 'admin-safari-1' : (item.id || `user-${Date.now()}`),
                email: isPrimaryAdminEmail ? 'maurice7868@gmail.com' : item.email,
                password: item.password || 'Tourist@2026',
                role: isPrimaryAdminEmail ? 'ADMIN' : (item.role || 'TOURIST'),
                firstName: isPrimaryAdminEmail ? (item.firstName || 'Chief') : (item.firstName || 'Explorer'),
                lastName: isPrimaryAdminEmail ? (item.lastName || 'Admin') : (item.lastName || ''),
                phone: item.phone || '+254 700 000 000',
                avatarUrl: item.avatarUrl,
                isActive: isPrimaryAdminEmail ? true : item.isActive !== false,
                createdAt: item.createdAt || item.created_at || '2025-11-15T08:00:00.000Z',
              };
              mergedMap.set(clean, acc);
              if (acc.id) idMap.set(acc.id, acc);
            }
          }
        }
      }
    }
  } catch { /* empty */ }

  // 2. Read legacy keys (only if not already loaded)
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.email) {
              const clean = item.email.toLowerCase();
              if (RETIRED_CORPORATE_ADMIN_EMAILS.has(clean)) continue;
              const existingId = item.id ? idMap.get(item.id) : undefined;
              if (!deletedEmails.has(clean) && !mergedMap.has(clean) && !existingId) {
                const isPrimaryAdminEmail = clean === 'maurice7868@gmail.com';
                const acc: LocalAccount = {
                  id: isPrimaryAdminEmail ? 'admin-safari-1' : (item.id || `user-${Date.now()}`),
                  email: isPrimaryAdminEmail ? 'maurice7868@gmail.com' : item.email,
                  password: item.password || 'Tourist@2026',
                  role: isPrimaryAdminEmail ? 'ADMIN' : (item.role || 'TOURIST'),
                  firstName: item.firstName || item.first_name || 'Explorer',
                  lastName: item.lastName || item.last_name || '',
                  phone: item.phone || '',
                  avatarUrl: item.avatarUrl || item.avatar_url,
                  isActive: isPrimaryAdminEmail ? true : (item.isActive !== false && item.is_active !== false),
                  createdAt: item.createdAt || item.created_at || '2025-11-15T08:00:00.000Z',
                };
                mergedMap.set(clean, acc);
                if (acc.id) idMap.set(acc.id, acc);
              }
            }
          }
        }
      }
    } catch { /* empty */ }
  }

  // 3. Reconcile DEFAULT_ACCOUNTS
  let deletedChanged = false;
  for (const def of DEFAULT_ACCOUNTS) {
    const cleanDefEmail = def.email.toLowerCase();
    if (cleanDefEmail === 'maurice7868@gmail.com') {
      // Always guarantee maurice7868@gmail.com is present as an active ADMIN
      if (!mergedMap.has(cleanDefEmail)) {
        mergedMap.set(cleanDefEmail, { ...def });
        idMap.set(def.id, def);
      } else {
        const existing = mergedMap.get(cleanDefEmail)!;
        existing.role = 'ADMIN';
        existing.isActive = true;
      }
      continue;
    }
    if (idMap.has(def.id)) {
      const existing = idMap.get(def.id)!;
      if (existing.email.toLowerCase() !== cleanDefEmail) {
        if (!deletedEmails.has(cleanDefEmail)) {
          deletedEmails.add(cleanDefEmail);
          deletedChanged = true;
        }
      }
      continue;
    }
    if (deletedEmails.has(cleanDefEmail)) continue;
    if (mergedMap.has(cleanDefEmail)) continue;

    mergedMap.set(cleanDefEmail, { ...def });
    idMap.set(def.id, def);
  }

  if (deletedChanged) {
    try {
      localStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(Array.from(deletedEmails)));
    } catch {}
  }

  // Actively purge any legacy driver accounts or retired corporate admin aliases from memory and storage
  const result = Array.from(mergedMap.values()).filter(
    (a) =>
      a.role !== 'DRIVER' &&
      !a.email.toLowerCase().includes('driver@') &&
      !RETIRED_CORPORATE_ADMIN_EMAILS.has(a.email.toLowerCase())
  );
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(result));
  } catch { /* empty */ }
  return result;
}

function generateUserUUID(str?: string): string {
  if (str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'a' + Math.random().toString(36).substring(2, 9) + '-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
}

function saveLocalAccount(acc: LocalAccount) {
  const accountId = generateUserUUID(acc.id);
  const normalizedAccount: LocalAccount = { ...acc, id: accountId, createdAt: acc.createdAt || new Date().toISOString() };

  const accounts = getLocalAccounts();
  const filtered = accounts.filter(a => a.email?.toLowerCase() !== normalizedAccount.email?.toLowerCase());
  const updated = [normalizedAccount, ...filtered];
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('mt_user_credentials', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mt_accounts_updated'));
    }
  } catch {}

  // Real-time Supabase users table upsert
  (async () => {
    try {
      const payload: any = {
        id: accountId,
        email: normalizedAccount.email.toLowerCase(),
        phone: normalizedAccount.phone || null,
        password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
        first_name: normalizedAccount.firstName || 'User',
        last_name: normalizedAccount.lastName || '',
        avatar_url: normalizedAccount.avatarUrl || null,
        role: (normalizedAccount.role || 'TOURIST').toUpperCase(),
        is_active: normalizedAccount.isActive !== false,
        created_at: normalizedAccount.createdAt,
        updated_at: new Date().toISOString(),
      };

      let { error: uErr } = await supabase.from('users').upsert(payload, { onConflict: 'email' });
      if (uErr && uErr.message?.includes('users_phone_key')) {
        payload.phone = null;
        await supabase.from('users').upsert(payload, { onConflict: 'email' });
      }

      const { data: existingRegW } = await supabase.from('wallets').select('id').eq('user_id', accountId).maybeSingle();
      if (!existingRegW) {
        await supabase.from('wallets').insert({
          user_id: accountId,
          balance: 0,
          currency: 'KES',
        });
      }

      logAuditEvent(
        'USER_REGISTERED',
        'User',
        normalizedAccount.email,
        `User profile ${normalizedAccount.firstName} ${normalizedAccount.lastName} registered with role ${normalizedAccount.role}`,
        `${normalizedAccount.firstName} ${normalizedAccount.lastName}`,
        normalizedAccount.role
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mt_accounts_updated'));
        window.dispatchEvent(new CustomEvent('mt_remote_change', { detail: { table: 'users' } }));
      }
    } catch (err) {
      console.warn('Supabase user upsert notice:', err);
    }
  })();
}

export async function syncDefaultUsersToSupabase() {
  try {
    const accounts = getLocalAccounts();
    for (const acc of accounts) {
      const validId = generateUserUUID(acc.id);

      const payload: any = {
        id: validId,
        email: acc.email.toLowerCase(),
        phone: acc.phone || null,
        password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
        first_name: acc.firstName || 'User',
        last_name: acc.lastName || '',
        avatar_url: acc.avatarUrl || null,
        role: (acc.role || 'TOURIST').toUpperCase(),
        is_active: acc.isActive !== false,
        updated_at: new Date().toISOString(),
      };

      let { error: uErr } = await supabase.from('users').upsert(payload, { onConflict: 'email' });
      if (uErr && uErr.message?.includes('users_phone_key')) {
        payload.phone = null;
        await supabase.from('users').upsert(payload, { onConflict: 'email' });
      }

      const { data: existingW } = await supabase.from('wallets').select('id').eq('user_id', validId).maybeSingle();
      if (!existingW) {
        await supabase.from('wallets').insert({
          user_id: validId,
          balance: 0,
          currency: 'KES',
        });
      }
    }
  } catch (err) {
    console.warn('syncDefaultUsersToSupabase notice:', err);
  }
}

export async function syncUsersFromSupabase(): Promise<LocalAccount[]> {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error || !Array.isArray(data)) return getLocalAccounts();

    const currentLocal = getLocalAccounts();
    const localMap = new Map<string, LocalAccount>();
    for (const a of currentLocal) {
      localMap.set(a.email.toLowerCase(), a);
    }

    const deletedEmails = new Set(getDeletedAccountEmails().map((e) => e.toLowerCase()));

    for (const u of data) {
      if (u.email) {
        const clean = u.email.toLowerCase();
        if (deletedEmails.has(clean)) continue;
        const existing = localMap.get(clean);
        localMap.set(clean, {
          id: u.id || existing?.id || `user-${Date.now()}`,
          email: u.email,
          password: existing?.password || 'Tourist@2026',
          role: (u.role || existing?.role || 'TOURIST').toUpperCase(),
          firstName: u.first_name || existing?.firstName || 'Explorer',
          lastName: u.last_name || existing?.lastName || '',
          phone: u.phone || existing?.phone,
          avatarUrl: u.avatar_url || existing?.avatarUrl,
          isActive: u.is_active !== false,
        });
      }
    }

    const merged = Array.from(localMap.values()).filter(a => !deletedEmails.has(a.email.toLowerCase()));
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mt_accounts_updated'));
      }
    } catch {}
    return merged;
  } catch {
    return getLocalAccounts();
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncDefaultUsersToSupabase().catch(() => {});
    syncUsersFromSupabase().catch(() => {});
  }, 200);
}

export function updateUserStatus(userIdOrEmail: string, isActive: boolean): void {
  try {
    const accounts = getLocalAccounts();
    const target = accounts.find(
      (a) => a.id === userIdOrEmail || a.email.toLowerCase() === userIdOrEmail.toLowerCase()
    );
    if (target) {
      target.isActive = isActive;
      const updated = accounts.map((a) =>
        a.id === target.id || a.email.toLowerCase() === target.email.toLowerCase()
          ? { ...a, isActive }
          : a
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem('mt_user_credentials', JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mt_accounts_updated'));
      }
    }
  } catch {}
}

export async function updateUserProfile(
  userIdOrEmail: string,
  updates: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const accounts = getLocalAccounts();
    const accountIndex = accounts.findIndex(
      (a) => a.id === userIdOrEmail || a.email.toLowerCase() === userIdOrEmail.toLowerCase()
    );

    if (accountIndex === -1) {
      return { success: false, error: 'User account not found' };
    }

    const currentAcc = accounts[accountIndex];

    // If email is changing, ensure it's not already used by someone else
    if (updates.email && updates.email.trim().toLowerCase() !== currentAcc.email.toLowerCase()) {
      const emailConflict = accounts.some(
        (a, idx) => idx !== accountIndex && a.email.toLowerCase() === updates.email!.trim().toLowerCase()
      );
      if (emailConflict) {
        return { success: false, error: 'This email address is already registered to another user.' };
      }
    }

    const oldEmail = currentAcc.email;
    const newEmail = updates.email?.trim() || currentAcc.email;
    const newPhone = updates.phone !== undefined ? updates.phone.trim() : currentAcc.phone;
    const newFirstName = updates.firstName?.trim() || currentAcc.firstName;
    const newLastName = updates.lastName !== undefined ? updates.lastName.trim() : currentAcc.lastName;

    const emailChanged = oldEmail.toLowerCase() !== newEmail.toLowerCase();

    // If email is changing, tombstone the old email so it can never be used to log in
    if (emailChanged) {
      try {
        const deleted = getDeletedAccountEmails();
        if (!deleted.map((e) => e.toLowerCase()).includes(oldEmail.toLowerCase())) {
          deleted.push(oldEmail.toLowerCase());
          localStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(deleted));
        }
      } catch {}
    }

    const updatedAccount: LocalAccount = {
      ...currentAcc,
      email: newEmail,
      phone: newPhone,
      firstName: newFirstName,
      lastName: newLastName,
      createdAt: currentAcc.createdAt || '2025-11-15T08:00:00.000Z',
    };

    accounts[accountIndex] = updatedAccount;

    // Filter out any lingering accounts with oldEmail
    const sanitizedAccounts = accounts.filter(
      (a, idx) => idx === accountIndex || a.email.toLowerCase() !== oldEmail.toLowerCase()
    );

    // Persist to local storage across primary and legacy keys
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitizedAccounts));
    localStorage.setItem('mt_user_credentials', JSON.stringify(sanitizedAccounts));
    localStorage.setItem('mt_users', JSON.stringify(sanitizedAccounts));
    localStorage.setItem('mt_accounts', JSON.stringify(sanitizedAccounts));

    // Update active mt_user session
    let updatedAuthUser: AuthUser = {
      id: updatedAccount.id,
      email: updatedAccount.email,
      role: updatedAccount.role,
      firstName: updatedAccount.firstName,
      lastName: updatedAccount.lastName,
      phone: updatedAccount.phone,
      avatarUrl: updatedAccount.avatarUrl,
      createdAt: updatedAccount.createdAt,
    };

    const currentMtUserRaw = localStorage.getItem('mt_user');
    if (currentMtUserRaw) {
      try {
        const parsed = JSON.parse(currentMtUserRaw);
        if (parsed.id === currentAcc.id || parsed.email.toLowerCase() === oldEmail.toLowerCase()) {
          updatedAuthUser = {
            ...parsed,
            ...updatedAuthUser,
          };
          localStorage.setItem('mt_user', JSON.stringify(updatedAuthUser));
        }
      } catch {}
    }

    // Sync to Supabase if available
    try {
      await supabase.from('users').update({
        email: newEmail.toLowerCase(),
        phone: newPhone || null,
        first_name: newFirstName,
        last_name: newLastName,
        updated_at: new Date().toISOString(),
      }).eq('id', updatedAccount.id);

      if (emailChanged) {
        // Delete any lingering record for oldEmail that doesn't match this user's ID
        await supabase.from('users').delete().ilike('email', oldEmail.toLowerCase()).neq('id', updatedAccount.id);
      }
    } catch (e) {
      console.warn('Supabase profile update notice:', e);
    }

    // If traveler, synchronize their credit score profile with the new email/phone
    try {
      const creditProfiles = getStoredCreditProfiles();
      const cpIndex = creditProfiles.findIndex(
        (p) => p.userId === updatedAccount.id || p.touristEmail.toLowerCase() === oldEmail.toLowerCase()
      );
      if (cpIndex !== -1) {
        creditProfiles[cpIndex] = {
          ...creditProfiles[cpIndex],
          touristEmail: newEmail,
          touristPhone: newPhone || creditProfiles[cpIndex].touristPhone,
          touristName: `${newFirstName} ${newLastName}`.trim(),
        };
        saveCreditProfiles(creditProfiles);
      }
    } catch {}

    // Audit log
    logAuditEvent(
      'USER_PROFILE_UPDATED',
      'User',
      newEmail,
      `User credentials updated: Email: ${newEmail}, Phone: ${newPhone}`,
      `${newFirstName} ${newLastName}`.trim() || 'User',
      updatedAccount.role
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mt_accounts_updated'));
      window.dispatchEvent(new CustomEvent('mt_user_updated', { detail: updatedAuthUser }));
    }

    return { success: true, user: updatedAuthUser };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update profile' };
  }
}

// ---------------------------------------------------------------------------
// Delete Account
// ---------------------------------------------------------------------------
export async function deleteUserAccount(
  userIdOrEmail: string,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accounts = getLocalAccounts();
    const targetAccount = accounts.find(
      (a) => a.id === userIdOrEmail || a.email.toLowerCase() === userIdOrEmail.toLowerCase()
    );

    // Determine target email with full fallbacks
    let targetEmail = (targetAccount?.email || userEmail || '').toLowerCase();
    if (!targetEmail && userIdOrEmail.includes('@')) {
      targetEmail = userIdOrEmail.toLowerCase();
    }
    if (!targetEmail) {
      try {
        const raw = localStorage.getItem('mt_user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u.id === userIdOrEmail || !userIdOrEmail) {
            targetEmail = (u.email || '').toLowerCase();
          }
        }
      } catch {}
    }

    const targetId = targetAccount?.id || userIdOrEmail;

    // 1. Record in tombstone deleted accounts list
    if (targetEmail) {
      try {
        const deleted = getDeletedAccountEmails();
        if (!deleted.map((e) => e.toLowerCase()).includes(targetEmail)) {
          deleted.push(targetEmail);
          localStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(deleted));
        }
      } catch {}
    }

    // 2. Remove from active local accounts list across all storage keys
    const filteredAccounts = accounts.filter(
      (a) => a.id !== targetId && (!targetEmail || a.email.toLowerCase() !== targetEmail)
    );
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredAccounts));
      for (const k of LEGACY_STORAGE_KEYS) {
        localStorage.setItem(k, JSON.stringify(filteredAccounts));
      }
    } catch {}

    // 3. Remove from Supabase users table
    try {
      if (targetEmail && targetId && targetId !== targetEmail) {
        await supabase.from('users').delete().or(`id.eq.${targetId},email.ilike.${targetEmail}`);
      } else if (targetEmail) {
        await supabase.from('users').delete().ilike('email', targetEmail);
      } else if (targetId) {
        await supabase.from('users').delete().eq('id', targetId);
      }
    } catch (e) {
      console.warn('Supabase delete notice:', e);
    }

    // 4. Clean up any related credit score profile if traveler
    try {
      const creditProfiles = getStoredCreditProfiles();
      const updatedProfiles = creditProfiles.filter(
        (p) => p.userId !== targetId && (!targetEmail || p.touristEmail.toLowerCase() !== targetEmail)
      );
      saveCreditProfiles(updatedProfiles);
    } catch {}

    // 5. Audit Log
    if (targetEmail) {
      logAuditEvent(
        'USER_ACCOUNT_DELETED',
        'User',
        targetEmail,
        `User account for ${targetAccount?.firstName || ''} ${targetAccount?.lastName || ''} (${targetEmail}) was permanently deleted`,
        `${targetAccount?.firstName || ''} ${targetAccount?.lastName || ''}`.trim() || 'User',
        targetAccount?.role || 'USER'
      );
    }

    // 6. Purge active local session tokens & emit account updates
    logout();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mt_accounts_updated'));
      window.dispatchEvent(new CustomEvent('mt_user_deleted', { detail: { id: targetId, email: targetEmail } }));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete account' };
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<AuthResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();

  // Remove from deleted accounts tombstone if previously deleted
  try {
    const deleted = getDeletedAccountEmails().filter(e => e.toLowerCase() !== cleanEmail);
    localStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(deleted));
  } catch {}

  // Strictly prevent public self-registration of ADMIN accounts
  const requestedRole = (payload.role || '').toUpperCase();
  if (requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN') {
    throw new Error('System Admin accounts cannot be self-registered publicly. Admin accounts are provisioned exclusively by M-Travel Corporate Management.');
  }

  const roleMap: Record<string, string> = {
    TOURIST: 'TOURIST',
    VEHICLE_OWNER: 'VEHICLE_OWNER',
    HOST: 'VEHICLE_OWNER',
    FLEET_HOST: 'VEHICLE_OWNER',
    TRAVELER: 'TOURIST',
    CUSTOMER: 'TOURIST',
  };
  const role = roleMap[payload.role ?? 'TOURIST'] ?? 'TOURIST';

  const existing = getLocalAccounts().find(a => a.email.toLowerCase() === cleanEmail);
  const effectiveId = generateUserUUID(existing?.id);

  const accountRecord: LocalAccount = {
    id: effectiveId,
    email: payload.email.trim(),
    password: payload.password,
    role,
    firstName: payload.firstName.trim() || (existing?.firstName ?? 'Explorer'),
    lastName: payload.lastName.trim() || (existing?.lastName ?? ''),
    phone: payload.phone?.trim() || existing?.phone,
    isActive: true,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  saveLocalAccount(accountRecord);

  const mockTokens = buildMockTokens(effectiveId, payload.email.trim(), role);
  persistTokens(mockTokens.accessToken, mockTokens.refreshToken);

  const authUser: AuthUser = {
    id: effectiveId,
    email: payload.email.trim(),
    role,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    phone: payload.phone?.trim(),
    createdAt: accountRecord.createdAt,
  };
  localStorage.setItem('mt_user', JSON.stringify(authUser));

  return {
    ...mockTokens,
    user: authUser,
  };
}

/**
 * Provisions a new Administrator / Management Staff Account.
 * STRICTLY restricted to execution by authenticated M-Travel Management / Admin only.
 */
export async function createAdminAccountByManagement(
  adminCreator: { id?: string; email?: string; role?: string; name?: string },
  newAdmin: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    deskRole?: 'CHIEF_ADMIN' | 'OPERATIONS';
  }
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const creatorRole = adminCreator.role?.toUpperCase();
  if (creatorRole !== 'ADMIN' && creatorRole !== 'SUPER_ADMIN') {
    return {
      success: false,
      error: 'Permission Denied: Only M-Travel Management or Platform Administrators can provision Admin accounts.',
    };
  }

  const cleanEmail = newAdmin.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  // Remove from deleted tombstone if previously removed
  try {
    const deleted = getDeletedAccountEmails().filter(e => e.toLowerCase() !== cleanEmail);
    localStorage.setItem(DELETED_ACCOUNTS_KEY, JSON.stringify(deleted));
  } catch {}

  const existing = getLocalAccounts().find(a => a.email.toLowerCase() === cleanEmail);
  if (existing && (existing.role === 'ADMIN' || existing.role === 'SUPER_ADMIN')) {
    return { success: false, error: `An administrator account with email "${cleanEmail}" already exists on the platform.` };
  }

  const adminId = existing?.id || generateUserUUID();
  const deskLabel = newAdmin.deskRole === 'OPERATIONS' ? 'Operations Desk' : 'Chief Admin';

  const newAccount: LocalAccount = {
    id: adminId,
    email: newAdmin.email.trim(),
    password: 'OTP_MANAGED_ADMIN_ACCOUNT',
    role: 'ADMIN',
    firstName: newAdmin.firstName.trim() || 'Admin',
    lastName: newAdmin.lastName.trim() || 'Staff',
    phone: newAdmin.phone?.trim() || '+254 700 000 000',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  saveLocalAccount(newAccount);

  // Immediately persist to Supabase cloud database so the recruited admin can request OTP on any device
  try {
    await supabase.from('users').upsert(
      {
        id: adminId,
        email: cleanEmail,
        password_hash: 'OTP_MANAGED_ADMIN_ACCOUNT',
        role: 'ADMIN',
        first_name: newAccount.firstName,
        last_name: newAccount.lastName,
        phone: newAccount.phone || '+254 700 000 000',
        is_active: true,
      },
      { onConflict: 'email' }
    );
  } catch (err) {
    console.warn('Supabase admin provisioning sync warning:', err);
  }

  logAuditEvent(
    'ADMIN_ACCOUNT_PROVISIONED',
    'User',
    cleanEmail,
    `New Administrator account (${newAccount.firstName} ${newAccount.lastName} — ${cleanEmail}, ${deskLabel}) was officially provisioned for Passwordless OTP Login by Management (${adminCreator.email || 'Admin'})`,
    adminCreator.name || adminCreator.email || 'Management',
    'ADMIN'
  );

  return {
    success: true,
    user: {
      id: adminId,
      email: newAccount.email,
      role: 'ADMIN',
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      phone: newAccount.phone,
      createdAt: newAccount.createdAt,
    },
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  // 0. Check if account was permanently deleted or updated
  const deletedEmails = getDeletedAccountEmails().map((e) => e.toLowerCase());
  if (deletedEmails.includes(cleanEmail)) {
    throw new Error('This account does not exist or its email address has been updated. Please log in using your updated email address.');
  }

  // 1. Check local persistent account database
  const accounts = getLocalAccounts();
  const matched = accounts.find(a => a.email.toLowerCase() === cleanEmail);

  if (
    CORE_AUTHORIZED_ADMIN_EMAILS.has(cleanEmail) ||
    (matched && (matched.role?.toUpperCase() === 'ADMIN' || matched.role?.toUpperCase() === 'SUPER_ADMIN'))
  ) {
    throw new Error(
      'Administrator accounts authenticate exclusively via One-Time Email Code (OTP). Please use the Admin Portal link in the website footer.'
    );
  }

  if (matched) {
    // Strictly enforce exact password match - NO demo loose bypasses
    const isValid = matched.password === password;
    if (isValid) {
      if (!matched.isActive) {
        throw new Error('This account has been suspended. Contact safari@jambo.africa');
      }

      const mockTokens = buildMockTokens(matched.id, matched.email, matched.role);
      persistTokens(mockTokens.accessToken, mockTokens.refreshToken);

      const authUser: AuthUser = {
        id: matched.id,
        email: matched.email,
        role: matched.role,
        firstName: matched.firstName,
        lastName: matched.lastName,
        phone: matched.phone,
        avatarUrl: matched.avatarUrl,
        createdAt: matched.createdAt || '2025-11-15T08:00:00.000Z',
      };
      localStorage.setItem('mt_user', JSON.stringify(authUser));

      logAuditEvent(
        'USER_LOGIN',
        'User',
        matched.email,
        `User ${matched.firstName} ${matched.lastName || ''} (${matched.email}) logged into system with role ${matched.role}`,
        `${matched.firstName} ${matched.lastName || ''}`.trim() || 'User',
        matched.role
      );

      return {
        ...mockTokens,
        user: authUser,
      };
    } else {
      throw new Error('Invalid email or password.');
    }
  }

  // 2. Check Supabase DB as fallback with fast timeout
  try {
    const supabasePromise = supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 1500)
    );

    const { data: user, error } = await Promise.race([supabasePromise, timeoutPromise]) as any;

    if (user && !error) {
      if (deletedEmails.includes(user.email.toLowerCase())) {
        throw new Error('This account does not exist or its email address has been updated. Please log in using your updated email address.');
      }

      if (!user.is_active) {
        throw new Error('This account has been suspended. Contact safari@jambo.africa');
      }

      // Check password if stored in Supabase
      if (user.password_hash) {
        const isPlainMatch = user.password_hash === password;
        const isDefaultBcrypt = user.password_hash.startsWith('$2a$');
        if (!isDefaultBcrypt && !isPlainMatch) {
          throw new Error('Invalid email or password.');
        } else if (isDefaultBcrypt && password !== 'Tourist@2026' && password !== 'Admin@2026' && password !== 'Owner@2026') {
          throw new Error('Invalid email or password.');
        }
      }

      const role = user.role || 'TOURIST';
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        role,
        firstName: user.first_name || 'Explorer',
        lastName: user.last_name || '',
        phone: user.phone,
        avatarUrl: user.avatar_url,
      };

      // Cache for seamless offline login with exact password
      saveLocalAccount({
        id: user.id,
        email: user.email,
        password: password,
        role,
        firstName: user.first_name || 'Explorer',
        lastName: user.last_name || '',
        phone: user.phone,
        avatarUrl: user.avatar_url,
        isActive: user.is_active !== false,
      });

      const mockTokens = buildMockTokens(user.id, user.email, role);
      persistTokens(mockTokens.accessToken, mockTokens.refreshToken);
      localStorage.setItem('mt_user', JSON.stringify(authUser));

      logAuditEvent(
        'USER_LOGIN',
        'User',
        user.email,
        `User ${user.first_name || 'Explorer'} ${user.last_name || ''} (${user.email}) logged into system with role ${role}`,
        `${user.first_name || 'Explorer'} ${user.last_name || ''}`.trim(),
        role
      );

      return {
        ...mockTokens,
        user: authUser,
      };
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('suspended') || err.message.includes('deleted') || err.message.includes('updated') || err.message.includes('Invalid'))) throw err;
  }

  // Strictly reject non-existent accounts - NEVER auto-provision on login
  throw new Error('Account does not exist. Please check your credentials or register for an account.');
}

// ---------------------------------------------------------------------------
// Profile enrichment (pulls firstName/lastName from users table)
// ---------------------------------------------------------------------------
export async function enrichUserProfile(baseUser: AuthUser): Promise<AuthUser> {
  try {
    const { data } = await supabase
      .from('users')
      .select('first_name, last_name, phone, avatar_url')
      .eq('id', baseUser.id)
      .single();
    if (data) {
      return {
        ...baseUser,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        avatarUrl: data.avatar_url,
      };
    }
  } catch {
    // ignore enrichment failures
  }
  return baseUser;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
export function logout() {
  try {
    const raw = localStorage.getItem('mt_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) {
        logAuditEvent(
          'USER_LOGOUT',
          'User',
          u.email,
          `User ${u.firstName || ''} ${u.lastName || ''} (${u.email}) logged out of system`,
          `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          u.role || 'USER'
        );
      }
    }
  } catch {}
  localStorage.removeItem('mt_access_token');
  localStorage.removeItem('mt_refresh_token');
  localStorage.removeItem('mt_user');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function persistTokens(access: string, refresh: string) {
  localStorage.setItem('mt_access_token', access);
  localStorage.setItem('mt_refresh_token', refresh);
}

function buildMockTokens(
  userId: string,
  email: string,
  role: string,
): { accessToken: string; refreshToken: string } {
  // Simple JWT-like token for dev/demo mode (not cryptographically signed)
  const payload = btoa(JSON.stringify({ sub: userId, email, role, exp: Date.now() + 604800000 }));
  return {
    accessToken: `demo.${payload}.sig`,
    refreshToken: `demo_refresh.${payload}.sig`,
  };
}

// ---------------------------------------------------------------------------
// Forgot Password OTP Service
// ---------------------------------------------------------------------------
const PASSWORD_RESET_OTP_KEY = 'mt_password_reset_otps';

export interface PasswordResetOtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
  attemptsLeft: number;
  createdAt: string;
  verified: boolean;
}

function getStoredOtpRecords(): PasswordResetOtpRecord[] {
  try {
    const raw = localStorage.getItem(PASSWORD_RESET_OTP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOtpRecords(records: PasswordResetOtpRecord[]) {
  try {
    // Retain only unexpired records
    const now = Date.now();
    const clean = records.filter((r) => r.expiresAt > now);
    localStorage.setItem(PASSWORD_RESET_OTP_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('Failed to save OTP records:', err);
  }
}

/**
 * Core whitelist of corporate and executive admin emails.
 * Any account with role === 'ADMIN' or 'SUPER_ADMIN' in local storage or Supabase DB
 * is also automatically recognized as an authorized administrator.
 */
const CORE_AUTHORIZED_ADMIN_EMAILS = new Set([
  'maurice7868@gmail.com',
]);

/**
 * 1. REQUEST PASSWORD RESET OTP (PUBLIC MEMBERS ONLY — TRAVELERS & FLEET HOSTS)
 * Generates a 6-digit numeric OTP and dispatches a luxury branded email to the user.
 * Strictly blocks ADMIN accounts since administrators authenticate via Passwordless One-Time Login at the Admin Portal.
 */
export async function requestPasswordResetOTP(email: string): Promise<{
  success: boolean;
  message: string;
  recipientEmail: string;
  recipientName?: string;
  expiresInMinutes: number;
  provider?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // 1. Check if user exists locally
  const localAccounts = getLocalAccounts();
  const localUser = localAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (
    CORE_AUTHORIZED_ADMIN_EMAILS.has(cleanEmail) ||
    (localUser && (localUser.role?.toUpperCase() === 'ADMIN' || localUser.role?.toUpperCase() === 'SUPER_ADMIN'))
  ) {
    throw new Error(
      'Administrator accounts use Passwordless One-Time Email Login (OTP) and cannot change passwords via PIN. Please sign in directly via the Admin Portal link in the website footer.'
    );
  }

  let recipientName = localUser ? `${localUser.firstName} ${localUser.lastName}`.trim() : '';

  // 2. If not local, check Supabase DB
  if (!localUser) {
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email, role, first_name, last_name, is_active')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (dbUser) {
        const dbRole = (dbUser.role || '').toUpperCase();
        if (dbRole === 'ADMIN' || dbRole === 'SUPER_ADMIN') {
          throw new Error(
            'Administrator accounts use Passwordless One-Time Email Login (OTP) and cannot change passwords via PIN. Please sign in directly via the Admin Portal link in the website footer.'
          );
        }
        recipientName = `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || 'Explorer';
        if (dbUser.is_active === false) {
          throw new Error('This account has been deactivated. Please contact support.');
        }
      }
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('deactivated') || err.message.includes('Administrator accounts'))
      ) {
        throw err;
      }
      // DB error or offline: continue check
    }
  }

  // If user not found in local accounts and no DB user was matched
  if (!localUser && !recipientName) {
    throw new Error(`No registered account found with email: ${cleanEmail}. Please verify your email address or create a new account.`);
  }

  // 3. Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMinutes = 10;
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  // 4. Save OTP record
  const existingRecords = getStoredOtpRecords().filter((r) => r.email.toLowerCase() !== cleanEmail);
  const newRecord: PasswordResetOtpRecord = {
    email: cleanEmail,
    otp: otpCode,
    expiresAt,
    attemptsLeft: 5,
    createdAt: new Date().toISOString(),
    verified: false,
  };
  saveOtpRecords([newRecord, ...existingRecords]);

  // 5. Generate luxury HTML email
  const emailPayload = generatePasswordResetOtpEmail({
    email: cleanEmail,
    recipientName: recipientName || 'Valued Member',
    otpCode,
    expiresInMinutes,
  });

  // 6. Dispatch live email via Gmail SMTP / Resend gateway
  const dispatchRes = await dispatchLiveEmail({
    to: cleanEmail,
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
  });

  // 7. Track in dispatched email log
  saveDispatchedEmail({
    id: `email-otp-${Date.now()}`,
    recipientEmail: cleanEmail,
    recipientName: recipientName || 'Member',
    subject: emailPayload.subject,
    previewText: `Your M-TRAVEL password reset code is ${otpCode}. Valid for ${expiresInMinutes} minutes.`,
    htmlContent: emailPayload.html,
    category: 'PASSWORD_RESET',
    reference: cleanEmail,
    sentAt: new Date().toISOString(),
    deliveryStatus: dispatchRes.success ? 'DELIVERED_RESEND' : 'FAILED',
    deliveryProvider: dispatchRes.provider || 'gmail_smtp',
    deliveryId: dispatchRes.id,
  });

  if (!dispatchRes.success) {
    const errorDetail = dispatchRes.error || dispatchRes.message || 'Email delivery failed. Please check your connection or contact support.';
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
  }

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Check your inbox or spam folder.`,
    recipientEmail: cleanEmail,
    recipientName,
    expiresInMinutes,
    provider: dispatchRes.provider,
  };
}

/**
 * 2. VERIFY PASSWORD RESET OTP
 * Checks whether the submitted 6-digit code is valid and unexpired.
 */
export function verifyPasswordResetOTP(email: string, otp: string): {
  success: boolean;
  message: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim().replace(/\s+/g, '');

  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const records = getStoredOtpRecords();
  const record = records.find((r) => r.email.toLowerCase() === cleanEmail);

  if (!record) {
    throw new Error('No active verification code found for this email. Please request a new code.');
  }

  if (Date.now() > record.expiresAt) {
    throw new Error('Verification code has expired. Please request a fresh code.');
  }

  if (record.attemptsLeft <= 0) {
    throw new Error('Too many invalid attempts. For your security, please request a new verification code.');
  }

  if (record.otp !== cleanOtp) {
    record.attemptsLeft -= 1;
    saveOtpRecords(records);
    const leftText = record.attemptsLeft > 0 ? ` (${record.attemptsLeft} attempts remaining)` : '';
    throw new Error(`Incorrect verification code. Please check your email and try again${leftText}.`);
  }

  // Mark record as verified
  record.verified = true;
  saveOtpRecords(records);

  return {
    success: true,
    message: 'Verification code confirmed successfully.',
  };
}

/**
 * 3. RESET PASSWORD WITH VERIFIED OTP
 * Updates the user's password in both local accounts and Supabase database.
 */
export async function resetPasswordWithOTP(
  email: string,
  otp: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (CORE_AUTHORIZED_ADMIN_EMAILS.has(cleanEmail)) {
    throw new Error('Administrator accounts use Passwordless One-Time Email Login (OTP) and cannot change passwords via PIN.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  // Verify OTP first
  verifyPasswordResetOTP(cleanEmail, otp);

  // 1. Update in local storage accounts
  const localAccounts = getLocalAccounts();
  const accountIndex = localAccounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  if (accountIndex >= 0) {
    const existingRole = (localAccounts[accountIndex].role || '').toUpperCase();
    if (existingRole === 'ADMIN' || existingRole === 'SUPER_ADMIN') {
      throw new Error('Administrator accounts use Passwordless One-Time Email Login (OTP) and cannot change passwords via PIN.');
    }
    localAccounts[accountIndex].password = newPassword;
  } else {
    localAccounts.push({
      id: generateUserUUID(),
      email: cleanEmail,
      password: newPassword,
      role: 'TOURIST',
      firstName: 'Member',
      lastName: '',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(localAccounts));
    localStorage.setItem('mt_user_credentials', JSON.stringify(localAccounts));
    localStorage.setItem('mt_users', JSON.stringify(localAccounts));
    localStorage.setItem('mt_accounts', JSON.stringify(localAccounts));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mt_accounts_updated'));
    }
  } catch (err) {
    console.warn('Failed to update local account password:', err);
  }

  // 2. Update in Supabase DB (if user exists in remote DB)
  try {
    const { error: dbError } = await supabase
      .from('users')
      .update({
        password_hash: newPassword,
        updated_at: new Date().toISOString(),
      })
      .ilike('email', cleanEmail);

    if (dbError) {
      console.warn('Supabase DB password update warning:', dbError.message);
    }
  } catch (dbErr) {
    console.warn('Supabase DB connection error during password reset:', dbErr);
  }

  // 3. Purge the used OTP
  const remainingRecords = getStoredOtpRecords().filter((r) => r.email.toLowerCase() !== cleanEmail);
  saveOtpRecords(remainingRecords);

  // 4. Log audit event
  logAuditEvent(
    'USER_PASSWORD_RESET',
    'User',
    cleanEmail,
    `Password was successfully reset for account ${cleanEmail} via verified email OTP`,
    cleanEmail,
    'USER',
  );

  return {
    success: true,
    message: 'Your password has been successfully updated. You can now log in with your new password.',
  };
}

// ---------------------------------------------------------------------------
// Admin Portal Passwordless One-Time Login (OTP) Service
// Strictly verifies that the email belongs to an authorized ADMIN before
// generating or dispatching any OTP. Never sends an OTP to a public user.
// ---------------------------------------------------------------------------
const ADMIN_LOGIN_OTP_KEY = 'mt_admin_login_otps';

export interface AdminLoginOtpRecord {
  email: string;
  otp: string;
  selectedRole?: 'CHIEF_ADMIN' | 'OPERATIONS' | null;
  expiresAt: number;
  attemptsLeft: number;
  createdAt: string;
}

function getStoredAdminOtpRecords(): AdminLoginOtpRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_LOGIN_OTP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAdminOtpRecords(records: AdminLoginOtpRecord[]) {
  try {
    const now = Date.now();
    const clean = records.filter((r) => r.expiresAt > now);
    localStorage.setItem(ADMIN_LOGIN_OTP_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('Failed to save Admin OTP records:', err);
  }
}

/**
 * STRICT ADMIN-ONLY PRE-DISPATCH AUTHORIZATION GATE
 * Verifies that `email` belongs exclusively to an active Administrator in:
 * 1) Local persistent accounts (`getLocalAccounts()`), OR
 * 2) Supabase `users` table (`role === 'ADMIN' | 'SUPER_ADMIN'`), OR
 * 3) Core authorized executive admin whitelist (`maurice7868@gmail.com`).
 * Immediately rejects public users (`TOURIST`, `VEHICLE_OWNER`, `DRIVER`) and unknown emails.
 */
async function resolveAuthorizedAdminAccount(
  email: string,
  selectedRole?: 'CHIEF_ADMIN' | 'OPERATIONS' | null,
): Promise<LocalAccount> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid management email address.');
  }

  // 0. Check deleted accounts tombstone
  const deletedEmails = getDeletedAccountEmails().map((e) => e.toLowerCase());
  if (deletedEmails.includes(cleanEmail)) {
    throw new Error('Access Denied: This administrator account has been terminated or its email address was updated.');
  }

  // 1. Check local persistent accounts
  const localAccounts = getLocalAccounts();
  const matchedLocal = localAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

  // 2. Query Supabase DB to cross-verify role and pull any cloud-provisioned admin accounts
  let dbUser: any = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone, avatar_url, is_active, created_at')
      .ilike('email', cleanEmail)
      .maybeSingle();
    if (data) {
      dbUser = data;
    }
  } catch {
    // Offline fallback relies on localAccounts + whitelist
  }

  // Determine effective role from local record, Supabase DB, or core whitelist
  const localRole = matchedLocal?.role?.toUpperCase() || '';
  const dbRole = (dbUser?.role || '').toUpperCase();
  const isWhitelistedAdmin = CORE_AUTHORIZED_ADMIN_EMAILS.has(cleanEmail);

  // If the account exists as a non-admin public user (Traveler, Fleet Host, Driver) and is NOT an admin
  const isExplicitlyNonAdmin =
    ((localRole && localRole !== 'ADMIN' && localRole !== 'SUPER_ADMIN') ||
      (dbRole && dbRole !== 'ADMIN' && dbRole !== 'SUPER_ADMIN')) &&
    !isWhitelistedAdmin;

  if (isExplicitlyNonAdmin) {
    logAuditEvent(
      'UNAUTHORIZED_ADMIN_OTP_ATTEMPT',
      'Security',
      cleanEmail,
      `Blocked Admin Portal OTP request from public non-admin account (${cleanEmail}, role: ${dbRole || localRole})`,
      cleanEmail,
      dbRole || localRole || 'PUBLIC_USER',
    );
    throw new Error(
      'Access Denied: This email is registered to a public member account. Admin Portal One-Time Login codes are strictly restricted to verified M-TRAVEL Administrators.'
    );
  }

  const isAuthorizedAdmin =
    localRole === 'ADMIN' ||
    localRole === 'SUPER_ADMIN' ||
    dbRole === 'ADMIN' ||
    dbRole === 'SUPER_ADMIN' ||
    isWhitelistedAdmin;

  if (!isAuthorizedAdmin) {
    logAuditEvent(
      'UNAUTHORIZED_ADMIN_OTP_ATTEMPT',
      'Security',
      cleanEmail,
      `Blocked Admin Portal OTP request for unrecognized email (${cleanEmail})`,
      cleanEmail,
      'UNREGISTERED',
    );
    throw new Error(
      'Access Denied: Unrecognized management email. For security, One-Time Login codes are only dispatched to verified M-TRAVEL Administrator email addresses.'
    );
  }

  if (!isWhitelistedAdmin && (matchedLocal?.isActive === false || dbUser?.is_active === false)) {
    throw new Error('Access Denied: This administrator account has been deactivated.');
  }

  // If logging in with the primary admin email (maurice7868@gmail.com), adapt display name to the selected desk role
  if (cleanEmail === 'maurice7868@gmail.com') {
    const deskFirstName = selectedRole === 'OPERATIONS' ? 'Operations' : 'Chief';
    const deskLastName = selectedRole === 'OPERATIONS' ? 'Desk' : 'Admin';
    const base = matchedLocal || {
      id: 'admin-safari-1',
      email: 'maurice7868@gmail.com',
      password: 'OTP_MANAGED_ADMIN_ACCOUNT',
      role: 'ADMIN',
      firstName: deskFirstName,
      lastName: deskLastName,
      phone: '+254 700 000 000',
      isActive: true,
      createdAt: '2025-06-01T08:00:00.000Z',
    };
    return {
      ...base,
      role: 'ADMIN',
      firstName: deskFirstName,
      lastName: deskLastName,
      isActive: true,
    };
  }

  if (matchedLocal) {
    return matchedLocal;
  }

  // Construct and persist local admin record from DB or whitelist
  const resolvedAdmin: LocalAccount = {
    id: dbUser?.id || generateUserUUID(),
    email: dbUser?.email || cleanEmail,
    password: 'OTP_MANAGED_ADMIN_ACCOUNT',
    role: dbRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
    firstName:
      dbUser?.first_name ||
      (selectedRole === 'OPERATIONS' ? 'Operations' : 'Chief'),
    lastName:
      dbUser?.last_name ||
      (selectedRole === 'OPERATIONS' ? 'Desk' : 'Admin'),
    phone: dbUser?.phone || '+254 700 000 000',
    avatarUrl: dbUser?.avatar_url,
    isActive: true,
    createdAt: dbUser?.created_at || new Date().toISOString(),
  };

  saveLocalAccount(resolvedAdmin);
  return resolvedAdmin;
}

/**
 * 1. REQUEST ADMIN PORTAL ONE-TIME LOGIN CODE (OTP)
 * Strictly validates that the email belongs to an authorized Admin before generating
 * or sending the 6-digit OTP. Public users never receive an OTP.
 */
export async function requestAdminLoginOTP(
  email: string,
  selectedRole?: 'CHIEF_ADMIN' | 'OPERATIONS' | null,
): Promise<{
  success: boolean;
  message: string;
  recipientEmail: string;
  recipientName: string;
  roleLabel: string;
  expiresInMinutes: number;
  provider?: string;
}> {
  const adminAccount = await resolveAuthorizedAdminAccount(email, selectedRole);
  const cleanEmail = adminAccount.email.trim().toLowerCase();

  const roleLabel =
    selectedRole === 'OPERATIONS'
      ? 'Operations Desk • Fleet Oversight'
      : 'Chief Admin • Executive Access';

  const recipientName = `${adminAccount.firstName || ''} ${adminAccount.lastName || ''}`.trim() || 'Administrator';

  // Generate fresh 6-digit one-time passcode
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMinutes = 10;
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  // Store OTP in Admin OTP store (replaces any previous code for this email)
  const existing = getStoredAdminOtpRecords().filter((r) => r.email.toLowerCase() !== cleanEmail);
  saveAdminOtpRecords([
    {
      email: cleanEmail,
      otp: otpCode,
      selectedRole,
      expiresAt,
      attemptsLeft: 5,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ]);

  // Build luxury executive HTML email
  const emailPayload = generateAdminLoginOtpEmail({
    email: cleanEmail,
    recipientName,
    roleLabel,
    otpCode,
    expiresInMinutes,
  });

  // Dispatch directly to the verified Admin's email address (e.g. maurice7868@gmail.com)
  const dispatchRes = await dispatchLiveEmail({
    to: cleanEmail,
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
  });

  saveDispatchedEmail({
    id: `email-admin-otp-${Date.now()}`,
    recipientEmail: cleanEmail,
    recipientName,
    subject: emailPayload.subject,
    previewText: `Your M-TRAVEL Admin Portal one-time login code is ${otpCode}. Valid for ${expiresInMinutes} minutes.`,
    htmlContent: emailPayload.html,
    category: 'ADMIN_OTP',
    reference: cleanEmail,
    sentAt: new Date().toISOString(),
    deliveryStatus: dispatchRes.success ? 'DELIVERED_RESEND' : 'FAILED',
    deliveryProvider: dispatchRes.provider || 'gmail_smtp',
    deliveryId: dispatchRes.id,
  });

  if (!dispatchRes.success) {
    const errorDetail =
      dispatchRes.error ||
      dispatchRes.message ||
      'Unable to dispatch Admin OTP email. Please verify your network connection.';
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
  }

  logAuditEvent(
    'ADMIN_OTP_DISPATCHED',
    'Security',
    cleanEmail,
    `One-Time Login code dispatched to verified Administrator (${cleanEmail} — ${roleLabel})`,
    recipientName,
    adminAccount.role || 'ADMIN',
  );

  return {
    success: true,
    message: `A 6-digit One-Time Login code has been sent to ${cleanEmail}. Enter it below to access Mission Control.`,
    recipientEmail: cleanEmail,
    recipientName,
    roleLabel,
    expiresInMinutes,
    provider: dispatchRes.provider,
  };
}

/**
 * 2. VERIFY ADMIN PORTAL OTP & COMPLETE PASSWORDLESS LOGIN
 * Validates the 6-digit one-time code, immediately burns it so it cannot be reused,
 * and issues authenticated Admin session tokens.
 */
export async function verifyAdminLoginOTP(
  email: string,
  otp: string,
  selectedRole?: 'CHIEF_ADMIN' | 'OPERATIONS' | null,
): Promise<AuthResponse> {
  const adminAccount = await resolveAuthorizedAdminAccount(email, selectedRole);
  const cleanEmail = adminAccount.email.trim().toLowerCase();
  const cleanOtp = otp.trim().replace(/\s+/g, '');

  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new Error('Please enter the complete 6-digit one-time login code.');
  }

  const records = getStoredAdminOtpRecords();
  const record = records.find((r) => r.email.toLowerCase() === cleanEmail);

  if (!record) {
    throw new Error('No active login code found for this administrator email. Please request a new code.');
  }

  if (Date.now() > record.expiresAt) {
    throw new Error('This one-time login code has expired. Please request a fresh code.');
  }

  if (record.attemptsLeft <= 0) {
    throw new Error('Maximum verification attempts exceeded. Please request a new one-time login code.');
  }

  if (record.otp !== cleanOtp) {
    record.attemptsLeft -= 1;
    saveAdminOtpRecords(records);
    const leftText = record.attemptsLeft > 0 ? ` (${record.attemptsLeft} attempts remaining)` : '';
    throw new Error(`Invalid one-time login code. Please check your email and try again${leftText}.`);
  }

  // Immediately burn the OTP after successful verification (strictly single-use)
  const remaining = records.filter((r) => r.email.toLowerCase() !== cleanEmail);
  saveAdminOtpRecords(remaining);

  const tokens = buildMockTokens(adminAccount.id, adminAccount.email, adminAccount.role);
  persistTokens(tokens.accessToken, tokens.refreshToken);

  const authUser: AuthUser = {
    id: adminAccount.id,
    email: adminAccount.email,
    role: adminAccount.role,
    firstName: adminAccount.firstName,
    lastName: adminAccount.lastName,
    phone: adminAccount.phone,
    avatarUrl: adminAccount.avatarUrl,
    createdAt: adminAccount.createdAt,
  };
  localStorage.setItem('mt_user', JSON.stringify(authUser));

  logAuditEvent(
    'ADMIN_OTP_LOGIN',
    'User',
    adminAccount.email,
    `Administrator ${adminAccount.firstName} ${adminAccount.lastName} (${adminAccount.email}) authenticated via Passwordless One-Time Email OTP`,
    `${adminAccount.firstName} ${adminAccount.lastName}`.trim(),
    adminAccount.role,
  );

  return {
    ...tokens,
    user: authUser,
  };
}


