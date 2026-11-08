import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tourSlug,
      tourId,
      optionId,
      travelDate,
      leadTraveler,
      participants,
      paymentMethod = 'easypaisa',
      chargedCurrency = 'PKR',
      chargedAmount,
      totalBaseJpy,
      exchangeRate = 1.0,
    } = body;

    // Check if the caller has an active authenticated session
    let userId: string | null = null;
    try {
      const serverSupabase = createServerClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Unauthenticated or guest
    }

    const adminSupabase = createAdminClient();

    // 1. Locate valid schedule for option or default schedule
    let scheduleId: string | null = null;
    if (optionId && optionId.length === 36) {
      const { data: schedule } = await adminSupabase
        .from('tour_schedules')
        .select('id')
        .eq('tour_option_id', optionId)
        .gte('tour_date', travelDate || new Date().toISOString().split('T')[0])
        .order('tour_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (schedule) {
        scheduleId = schedule.id;
      }
    }

    // Fallback schedule lookup if specific option schedule not found
    if (!scheduleId) {
      const { data: defaultSchedule } = await adminSupabase
        .from('tour_schedules')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (defaultSchedule) {
        scheduleId = defaultSchedule.id;
      }
    }

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'No departure schedule found for the selected date.' },
        { status: 400 }
      );
    }

    // 2. Generate unique booking reference
    const timestampPart = Date.now().toString().slice(-4);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `JV-2026-${randomHex}${timestampPart}`;

    // 3. Insert confirmed booking record
    const { data: booking, error: bookingErr } = await adminSupabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        user_id: userId,
        tour_schedule_id: scheduleId,
        lead_traveler_name: `${leadTraveler.firstName || ''} ${leadTraveler.lastName || ''}`.trim() || 'Lead Traveler',
        lead_traveler_email: (leadTraveler.email || 'traveler@example.com').trim().toLowerCase(),
        lead_traveler_phone: `${leadTraveler.countryCode || '+1'} ${leadTraveler.phoneNumber || '0000000000'}`.trim(),
        emergency_contact: leadTraveler.emergencyContact || null,
        special_requirements: leadTraveler.specialRequests || null,
        total_participants: Array.isArray(participants) && participants.length > 0 ? participants.length : 1,
        base_currency: 'JPY',
        total_base_amount: totalBaseJpy || 14500,
        charged_currency: chargedCurrency || 'PKR',
        charged_amount: chargedAmount || totalBaseJpy || 14500,
        exchange_rate_applied: exchangeRate || 1.82,
        payment_method: paymentMethod || 'easypaisa',
        status: 'hold_pending_payment',
      })
      .select('id, booking_reference, status, created_at')
      .single();

    if (bookingErr) {
      console.error('Failed to create booking in Supabase:', bookingErr.message);
      return NextResponse.json({ error: bookingErr.message }, { status: 500 });
    }

    // 4. Insert participant manifest
    if (booking && Array.isArray(participants) && participants.length > 0) {
      const participantRows = participants.map((p: any) => ({
        booking_id: booking.id,
        tier_type: p.tier_type || 'adult',
        full_name: p.full_name || 'Traveler',
        nationality: p.nationality || 'International',
      }));

      await adminSupabase.from('booking_participants').insert(participantRows);
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.booking_reference,
        status: booking.status,
      },
    });
  } catch (err: any) {
    console.error('Booking API handler exception:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while processing booking.' },
      { status: 500 }
    );
  }
}
