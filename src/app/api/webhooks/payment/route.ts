import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Secure Webhook Endpoint for Payment Gateway Callbacks (Safepay / Stripe)
// Payment confirmation is strictly server-side only.
// Duplicate webhook deliveries are handled idempotently in the database.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty webhook payload.' }, { status: 400 });
    }

    // 1. Signature Verification
    const safepaySignature = req.headers.get('x-sfpy-signature');
    const stripeSignature = req.headers.get('stripe-signature');
    const webhookSecret =
      process.env.SAFEPAY_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET;

    let provider: 'safepay' | 'stripe' = 'safepay';

    if (stripeSignature) {
      provider = 'stripe';
    }

    // Verify HMAC signature if secret is configured in environment
    if (webhookSecret) {
      const incomingSignature = safepaySignature || stripeSignature;
      if (!incomingSignature) {
        return NextResponse.json(
          { error: 'Missing payment gateway webhook signature header.' },
          { status: 401 }
        );
      }

      const expectedHmac = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      // Constant-time signature comparison to prevent timing attacks
      const incomingBuffer = Buffer.from(incomingSignature);
      const expectedBuffer = Buffer.from(expectedHmac);

      if (
        incomingBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
      ) {
        return NextResponse.json(
          { error: 'Invalid payment gateway webhook signature.' },
          { status: 401 }
        );
      }
    }

    // 2. Parse Event Payload
    const payload = JSON.parse(rawBody);

    // Normalize payload across Safepay and Stripe schemas
    const eventId =
      payload.id ||
      payload.event_id ||
      payload.data?.id ||
      payload.token;

    const eventType = payload.type || payload.event || 'payment.captured';
    const bookingId =
      payload.data?.metadata?.booking_id ||
      payload.metadata?.booking_id ||
      payload.booking_id;

    const transactionId =
      payload.data?.object?.id ||
      payload.data?.id ||
      payload.transaction_id ||
      payload.token;

    const trackerToken =
      payload.data?.tracker?.token ||
      payload.tracker ||
      payload.tracker_token ||
      null;

    const amount = Number(
      payload.data?.object?.amount
        ? payload.data.object.amount / 100 // Stripe cents to standard unit
        : payload.data?.amount || payload.amount || 0
    );

    const currency = (
      payload.data?.object?.currency ||
      payload.data?.currency ||
      payload.currency ||
      'PKR'
    ).toUpperCase();

    if (!eventId || !bookingId || !transactionId || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Malformed webhook event: missing required booking or transaction identifiers.' },
        { status: 400 }
      );
    }

    // 3. Atomically Process Webhook in Supabase via Admin Client
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc('process_payment_webhook', {
      p_gateway_provider: provider,
      p_event_id: eventId,
      p_event_type: eventType,
      p_booking_id: bookingId,
      p_gateway_transaction_id: transactionId,
      p_gateway_tracker_token: trackerToken,
      p_amount: amount,
      p_currency: currency,
      p_payload: payload,
    });

    if (error) {
      console.error('Error executing process_payment_webhook RPC:', error);
      return NextResponse.json(
        { error: 'Database execution failed during webhook processing.', details: error.message },
        { status: 500 }
      );
    }

    // 4. Return Structured Response
    return NextResponse.json({
      received: true,
      provider,
      eventId,
      result: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
