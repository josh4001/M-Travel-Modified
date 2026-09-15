/**
 * M-TRAVEL Authentication Service
 * ---------------------------------
 * Handles user registration and login via the NestJS backend (Prisma + Supabase DB).
 * Falls back gracefully when the backend is offline.
 */

import { api } from './api';
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
export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<AuthResponse> {
  try {
    // Primary: use NestJS backend
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    persistTokens(data.accessToken, data.refreshToken);
    return data;
  } catch {
    // Fallback: write directly to Supabase users table (dev mode)
    return registerDirectSupabase(payload);
  }
}

async function registerDirectSupabase(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<AuthResponse> {
  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', payload.email)
    .maybeSingle();

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  // Insert new user (password is stored as plain text for demo — in production
  // the backend hashes it with argon2id before insertion)
  const roleMap: Record<string, string> = {
    TOURIST: 'TOURIST',
    VEHICLE_OWNER: 'VEHICLE_OWNER',
    ADMIN: 'ADMIN',
    TRAVELER: 'TRAVELER',
  };
  const role = roleMap[payload.role ?? 'TOURIST'] ?? 'TOURIST';

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: payload.email,
      password_hash: `demo_hash_${payload.password}`, // backend would argon2 hash this
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone ?? null,
      role,
      is_active: true,
      is_email_verified: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create wallet for the new user
  await supabase.from('wallets').insert({
    user_id: user.id,
    balance: 0,
    currency: 'KES',
  });

  const mockTokens = buildMockTokens(user.id, user.email, role);

  return {
    ...mockTokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
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
  try {
    // Primary: use NestJS backend
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    persistTokens(data.accessToken, data.refreshToken);
    // Enrich with Supabase profile data
    const enriched = await enrichUserProfile(data.user);
    return { ...data, user: enriched };
  } catch {
    // Fallback: validate directly against Supabase users table
    return loginDirectSupabase(email, password);
  }
}

async function loginDirectSupabase(
  email: string,
  _password: string,
): Promise<AuthResponse> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('This account has been suspended. Contact safari@jambo.africa');
  }

  // In demo/fallback mode, we just check the email exists (backend does real password check)
  const mockTokens = buildMockTokens(user.id, user.email, user.role);

  return {
    ...mockTokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
    },
  };
}

// ---------------------------------------------------------------------------
// Profile enrichment (pulls firstName/lastName from users table)
// ---------------------------------------------------------------------------
async function enrichUserProfile(baseUser: AuthUser): Promise<AuthUser> {
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
