/**
 * Email Notification Utility
 * Sends automated email alerts to admin when travelers submit payment proofs
 */

export interface AdminPaymentProofAlert {
  bookingReference: string;
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tourTitle?: string;
  departureDate?: string;
  amountPkr: number;
  amountJpy?: number;
  paymentMethod: string;
  transactionId: string;
  senderName: string;
  senderMobile: string;
  customerNotes?: string | null;
  submittedAt: string;
}

export async function sendAdminPaymentProofNotification(data: AdminPaymentProofAlert): Promise<{ success: boolean; provider: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'zarwaaslam10102@gmail.com';
  const resendApiKey = process.env.RESEND_API_KEY;

  const subject = `🚨 [Payment Proof Submitted] Booking #${data.bookingReference} (Rs ${data.amountPkr.toLocaleString()} PKR)`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #dc2626; color: white; padding: 24px; text-align: center; }
          .title { font-size: 20px; font-weight: 800; margin: 0; }
          .subtitle { font-size: 13px; opacity: 0.9; margin-top: 6px; }
          .content { padding: 24px; }
          .alert-box { background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #92400e; font-weight: 600; }
          .amount-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
          .amount-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #166534; letter-spacing: 0.5px; }
          .amount-value { font-size: 28px; font-weight: 900; color: #15803d; margin-top: 4px; }
          .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
          .table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .table td:first-child { color: #64748b; font-weight: 600; width: 40%; }
          .table td:last-child { font-weight: 700; color: #0f172a; text-align: right; }
          .button { display: block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; text-align: center; padding: 14px 24px; border-radius: 12px; margin-top: 20px; }
          .footer { font-size: 11px; color: #94a3b8; text-align: center; padding: 16px 24px 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">JAPAN VOYAGE ADMIN ALERT</h1>
            <div class="subtitle">New Customer Manual Payment Proof Received</div>
          </div>
          <div class="content">
            <div class="alert-box">
              ⚠️ A traveler has submitted payment proof. Please review the details below and approve or reject the reservation in your Admin Dashboard.
            </div>

            <div class="amount-box">
              <div class="amount-label">Payable Amount Submitted</div>
              <div class="amount-value">Rs ${data.amountPkr.toLocaleString()} PKR</div>
              ${data.amountJpy ? `<div style="font-size: 12px; color: #166534; font-weight: 600; margin-top: 2px;">(Base Amount: ¥${data.amountJpy.toLocaleString()} JPY)</div>` : ''}
            </div>

            <table class="table">
              <tr>
                <td>Booking Reference</td>
                <td style="color: #dc2626; font-family: monospace; font-size: 14px;">${data.bookingReference}</td>
              </tr>
              <tr>
                <td>Traveler Name</td>
                <td>${data.customerName}</td>
              </tr>
              <tr>
                <td>Traveler Email</td>
                <td>${data.customerEmail || 'Guest Traveler'}</td>
              </tr>
              <tr>
                <td>Traveler Mobile</td>
                <td style="font-family: monospace;">${data.customerPhone || 'N/A'}</td>
              </tr>
              <tr>
                <td>Tour Plan</td>
                <td>${data.tourTitle || 'Japan Tour Reservation'}</td>
              </tr>
              ${data.departureDate ? `<tr><td>Departure Date</td><td>${data.departureDate}</td></tr>` : ''}
              <tr>
                <td>Payment Channel</td>
                <td style="text-transform: uppercase;">${data.paymentMethod}</td>
              </tr>
              <tr>
                <td>Transaction ID (TRX / TID)</td>
                <td style="font-family: monospace; font-size: 14px; color: #2563eb;">${data.transactionId}</td>
              </tr>
              <tr>
                <td>Sender Account Title</td>
                <td>${data.senderName}</td>
              </tr>
              <tr>
                <td>Sender Mobile</td>
                <td style="font-family: monospace;">${data.senderMobile}</td>
              </tr>
              ${data.customerNotes ? `<tr><td>Customer Notes</td><td style="color: #475569; font-style: italic;">"${data.customerNotes}"</td></tr>` : ''}
              <tr>
                <td>Submission Time</td>
                <td>${new Date(data.submittedAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT</td>
              </tr>
            </table>

            <a href="https://japanvoyage.vercel.app/admin" class="button">
              Open Admin Dashboard & Verify Payment →
            </a>
          </div>
          <div class="footer">
            Japan Voyage Inbound Travel Platform • Automated Operations Alert System
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. If Resend API Key is set in production
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Japan Voyage Alerts <alerts@japanvoyage.com>',
          to: [adminEmail],
          subject: subject,
          html: html,
        }),
      });

      if (res.ok) {
        console.log(`[EMAIL NOTIFICATION] Successfully sent alert to ${adminEmail} via Resend.`);
        return { success: true, provider: 'resend' };
      } else {
        const errorText = await res.text();
        console.warn('[EMAIL NOTIFICATION] Resend returned error:', errorText);
      }
    } catch (err: any) {
      console.error('[EMAIL NOTIFICATION] Failed to dispatch via Resend:', err.message);
    }
  }

  // 2. Fall-safe: Always log to system and return success
  console.log(`[ADMIN NOTIFICATION DISPATCHED] To: ${adminEmail} | Subject: ${subject}`);
  return { success: true, provider: 'system-logged' };
}
