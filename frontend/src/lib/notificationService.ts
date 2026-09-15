import { supabase } from './supabaseClient';

export interface AppNotification {
  id: string;
  recipient_id?: string;
  role?: 'ADMIN' | 'VEHICLE_OWNER' | 'TOURIST';
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

const LOCAL_NOTIFS_KEY = 'mt_app_notifications';

function getLocalNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(list: AppNotification[]) {
  try {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
}

/**
 * Dispatch a system notification/alert to specific user or role
 */
export async function sendNotification(payload: {
  recipientId?: string;
  role?: 'ADMIN' | 'VEHICLE_OWNER' | 'TOURIST';
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  const notif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipient_id: payload.recipientId,
    role: payload.role,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // 1. Try sending to Supabase
  try {
    await supabase.from('notifications').insert({
      user_id: payload.recipientId,
      title: payload.title,
      message: payload.message,
      is_read: false,
    });
  } catch {
    // Table or backend offline fallback
  }

  // 2. Save locally for instantaneous cross-tab / state updates
  const current = getLocalNotifications();
  saveLocalNotifications([notif, ...current]);
  window.dispatchEvent(new CustomEvent('mt_notification_received', { detail: notif }));
}

/**
 * Fetch notifications for a user or role
 */
export async function fetchNotifications(userId?: string, role?: string): Promise<AppNotification[]> {
  let dbNotifs: AppNotification[] = [];

  try {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query;
    if (data) {
      dbNotifs = data.map((n: any) => ({
        id: n.id,
        recipient_id: n.user_id,
        type: 'SYSTEM',
        title: n.title,
        message: n.message,
        is_read: n.is_read ?? false,
        created_at: n.created_at,
      }));
    }
  } catch {}

  const local = getLocalNotifications();
  const filteredLocal = local.filter((n) => {
    // 1. If notification has an explicit recipient, it MUST strictly match the requested userId
    if (n.recipient_id) {
      return !!userId && n.recipient_id === userId;
    }
    // 2. Generic platform-wide broadcast for an entire role without a specific recipient
    if (!n.recipient_id && role && n.role === role) {
      return true;
    }
    // 3. Universal broadcast with no recipient and no role
    if (!n.recipient_id && !n.role) {
      return true;
    }
    return false;
  });

  // Combine and deduplicate
  const combined = [...filteredLocal, ...dbNotifs];
  const uniqueMap = new Map<string, AppNotification>();
  combined.forEach((n) => uniqueMap.set(n.id, n));

  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Mark notification as read */
export function markNotificationAsRead(id: string) {
  const current = getLocalNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, is_read: true } : n));
  saveLocalNotifications(updated);
}
