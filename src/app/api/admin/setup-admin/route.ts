import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Security check: Disable setup route in production unless explicitly allowed
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SETUP_ADMIN !== 'true') {
      return NextResponse.json(
        { error: 'Endpoint disabled in production for security. Manage admin accounts via Supabase Dashboard.' },
        { status: 403 }
      );
    }
    const adminSupabase = createAdminClient();
    const adminEmail = 'admin@japanvoyage.com';
    const adminPassword = 'AdminJapanVoyage2026!';

    // 1. Check if user already exists in auth
    const { data: listData, error: listErr } = await adminSupabase.auth.admin.listUsers();
    if (listErr) {
      console.error('Error listing users:', listErr.message);
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    const existingUser = listData.users.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    let userId = '';

    if (existingUser) {
      userId = existingUser.id;
      // Update password and ensure email is confirmed
      const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            full_name: 'Platform Administrator',
          },
        }
      );

      if (updateErr) {
        console.error('Error updating user password:', updateErr.message);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      // Create user directly via Supabase Auth Admin API
      const { data: createData, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Platform Administrator',
        },
      });

      if (createErr || !createData.user) {
        console.error('Error creating admin user:', createErr?.message);
        return NextResponse.json({ error: createErr?.message || 'Failed to create user' }, { status: 500 });
      }

      userId = createData.user.id;
    }

    // 2. Ensure profile role is 'admin' in public.profiles
    const { error: profileErr } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        full_name: 'Platform Administrator',
        role: 'admin',
        preferred_currency: 'PKR',
        updated_at: new Date().toISOString(),
      });

    if (profileErr) {
      console.warn('Profile update warning:', profileErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account has been configured and verified successfully!',
      credentials: {
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      },
    });
  } catch (err: any) {
    console.error('Exception in setup-admin:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
