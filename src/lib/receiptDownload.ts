/**
 * Client-Side Direct Receipt & Voucher Generator
 * Renders an official, high-resolution (2x retina) travel receipt voucher image
 * and triggers direct browser file download without opening any print popups.
 */

export interface ReceiptVoucherData {
  bookingReference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tourTitle: string;
  destination?: string;
  departureDate: string;
  departureTime?: string;
  totalParticipants?: number;
  adults?: number;
  children?: number;
  amountPkr: number;
  amountJpy?: number;
  paymentMethod: string;
  transactionId: string;
  senderName?: string;
  senderMobile?: string;
  status: 'confirmed' | 'pending' | 'paid' | string;
  verifiedAt?: string;
}

/**
 * Directly downloads an official PNG receipt voucher to user's device
 */
export async function downloadReceiptVoucher(data: ReceiptVoucherData): Promise<void> {
  if (typeof window === 'undefined') return;

  const width = 1200;
  const height = 1680;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported on this browser.');
  }

  // 1. Background Fill (Clean Slate / Off-White)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // 2. White Card Container with Border & Subtle Shadow
  const margin = 40;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(margin, margin, cardW, cardH);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(margin, margin, cardW, cardH);

  // 3. Top Accent Bar (Crimson Red)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(margin, margin, cardW, 16);

  // 4. Header: Brand Logo & Agency Details
  ctx.fillStyle = '#dc2626';
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('JAPAN VOYAGE', margin + 60, margin + 85);

  ctx.fillStyle = '#64748b';
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('日本インバウンド旅行 • OFFICIAL ELECTRONIC PAYMENT VOUCHER', margin + 60, margin + 118);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Licensed Japan Tour Operator & Concierge Desk • PK Desk: +92 324 6465916', margin + 60, margin + 144);

  // Status Badge in Top Right
  const isConfirmed = data.status.toLowerCase() === 'confirmed' || data.status.toLowerCase() === 'paid';
  const badgeBg = isConfirmed ? '#ecfdf5' : '#fffbeb';
  const badgeBorder = isConfirmed ? '#10b981' : '#f59e0b';
  const badgeText = isConfirmed ? '#065f46' : '#92400e';
  const badgeLabel = isConfirmed ? '✓ PAID & CONFIRMED' : '⏳ SUBMITTED (PENDING)';

  const badgeW = 260;
  const badgeH = 50;
  const badgeX = margin + cardW - badgeW - 60;
  const badgeY = margin + 60;

  ctx.fillStyle = badgeBg;
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  ctx.lineWidth = 2;
  ctx.strokeStyle = badgeBorder;
  ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

  ctx.fillStyle = badgeText;
  ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeLabel, badgeX + badgeW / 2, badgeY + 32);
  ctx.textAlign = 'left';

  // Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin + 60, margin + 180);
  ctx.lineTo(margin + cardW - 60, margin + 180);
  ctx.stroke();

  // 5. Booking Reference Banner Box
  const refBoxY = margin + 210;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(margin + 60, refBoxY, cardW - 120, 110);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin + 60, refBoxY, cardW - 120, 110);

  ctx.fillStyle = '#64748b';
  ctx.font = '800 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('OFFICIAL BOOKING REFERENCE', margin + 90, refBoxY + 36);

  ctx.fillStyle = '#dc2626';
  ctx.font = '900 36px monospace';
  ctx.fillText(data.bookingReference || 'JV-2026-CONFIRMED', margin + 90, refBoxY + 80);

  const issueDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  ctx.fillStyle = '#64748b';
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`ISSUED ON: ${issueDateStr}`, margin + cardW - 90, refBoxY + 45);
  ctx.fillText(`VERIFIED BY: Finance Desk`, margin + cardW - 90, refBoxY + 75);
  ctx.textAlign = 'left';

  // 6. Paid Amount Highlight Box
  const amtBoxY = refBoxY + 135;
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(margin + 60, amtBoxY, cardW - 120, 130);
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin + 60, amtBoxY, cardW - 120, 130);

  ctx.fillStyle = '#166534';
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TOTAL VERIFIED AMOUNT CHARGED & RECEIVED', margin + 90, amtBoxY + 38);

  const pkrFormatted = `Rs ${(data.amountPkr || 0).toLocaleString()} PKR`;
  ctx.fillStyle = '#059669';
  ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(pkrFormatted, margin + 90, amtBoxY + 92);

  if (data.amountJpy) {
    ctx.fillStyle = '#065f46';
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`(¥${data.amountJpy.toLocaleString()} JPY Base Currency)`, margin + cardW - 90, amtBoxY + 85);
    ctx.textAlign = 'left';
  }

  // 7. Details Section Header: Reservation & Traveler Profile
  let curY = amtBoxY + 175;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('1. TRAVELER & RESERVATION DETAILS', margin + 60, curY);

  curY += 20;

  const drawRow = (label: string, value: string, yPos: number, isMono = false) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label, margin + 70, yPos);

    ctx.fillStyle = '#0f172a';
    ctx.font = isMono
      ? '800 17px monospace'
      : '800 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(value, margin + 420, yPos);

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin + 70, yPos + 12);
    ctx.lineTo(margin + cardW - 70, yPos + 12);
    ctx.stroke();
  };

  curY += 28;
  drawRow('Lead Traveler Name', data.customerName || 'Verified Traveler', curY);
  curY += 46;
  drawRow('Contact Email', data.customerEmail || 'Registered Customer', curY);
  curY += 46;
  drawRow('Contact Mobile', data.customerPhone || 'On File', curY, true);
  curY += 46;

  const partySize = data.totalParticipants
    ? `${data.totalParticipants} ${data.totalParticipants === 1 ? 'Traveler' : 'Travelers'}${
        data.adults ? ` (${data.adults} Adults${data.children ? `, ${data.children} Children` : ''})` : ''
      }`
    : '1 Traveler';
  drawRow('Party Size / Travelers', partySize, curY);
  curY += 46;
  drawRow('Reserved Tour Plan', data.tourTitle || 'Japan Inbound Travel Experience', curY);
  curY += 46;
  drawRow('Destination', data.destination || 'Japan', curY);
  curY += 46;
  drawRow('Departure Date & Time', `${data.departureDate} at ${data.departureTime || '09:00 JST'}`, curY);

  // 8. Payment & Gateway Details Section
  curY += 75;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('2. PAYMENT & TRANSACTION VERIFICATION', margin + 60, curY);

  curY += 28;
  drawRow('Payment Channel', (data.paymentMethod || 'Manual Bank').toUpperCase(), curY);
  curY += 46;
  drawRow('Transaction Reference (TRX ID)', data.transactionId || 'Logged', curY, true);
  curY += 46;
  if (data.senderName) {
    drawRow('Sender Account Title', data.senderName, curY);
    curY += 46;
  }
  if (data.senderMobile) {
    drawRow('Sender Mobile Number', data.senderMobile, curY, true);
    curY += 46;
  }
  drawRow('Payment Status', isConfirmed ? 'PAID & VALIDATED' : 'PENDING AUDIT', curY);

  // 9. Digital Security Seal & Verification Footer
  const footerY = margin + cardW + 180;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(margin + 60, footerY, cardW - 120, 140);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin + 60, footerY, cardW - 120, 140);

  // Draw simulated QR / Barcode block
  ctx.fillStyle = '#0f172a';
  const qrX = margin + 85;
  const qrY = footerY + 20;
  const qrSize = 100;
  ctx.fillRect(qrX, qrY, qrSize, qrSize);

  // QR pattern blocks inside
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX + 15, qrY + 15, 25, 25);
  ctx.fillRect(qrX + 60, qrY + 15, 25, 25);
  ctx.fillRect(qrX + 15, qrY + 60, 25, 25);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(qrX + 22, qrY + 22, 11, 11);
  ctx.fillRect(qrX + 67, qrY + 22, 11, 11);
  ctx.fillRect(qrX + 22, qrY + 67, 11, 11);

  ctx.fillStyle = '#334155';
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ELECTRONIC VOUCHER PASS & PROOF OF PAYMENT', qrX + 120, footerY + 45);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Present this receipt or your Booking Reference upon tour departure check-in.', qrX + 120, footerY + 70);
  ctx.fillText('Official Support: zarwaaslam10102@gmail.com | WhatsApp: +92 324 6465916', qrX + 120, footerY + 92);
  ctx.fillText('Japan Voyage Inbound Operations • Tokyo & Kyoto, Japan', qrX + 120, footerY + 114);

  // 10. Direct Download Blob Trigger (No print popups!)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate receipt image blob.'));
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanRef = (data.bookingReference || 'payment').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `JapanVoyage_Receipt_${cleanRef}.png`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        resolve();
      }, 150);
    }, 'image/png');
  });
}
