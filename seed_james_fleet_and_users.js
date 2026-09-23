import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xbldmaifdqiakqfjrvei.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibGRtYWlmZHFpYWtxZmpydmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTQ5NzMsImV4cCI6MjEwNTAzMDk3M30.Gpo2a4O8oQO1rOq1NYGIYQ2n25RctRPB6jBBUA44xDc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const jamesHostId = 'a0000000-0000-0000-0000-000000000002';

const defaultUsers = [
  {
    id: 'user-tourist-1',
    email: 'sarah.ochieng@gmail.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Sarah',
    last_name: 'Ochieng',
    role: 'TOURIST',
    phone: '0712345678',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'user-tourist-michael',
    email: 'michael@gmail.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Michael',
    last_name: 'Explorer',
    role: 'TOURIST',
    phone: '0712345678',
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
    phone: '0712345678',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'admin-safari-1',
    email: 'safari@jambo.africa',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Safari',
    last_name: 'Desk',
    role: 'ADMIN',
    phone: '0700000000',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'admin-mtravel-1',
    email: 'admin@mtravel.co.ke',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'Admin',
    last_name: 'Desk',
    role: 'ADMIN',
    phone: '+254 700 000 000',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
  {
    id: 'admin-default-root',
    email: 'admin@admin.com',
    password_hash: '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u',
    first_name: 'System',
    last_name: 'Admin',
    role: 'ADMIN',
    phone: '+254 700 000 000',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    is_active: true,
  },
];

const jamesVehicles = [];

async function run() {
  console.log('1. Seeding system users to Supabase users table...');
  for (const u of defaultUsers) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'email' });
    if (error) {
      console.error(`Error upserting user ${u.email}:`, error.message);
    } else {
      console.log(`✓ Synced user ${u.email}`);
    }
  }

  console.log('\n2. Seeding James Mwangi\'s 7 registered vehicles to Supabase vehicles table...');
  for (const v of jamesVehicles) {
    const { images, ...vData } = v;
    const { error: vError } = await supabase.from('vehicles').upsert(vData, { onConflict: 'id' });
    if (vError) {
      console.error(`Error upserting vehicle ${v.make} ${v.model}:`, vError.message);
    } else {
      console.log(`✓ Synced vehicle ${v.make} ${v.model} (${v.plate_number})`);
      if (images && images.length > 0) {
        const imgRows = images.map((url, idx) => ({
          vehicle_id: v.id,
          url,
          is_primary: idx === 0,
        }));
        await supabase.from('vehicle_images').upsert(imgRows, { onConflict: 'vehicle_id,url' });
      }
    }
  }

  console.log('\nDone! Checking final vehicle count in Supabase...');
  const { data: vList } = await supabase.from('vehicles').select('id, make, model, plate_number, owner_id');
  console.log('Current vehicles in Supabase:', vList);
}

run();
