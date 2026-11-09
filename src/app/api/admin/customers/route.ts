import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const serverSupabase = createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdminEmail =
      user.email?.toLowerCase() === 'zarwaaslam10102@gmail.com' ||
      user.email?.toLowerCase() === 'admin@japanvoyage.com';

    if (profile?.role !== 'admin' && !isSuperAdminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isSuperAdminEmail && profile?.role !== 'admin') {
      await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    }

    // 1. Fetch registered profiles
    const { data: profiles, error: pErr } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, role, nationality_code, created_at')
      .order('created_at', { ascending: false });

    if (pErr) {
      console.warn('Profiles fetch error in admin customers:', pErr.message);
    }

    // 2. Fetch all bookings to calculate customer activity
    const { data: bookings, error: bErr } = await adminSupabase
      .from('bookings')
      .select('id, user_id, lead_traveler_name, lead_traveler_email, lead_traveler_phone, total_base_amount, charged_amount, status, created_at');

    if (bErr) {
      console.warn('Bookings fetch error in admin customers:', bErr.message);
    }

    const customerMap = new Map<string, any>();

    // Add registered profiles
    for (const p of profiles || []) {
      const pEmail = (p.email || '').toLowerCase().trim();
      if (!pEmail) continue;
      customerMap.set(pEmail, {
        id: p.id,
        name: p.full_name || pEmail.split('@')[0],
        email: p.email,
        phone: '',
        country: p.nationality_code || 'International Traveler',
        role: p.role || 'customer',
        status: p.role === 'admin' ? 'Admin' : 'Active',
        bookingsCount: 0,
        confirmedBookingsCount: 0,
        spentJpy: 0,
        spentPkr: 0,
        lastBookingDate: null,
        isRegistered: true,
      });
    }

    // Aggregate bookings for each customer
    for (const b of bookings || []) {
      const bEmail = (b.lead_traveler_email || '').toLowerCase().trim();
      if (!bEmail) continue;

      if (!customerMap.has(bEmail)) {
        customerMap.set(bEmail, {
          id: b.id,
          name: b.lead_traveler_name || bEmail.split('@')[0],
          email: b.lead_traveler_email,
          phone: b.lead_traveler_phone || '',
          country: 'Verified Traveler',
          role: 'customer',
          status: 'Guest Traveler',
          bookingsCount: 0,
          confirmedBookingsCount: 0,
          spentJpy: 0,
          spentPkr: 0,
          lastBookingDate: null,
          isRegistered: false,
        });
      }

      const c = customerMap.get(bEmail);
      if (!c.phone && b.lead_traveler_phone) {
        c.phone = b.lead_traveler_phone;
      }
      c.bookingsCount += 1;
      if (b.status === 'confirmed') {
        c.confirmedBookingsCount += 1;
        c.spentJpy += Number(b.total_base_amount) || 0;
        c.spentPkr += Number(b.charged_amount) || 0;
      }
      if (!c.lastBookingDate || new Date(b.created_at) > new Date(c.lastBookingDate)) {
        c.lastBookingDate = b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : null;
      }
    }

    const customers = Array.from(customerMap.values());

    return NextResponse.json({
      success: true,
      customers,
      totalCustomers: customers.length,
      registeredCount: profiles?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
