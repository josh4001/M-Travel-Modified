import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

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

interface AuthState {
  user: AuthUser | null;
}

// Rehydrate from localStorage on load
function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('mt_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialState: AuthState = { user: loadUser() };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('mt_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('mt_user');
      }
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem('mt_access_token');
      localStorage.removeItem('mt_refresh_token');
      localStorage.removeItem('mt_user');
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectRole = (state: RootState) => state.auth.user?.role ?? null;
export const selectIsAdmin = (state: RootState) =>
  state.auth.user?.role === 'ADMIN' || state.auth.user?.role === 'SUPER_ADMIN';
export const selectIsOwner = (state: RootState) => state.auth.user?.role === 'VEHICLE_OWNER';
