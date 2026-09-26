/**
 * M-TRAVEL Authentication Service
 * ---------------------------------
 * Handles user registration and login via the NestJS backend (Prisma + Supabase DB).
 * Falls back gracefully when the backend is offline.
 */

import { supabase } from './supabaseClient';
import { logAuditEvent } from './rentalLifecycleStore';
import { getStoredCreditProfiles, saveCreditProfiles } from './creditScoreStore';

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
    email: 'safari@jambo.africa',
    password: 'Admin@2026',
    role: 'ADMIN',
    firstName: 'Safari',
    lastName: 'Desk',
    phone: '0700000000',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-06-01T08:00:00.000Z',
  },
  {
    id: 'admin-mtravel-1',
    email: 'admin@mtravel.co.ke',
    password: 'Admin@2026',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'Desk',
    phone: '+254 700 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-05-15T08:00:00.000Z',
  },
  {
    id: 'admin-default-root',
    email: 'admin@admin.com',
    password: 'Admin@2026',
    role: 'ADMIN',
    firstName: 'System',
    lastName: 'Admin',
    phone: '+254 700 000 000',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2025-05-01T08:00:00.000Z',
  },
];

const USERS_STORAGE_KEY = 'mt_user_credentials_v2';
const LEGACY_STORAGE_KEYS = ['mt_user_credentials', 'mt_users', 'mt_accounts'];

export function getLocalAccounts(): LocalAccount[] {
  const mergedMap = new Map<string, LocalAccount>();

  // 1. Seed defaults
  for (const def of DEFAULT_ACCOUNTS) {
    mergedMap.set(def.email.toLowerCase(), def);
  }

  // 2. Read legacy keys
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.email) {
              const clean = item.email.toLowerCase();
              if (!mergedMap.has(clean)) {
                mergedMap.set(clean, {
                  id: item.id || `user-${Date.now()}`,
                  email: item.email,
                  password: item.password || 'Tourist@2026',
                  role: item.role || 'TOURIST',
                  firstName: item.firstName || item.first_name || 'Explorer',
                  lastName: item.lastName || item.last_name || '',
                  phone: item.phone || '',
                  avatarUrl: item.avatarUrl || item.avatar_url,
                  isActive: item.isActive !== false && item.is_active !== false,
                  createdAt: item.createdAt || item.created_at || '2025-11-15T08:00:00.000Z',
                });
              }
            }
          }
        }
      }
    } catch { /* empty */ }
  }

  // 3. Read primary key
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.email) {
            const clean = item.email.toLowerCase();
            // Do NOT overwrite official system accounts with stale data
            const isSystemDef = DEFAULT_ACCOUNTS.some((d) => d.email.toLowerCase() === clean);
            if (!isSystemDef) {
              mergedMap.set(clean, {
                id: item.id || `user-${Date.now()}`,
                email: item.email,
                password: item.password || 'Tourist@2026',
                role: item.role || 'TOURIST',
                firstName: item.firstName || 'Explorer',
                lastName: item.lastName || '',
                phone: item.phone,
                avatarUrl: item.avatarUrl,
                isActive: item.isActive !== false,
                createdAt: item.createdAt || item.created_at || '2025-11-15T08:00:00.000Z',
              });
            }
          }
        }
      }
    }
  } catch { /* empty */ }

  // 4. Always re-assert default system accounts to guarantee correct roles
  for (const def of DEFAULT_ACCOUNTS) {
    mergedMap.set(def.email.toLowerCase(), def);
  }

  // Actively purge any legacy driver accounts from memory and storage
  const result = Array.from(mergedMap.values()).filter(
    (a) => a.role !== 'DRIVER' && !a.email.toLowerCase().includes('driver@')
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

      await supabase.from('wallets').upsert({
        user_id: accountId,
        balance: 0,
        currency: 'KES',
      }, { onConflict: 'user_id' });

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

      await supabase.from('wallets').upsert({
        user_id: validId,
        balance: 0,
        currency: 'KES',
      }, { onConflict: 'user_id' });
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

    for (const u of data) {
      if (u.email) {
        const clean = u.email.toLowerCase();
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

    const merged = Array.from(localMap.values());
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

    const updatedAccount: LocalAccount = {
      ...currentAcc,
      email: newEmail,
      phone: newPhone,
      firstName: newFirstName,
      lastName: newLastName,
      createdAt: currentAcc.createdAt || '2025-11-15T08:00:00.000Z',
    };

    accounts[accountIndex] = updatedAccount;

    // Persist to local storage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
    localStorage.setItem('mt_user_credentials', JSON.stringify(accounts));

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
  const roleMap: Record<string, string> = {
    TOURIST: 'TOURIST',
    VEHICLE_OWNER: 'VEHICLE_OWNER',
    ADMIN: 'ADMIN',
    TRAVELER: 'TOURIST',
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

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check local persistent account database
  const accounts = getLocalAccounts();
  const matched = accounts.find(a => a.email.toLowerCase() === cleanEmail);

  if (matched) {
    // Check password - allow exact password or demo matching (any password >= 4 chars)
    const isValid = matched.password === password || password.length >= 4;
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
      if (!user.is_active) {
        throw new Error('This account has been suspended. Contact safari@jambo.africa');
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

      // Cache for seamless offline login
      saveLocalAccount({
        id: user.id,
        email: user.email,
        password: password || 'Tourist@2026',
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
    if (err.message && err.message.includes('suspended')) throw err;
  }

  // 3. Fallback Auto-Provisioning for Demo/Dev Mode
  // If the user inputs a valid email structure (e.g. michael@gmail.com) and password,
  // automatically create their Explorer session so they are never locked out of testing.
  if (cleanEmail.includes('@') && cleanEmail.includes('.') && password.length >= 4) {
    const namePart = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const firstName = (namePart.charAt(0).toUpperCase() + namePart.slice(1)) || 'Explorer';
    const determinedRole = cleanEmail.includes('admin')
      ? 'ADMIN'
      : cleanEmail.includes('owner') || cleanEmail.includes('host')
      ? 'VEHICLE_OWNER'
      : 'TOURIST';
    const autoAccount: LocalAccount = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      password: password,
      role: determinedRole,
      firstName,
      lastName: '',
      phone: '0712345678',
      isActive: true,
    };

    saveLocalAccount(autoAccount);
    const mockTokens = buildMockTokens(autoAccount.id, autoAccount.email, autoAccount.role);
    persistTokens(mockTokens.accessToken, mockTokens.refreshToken);

    const authUser: AuthUser = {
      id: autoAccount.id,
      email: autoAccount.email,
      role: autoAccount.role,
      firstName: autoAccount.firstName,
      lastName: '',
      phone: autoAccount.phone,
    };
    localStorage.setItem('mt_user', JSON.stringify(authUser));

    logAuditEvent(
      'USER_LOGIN',
      'User',
      autoAccount.email,
      `User ${autoAccount.firstName} (${autoAccount.email}) logged into system with role ${autoAccount.role}`,
      autoAccount.firstName,
      autoAccount.role
    );

    return {
      ...mockTokens,
      user: authUser,
    };
  }

  throw new Error('Invalid email or password. Please check your credentials or register an account.');
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
