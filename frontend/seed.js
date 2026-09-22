import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xbldmaifdqiakqfjrvei.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibGRtYWlmZHFpYWtxZmpydmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTQ5NzMsImV4cCI6MjEwNTAzMDk3M30.Gpo2a4O8oQO1rOq1NYGIYQ2n25RctRPB6jBBUA44xDc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const jamesHostId = 'a0000000-0000-0000-0000-000000000002';

const defaultUsers = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'sarah.ochieng@gmail.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Sarah',
    last_name: 'Ochieng',
    role: 'TOURIST',
    phone: '+254712345671',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'michael@gmail.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Michael',
    last_name: 'Explorer',
    role: 'TOURIST',
    phone: '+254712345673',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: jamesHostId,
    email: 'james.mwangi@mtravel.co.ke',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'James',
    last_name: 'Mwangi',
    role: 'VEHICLE_OWNER',
    phone: '+254712345678',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'safari@jambo.africa',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Safari',
    last_name: 'Desk',
    role: 'ADMIN',
    phone: '+254700000004',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    email: 'admin@mtravel.co.ke',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Admin',
    last_name: 'Desk',
    role: 'ADMIN',
    phone: '+254700000005',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    email: 'admin@admin.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'System',
    last_name: 'Admin',
    role: 'ADMIN',
    phone: '+254700000006',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
];

async function run() {
  console.log('1. Cleaning up un-registered vehicles in Supabase...');
  await supabase.from('vehicles').delete().eq('id', '11111111-1111-4111-8111-111111111111');

  console.log('\n2. Upserting system users with valid UUIDs into Supabase...');
  for (const u of defaultUsers) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'email' });
    if (error) {
      console.error(`Error upserting ${u.email}:`, error.message);
    } else {
      console.log(`✓ Synced user ${u.email} (${u.id})`);
    }
  }

  console.log('\nDone! Checking users in Supabase:');
  const { data: users } = await supabase.from('users').select('id, email, first_name, last_name, role');
  console.log(users);

  console.log('\nChecking vehicles in Supabase:');
  const { data: vehicles } = await supabase.from('vehicles').select('id, make, model, plate_number, is_available');
  console.log(vehicles);
}

run();
