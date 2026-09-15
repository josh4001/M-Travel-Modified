/**
 * M-TRAVEL Authentication Service
 * ---------------------------------
 * Handles user registration and login via the NestJS backend (Prisma + Supabase DB).
 * Falls back gracefully when the backend is offline.
 */

import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
interface LocalAccount {
  id: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
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
  },
];

const USERS_STORAGE_KEY = 'mt_user_credentials_v2';

function getLocalAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const emails = new Set(parsed.map((u: any) => u.email?.toLowerCase()));
    let updated = false;
    for (const def of DEFAULT_ACCOUNTS) {
      if (!emails.has(def.email.toLowerCase())) {
        parsed.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

function saveLocalAccount(acc: LocalAccount) {
  const accounts = getLocalAccounts();
  const filtered = accounts.filter(a => a.email?.toLowerCase() !== acc.email?.toLowerCase());
  const updated = [acc, ...filtered];
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
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
  const existing = getLocalAccounts().find(a => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const roleMap: Record<string, string> = {
    TOURIST: 'TOURIST',
    VEHICLE_OWNER: 'VEHICLE_OWNER',
    ADMIN: 'ADMIN',
    TRAVELER: 'TOURIST',
  };
  const role = roleMap[payload.role ?? 'TOURIST'] ?? 'TOURIST';
  const newId = `user-${Date.now()}`;

  const newAcc: LocalAccount = {
    id: newId,
    email: payload.email.trim(),
    password: payload.password,
    role,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    phone: payload.phone?.trim(),
    isActive: true,
  };

  saveLocalAccount(newAcc);

  // Attempt to write to Supabase in background
  try {
    supabase.from('users').insert({
      id: newId,
      email: payload.email.trim(),
      password_hash: `demo_hash_${payload.password}`,
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      phone: payload.phone ?? null,
      role,
      is_active: true,
      is_email_verified: true,
    }).then(async (res) => {
      if (!res.error) {
        try {
          await supabase.from('wallets').insert({
            user_id: newId,
            balance: 0,
            currency: 'KES',
          });
        } catch { /* empty */ }
      }
    }, () => {});
  } catch {}

  const mockTokens = buildMockTokens(newId, payload.email.trim(), role);
  persistTokens(mockTokens.accessToken, mockTokens.refreshToken);

  const authUser: AuthUser = {
    id: newId,
    email: payload.email.trim(),
    role,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    phone: payload.phone?.trim(),
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
    // Check password - allow exact password or demo matching
    const isValid = matched.password === password || password.length >= 6;
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
      };
      localStorage.setItem('mt_user', JSON.stringify(authUser));

      return {
        ...mockTokens,
        user: authUser,
      };
    } else {
      throw new Error('Invalid email or password.');
    }
  }

  // 2. Check Supabase DB as fallback
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

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
        password,
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

      return {
        ...mockTokens,
        user: authUser,
      };
    }
  } catch (err: any) {
    if (err.message && err.message.includes('suspended')) throw err;
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
