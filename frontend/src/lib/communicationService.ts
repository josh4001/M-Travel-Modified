/**
 * M-TRAVEL Communication & Notification Service
 * Generates luxury-branded HTML emails (Billion-dollar executive look)
 * and formatted WhatsApp Concierge direct links.
 */

import { supabase } from './supabaseClient';
import type { StoredBooking, StoredVehicle } from './bookingStore';

export interface DispatchedEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  category: 'VEHICLE_APPROVED' | 'DESTINATION_BOOKING' | 'VEHICLE_BOOKING' | 'ADMIN_ALERT';
  reference?: string;
  sentAt: string;
  deliveryStatus?: 'DELIVERED_RESEND' | 'GMAIL_READY' | 'DISPATCHED_LOCAL' | 'FAILED';
  deliveryProvider?: string;
  deliveryId?: string;
  directGmailUrl?: string;
}

const EMAILS_STORAGE_KEY = 'mt_dispatched_emails';
const GATEWAY_CONFIG_KEY = 'mt_email_gateway_config';

export interface OutboundGatewayConfig {
  resendApiKey?: string;
  customSender?: string;
}

export function getOutboundGatewayConfig(): OutboundGatewayConfig {
  try {
    const raw = localStorage.getItem(GATEWAY_CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      resendApiKey: parsed.resendApiKey || (import.meta as any).env?.VITE_RESEND_API_KEY || '',
      customSender: parsed.customSender || 'M-TRAVEL Concierge <onboarding@resend.dev>',
    };
  } catch {
    return {
      resendApiKey: (import.meta as any).env?.VITE_RESEND_API_KEY || '',
      customSender: 'M-TRAVEL Concierge <onboarding@resend.dev>',
    };
  }
}

export function saveOutboundGatewayConfig(config: OutboundGatewayConfig): void {
  try {
    localStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('mt_gateway_config_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save gateway config:', err);
  }
}

/**
 * Creates a 1-click Google Mail Web compose link pre-populated with recipient, subject, and body.
 */
export function createGmailComposeUrl(to: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Opens Google Mail directly in a new tab with pre-filled accreditation letter.
 */
export function openInGmail(to: string, subject: string, body: string): void {
  const url = createGmailComposeUrl(to, subject, body);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Dispatches real outbound email via the server-side Vite middleware (/api/send-email) using Resend.
 */
export async function dispatchLiveEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; provider?: string; reason?: string; message?: string }> {
  try {
    const config = getOutboundGatewayConfig();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        apiKey: config.resendApiKey,
        from: config.customSender,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return { success: false, reason: 'HTTP_ERROR', message: `Server returned status ${res.status}` };
  } catch (err: any) {
    return { success: false, reason: 'NETWORK_ERROR', message: err?.message || 'Failed to connect to email gateway' };
  }
}

export function getDispatchedEmails(): DispatchedEmail[] {
  try {
    const raw = localStorage.getItem(EMAILS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getHostDispatchedEmails(params: {
  hostEmail?: string;
  hostName?: string;
  vehicleIds?: string[];
}): DispatchedEmail[] {
  const all = getDispatchedEmails();
  const cleanEmail = params.hostEmail?.trim().toLowerCase();
  const cleanName = params.hostName?.trim().toLowerCase();
  const vIds = new Set(params.vehicleIds || []);

  return all.filter((e) => {
    // 1. Direct email match
    if (cleanEmail && e.recipientEmail?.trim().toLowerCase() === cleanEmail) return true;
    // 2. Vehicle ID reference match
    if (e.reference && vIds.has(e.reference)) return true;
    // 3. Name match (e.g. Matthew)
    if (cleanName && e.recipientName?.trim().toLowerCase().includes(cleanName)) return true;
    if (cleanName && cleanName.includes('matthew') && e.recipientName?.toLowerCase().includes('matthew')) return true;
    return false;
  });
}

export function saveDispatchedEmail(email: DispatchedEmail): void {
  try {
    const current = getDispatchedEmails();
    const updated = [email, ...current.slice(0, 99)];
    localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mt_email_dispatched', { detail: email }));
  } catch (err) {
    console.error('Failed to save dispatched email:', err);
  }
}

/**
 * 1. FLEET HOST VEHICLE APPROVAL LUXURY EMAIL
 * Premium look, Obsidian & Gold theme, official M-TRAVEL seal.
 */
export async function sendHostVehicleApprovedEmail(params: {
  hostEmail: string;
  hostName: string;
  vehicle: StoredVehicle;
}): Promise<DispatchedEmail> {
  const { hostEmail, hostName, vehicle } = params;
  const subject = `✨ Your ${vehicle.make} ${vehicle.model} is Approved & Live on M-TRAVEL Fleet`;
  const previewText = `Congratulations ${hostName}! Your ${vehicle.make} ${vehicle.model} has passed inspection and is now live for guest bookings.`;

  const vehicleImage = vehicle.images?.[0] || '/vehicles/prado-front.jpg';
  const dailyRate = Number(vehicle.pricePerDay || 15000);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0A0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
    .container { max-width: 620px; margin: 30px auto; background-color: #111726; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .header { background: linear-gradient(135deg, #161F36 0%, #0A0D14 100%); padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.2); }
    .gold-pill { display: inline-block; background: rgba(212,175,55,0.15); border: 1px solid #D4AF37; color: #F6E05E; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 6px 16px; border-radius: 30px; margin-bottom: 16px; }
    .h1 { font-family: Georgia, serif; font-size: 26px; color: #FFFFFF; margin: 0 0 10px; font-weight: bold; }
    .subtitle { font-size: 14px; color: #94A3B8; margin: 0; line-height: 1.5; }
    .content { padding: 32px; }
    .vehicle-card { background: #1A2238; border-radius: 16px; border: 1px solid #2A3655; overflow: hidden; margin-bottom: 24px; }
    .vehicle-img { width: 100%; height: 220px; object-fit: cover; display: block; }
    .vehicle-details { padding: 20px; }
    .vehicle-title { font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0 0 6px; }
    .vehicle-plate { font-family: monospace; font-size: 12px; color: #D4AF37; font-weight: bold; background: rgba(212,175,55,0.1); padding: 3px 8px; border-radius: 6px; }
    .notice-box { background: rgba(16,185,129,0.08); border-left: 4px solid #10B981; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px; }
    .notice-title { font-size: 13px; font-weight: bold; color: #34D399; margin: 0 0 4px; }
    .notice-text { font-size: 12px; color: #CBD5E1; margin: 0; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8972E 100%); color: #0A0D14; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; text-align: center; box-shadow: 0 10px 20px -5px rgba(212,175,55,0.4); }
    .footer { background: #0A0D14; padding: 24px 32px; text-align: center; border-top: 1px solid #1A2238; font-size: 11px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gold-pill">M-TRAVEL PARTNER NETWORK</div>
      <h1 class="h1">Vehicle Approved &amp; Live for Hire</h1>
      <p class="subtitle">Official accreditation notice for M-TRAVEL Fleet Host <strong>${hostName}</strong></p>
    </div>

    <div class="content">
      <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin-top: 0;">
        Dear <strong>${hostName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1;">
        We are delighted to confirm that your registered vehicle has successfully met all M-TRAVEL luxury, mechanical, and safety standards. It is now officially published and active for guest hire across our platform.
      </p>

      <div class="vehicle-card">
        <img src="${vehicleImage}" alt="${vehicle.make} ${vehicle.model}" class="vehicle-img" />
        <div class="vehicle-details">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="vehicle-title">${vehicle.make} ${vehicle.model} (${vehicle.year || 2024})</div>
            <span class="vehicle-plate">LIVE &amp; APPROVED</span>
          </div>
          <p style="font-size: 12px; color: #94A3B8; margin: 4px 0 0;">Category: ${vehicle.type || '4x4 Luxury Cruiser'} · Transmission: ${vehicle.transmission || 'Automatic'} · Seats: ${vehicle.seats || 7}</p>

          <div style="margin-top: 16px; border-top: 1px solid #2A3655; padding-top: 14px;">
            <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Daily Rental Base Rate</div>
            <div style="font-size: 18px; font-weight: bold; color: #F6E05E; margin-top: 2px;">KES ${dailyRate.toLocaleString()} <span style="font-size: 11px; color: #94A3B8;">/ day</span></div>
          </div>
        </div>
      </div>

      <div class="notice-box">
        <div class="notice-title">✓ Fleet Host Standards &amp; Next Steps</div>
        <p class="notice-text">
          • Keep the vehicle detailed, fueled, and road-ready for verified guest bookings.<br>
          • M-TRAVEL covers telemetry tracking and handles guest M-Pesa payments upfront.<br>
          • You can track booking notifications and review payout schedules directly in your Host Portal.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="https://m-travel.co.ke/dashboard/owner?tab=fleet" class="btn">Access Fleet Host Portal</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">M-TRAVEL East Africa Ltd. · Westlands Square, Nairobi, Kenya</p>
      <p style="margin: 0;">24/7 Concierge Hotline: +254 722 374 535 · Partner Desk: host@mtravel.co.ke</p>
    </div>
  </div>
</body>
</html>
  `;

  const plainTextMessage = `
M-TRAVEL LUXURY PARTNER NETWORK
VEHICLE APPROVAL & LIVE ACCREDITATION NOTICE

Dear ${hostName},

We are delighted to confirm that your registered vehicle has successfully passed all M-TRAVEL safety and mechanical inspections. It is now officially approved and live for guest bookings across our luxury fleet network!

VEHICLE DETAILS:
• Make & Model: ${vehicle.make} ${vehicle.model} (${vehicle.year || 2024})
• Category: ${vehicle.type || 'Luxury Cruiser'}
• Transmission: ${vehicle.transmission || 'Automatic'} | Seats: ${vehicle.seats || 7}
• Daily Base Rate: KES ${dailyRate.toLocaleString()} / day
• Status: APPROVED & LIVE ON MARKETPLACE

FLEET HOST STANDARDS & NEXT STEPS:
• Ensure the vehicle remains fueled, clean, and roadworthy for upcoming traveler journeys.
• M-TRAVEL provides automated telemetry tracking and handles traveler M-Pesa payments upfront.
• Monitor reservations and request earnings payouts directly in your Fleet Host Portal:
  https://m-travel.co.ke/dashboard/owner?tab=fleet

For host assistance, reach our 24/7 Partner Concierge:
Hotline: +254 722 374 535 | Email: host@mtravel.co.ke

M-TRAVEL East Africa Ltd. · Westlands Square, Nairobi, Kenya
`.trim();

  // Attempt live outbound dispatch via gateway (Resend API) to real Gmail inbox
  const dispatchResult = await dispatchLiveEmail({
    to: hostEmail,
    subject,
    html: htmlContent,
    text: plainTextMessage,
  }).catch((err: any) => ({
    success: false,
    reason: 'DISPATCH_EXCEPTION',
    message: err?.message || 'Network exception',
    provider: undefined as string | undefined,
    id: undefined as string | undefined,
  }));

  const directGmailUrl = createGmailComposeUrl(hostEmail, subject, plainTextMessage);

  const emailRecord: DispatchedEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: hostEmail,
    recipientName: hostName,
    subject,
    previewText,
    htmlContent,
    category: 'VEHICLE_APPROVED',
    reference: vehicle.id,
    sentAt: new Date().toISOString(),
    deliveryStatus: dispatchResult.success ? 'DELIVERED_RESEND' : 'GMAIL_READY',
    deliveryProvider: dispatchResult.provider || (dispatchResult.success ? 'Resend API' : 'Gmail Direct Bridge'),
    deliveryId: dispatchResult.id,
    directGmailUrl,
  };

  saveDispatchedEmail(emailRecord);

  // Sync to remote supabase table if available
  try {
    await supabase.from('email_logs').insert({
      recipient_email: hostEmail,
      subject,
      category: 'VEHICLE_APPROVED',
      status: dispatchResult.success ? 'SENT_RESEND' : 'DISPATCHED_PENDING_GATEWAY',
      created_at: new Date().toISOString(),
    });
  } catch { /* Table offline fallback */ }

  return emailRecord;
}

/**
 * Ensures an approval email exists for an approved vehicle; if not found, dispatches it.
 */
export async function ensureHostVehicleApprovedEmail(params: {
  hostEmail: string;
  hostName: string;
  vehicle: StoredVehicle;
}): Promise<DispatchedEmail> {
  const existing = getDispatchedEmails().find(
    (e) => e.reference === params.vehicle.id && e.category === 'VEHICLE_APPROVED'
  );
  if (existing) return existing;
  return sendHostVehicleApprovedEmail(params);
}

/**
 * 2. TRAVELER BOOKING CONFIRMATION LUXURY EMAIL
 * Custom tailored for either DESTINATION/HOLIDAY STAYS or VEHICLE RIDE HIRE.
 */
export async function sendTravelerBookingEmail(params: {
  booking: StoredBooking;
  isDestination: boolean;
}): Promise<DispatchedEmail> {
  const { booking, isDestination } = params;
  const travelerName = booking.touristName || 'Valued Guest';
  const travelerEmail = booking.touristEmail || 'traveler@mtravel.co.ke';
  const ref = booking.bookingRef;
  const amountFormatted = `KES ${Number(booking.totalAmount).toLocaleString()}`;
  const startDate = booking.startDate.split('T')[0];
  const endDate = booking.endDate.split('T')[0];

  const subject = isDestination
    ? `🌴 Booking Placed & Confirmed: ${booking.vehicleName} (Ref: ${ref})`
    : `🚗 Luxury Car Hire Confirmed: ${booking.vehicleName} (Ref: ${ref})`;

  const previewText = isDestination
    ? `Dear ${travelerName}, your reservation for ${booking.vehicleName} is placed and confirmed. Our concierge is facilitating all arrangements.`
    : `Dear ${travelerName}, your vehicle hire for ${booking.vehicleName} is confirmed and ready for pickup at our station hub.`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0A0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
    .container { max-width: 620px; margin: 30px auto; background-color: #111726; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .header { background: linear-gradient(135deg, ${isDestination ? '#1C122C 0%, #0A0D14 100%' : '#161F36 0%, #0A0D14 100%'}); padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.2); }
    .gold-pill { display: inline-block; background: rgba(212,175,55,0.15); border: 1px solid #D4AF37; color: #F6E05E; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 6px 16px; border-radius: 30px; margin-bottom: 16px; }
    .h1 { font-family: Georgia, serif; font-size: 24px; color: #FFFFFF; margin: 0 0 10px; font-weight: bold; }
    .ref-badge { font-family: monospace; font-size: 13px; color: #38BDF8; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 4px 12px; border-radius: 8px; display: inline-block; margin-top: 6px; }
    .content { padding: 32px; }
    .card { background: #1A2238; border-radius: 16px; border: 1px solid #2A3655; overflow: hidden; margin-bottom: 24px; }
    .card-img { width: 100%; height: 210px; object-fit: cover; display: block; }
    .card-body { padding: 20px; }
    .card-title { font-size: 19px; font-weight: bold; color: #FFFFFF; margin: 0 0 6px; }
    .info-grid { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .info-grid td { padding: 8px 0; border-top: 1px solid #2A3655; font-size: 13px; }
    .label-col { color: #94A3B8; width: 40%; }
    .val-col { color: #F1F5F9; font-weight: 600; text-align: right; }
    .val-highlight { color: #10B981; font-weight: bold; }
    .val-gold { color: #F6E05E; font-weight: bold; }
    .notice { background: rgba(212,175,55,0.08); border-left: 4px solid #D4AF37; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px; }
    .notice-title { font-size: 13px; font-weight: bold; color: #F6E05E; margin: 0 0 4px; }
    .notice-text { font-size: 12px; color: #CBD5E1; margin: 0; line-height: 1.6; }
    .btn-row { text-align: center; margin: 32px 0 16px; }
    .btn-gold { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8972E 100%); color: #0A0D14; font-weight: bold; font-size: 13px; text-decoration: none; padding: 13px 28px; border-radius: 12px; margin: 0 6px 10px; }
    .btn-whatsapp { display: inline-block; background: #25D366; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 13px 28px; border-radius: 12px; margin: 0 6px 10px; }
    .footer { background: #0A0D14; padding: 24px 32px; text-align: center; border-top: 1px solid #1A2238; font-size: 11px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gold-pill">${isDestination ? 'HOLIDAY & SAFARI DESTINATION' : 'LUXURY MOBILITY & FLEET'}</div>
      <h1 class="h1">${isDestination ? 'Destination Booking Placed & Confirmed' : 'Vehicle Hire Booking Confirmed'}</h1>
      <div class="ref-badge">Reservation Reference: ${ref}</div>
    </div>

    <div class="content">
      <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin-top: 0;">
        Dear <strong>${travelerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1;">
        ${isDestination
          ? 'Thank you for choosing M-TRAVEL East Africa for your upcoming holiday. Your destination booking has been officially recorded and confirmed. Our dedicated travel company operations desk is currently facilitating all necessary ground arrangements, lodge coordination, and itinerary details.'
          : 'Thank you for choosing M-TRAVEL East Africa. Your luxury vehicle hire reservation is confirmed. Your vehicle is scheduled, inspected, and verified for handover.'}
      </p>

      <div class="card">
        ${booking.vehicleImage ? `<img src="${booking.vehicleImage}" alt="${booking.vehicleName}" class="card-img" />` : ''}
        <div class="card-body">
          <div class="card-title">${booking.vehicleName}</div>
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">${isDestination ? 'Curated Kenyan Destination Experience' : 'Premium Vehicle Hire'}</p>

          <table class="info-grid">
            <tr>
              <td class="label-col">${isDestination ? 'Destination / Lodge' : 'Vehicle Model'}</td>
              <td class="val-col">${booking.vehicleName}</td>
            </tr>
            <tr>
              <td class="label-col">Reservation Period</td>
              <td class="val-col">${startDate} ➔ ${endDate}</td>
            </tr>
            <tr>
              <td class="label-col">${isDestination ? 'Location / Region' : 'Pickup Station Hub'}</td>
              <td class="val-col">${booking.pickupLocation || 'Station Hub, Nairobi'}</td>
            </tr>
            ${!isDestination ? `
            <tr>
              <td class="label-col">Service Preference</td>
              <td class="val-col">${booking.hasDriver ? 'With Certified Station Chauffeur' : 'Self-Drive (Client Collection)'}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label-col">Total Amount Paid</td>
              <td class="val-col val-gold">${amountFormatted}</td>
            </tr>
            <tr>
              <td class="label-col">M-Pesa Verification Code</td>
              <td class="val-col val-highlight">${booking.mpesaReceipt || 'M-PESA-VERIFIED'}</td>
            </tr>
            <tr>
              <td class="label-col">Booking Status</td>
              <td class="val-col" style="color: #10B981;">✓ CONFIRMED</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="notice">
        <div class="notice-title">🛎️ Concierge Facilitation Notice</div>
        <p class="notice-text">
          ${isDestination
            ? 'Our travel concierge team has received your destination reservation and is coordinating your accommodations, lodge vouchers, and local logistics. For special dietary needs, private safari guide requests, or arrival transfers, click below to chat directly on WhatsApp.'
            : 'Please bring your valid driving license (for self-drive) or meet your assigned chauffeur at the pickup hub. Comprehensive insurance is fully included.'}
        </p>
      </div>

      <div class="btn-row">
        <a href="https://wa.me/254791888840?text=${encodeURIComponent(`Hello M-TRAVEL Concierge! I have a confirmed booking (Ref: ${ref}) for ${booking.vehicleName}. I would like to confirm my arrival & itinerary details.`)}" class="btn-whatsapp" target="_blank">Chat with Concierge on WhatsApp</a>
        <a href="https://m-travel.co.ke/dashboard/bookings" class="btn-gold">View in My Bookings</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">M-TRAVEL East Africa Ltd. · Signature Travel &amp; Mobility Network</p>
      <p style="margin: 0;">24/7 Concierge Hotline: +254 722 374 535 · WhatsApp Desk: +254 791 888 840</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailRecord: DispatchedEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: travelerEmail,
    recipientName: travelerName,
    subject,
    previewText,
    htmlContent,
    category: isDestination ? 'DESTINATION_BOOKING' : 'VEHICLE_BOOKING',
    reference: ref,
    sentAt: new Date().toISOString(),
  };

  saveDispatchedEmail(emailRecord);

  // Background log in Supabase
  try {
    await supabase.from('email_logs').insert({
      recipient_email: travelerEmail,
      subject,
      category: isDestination ? 'DESTINATION_BOOKING' : 'VEHICLE_BOOKING',
      status: 'SENT',
      created_at: new Date().toISOString(),
    });
  } catch {}

  return emailRecord;
}

/**
 * 3. WHATSAPP MESSAGE GENERATOR
 * Generates direct wa.me link with pre-composed, elegant message.
 */
export function getWhatsAppConciergeUrl(params: {
  booking: StoredBooking;
  isDestination: boolean;
}): string {
  const { booking, isDestination } = params;
  const ref = booking.bookingRef;
  const name = booking.touristName || 'Traveler';
  const place = booking.vehicleName;
  const dates = `${booking.startDate.split('T')[0]} to ${booking.endDate.split('T')[0]}`;
  const amount = `KES ${Number(booking.totalAmount).toLocaleString()}`;
  const receipt = booking.mpesaReceipt || 'M-Pesa Verified';

  let message = '';
  if (isDestination) {
    message = `🌴 *M-TRAVEL EAST AFRICA — DESTINATION BOOKING CONFIRMATION* 🌴\n\n` +
      `Hello M-TRAVEL Concierge,\n` +
      `My name is *${name}* and I have completed my booking payment for:\n\n` +
      `🏨 *Destination / Lodge:* ${place}\n` +
      `🏷️ *Booking Reference:* ${ref}\n` +
      `📅 *Dates:* ${dates}\n` +
      `💰 *Total Paid:* ${amount} (Receipt: ${receipt})\n` +
      `📍 *Location:* ${booking.pickupLocation || 'Kenya'}\n\n` +
      `Kindly assist in facilitating my stay arrangements, voucher confirmation, and arrival itinerary. Thank you!`;
  } else {
    message = `🚗 *M-TRAVEL LUXURY FLEET — VEHICLE HIRE CONFIRMATION* 🚗\n\n` +
      `Hello M-TRAVEL Concierge,\n` +
      `My name is *${name}* and I have confirmed my vehicle hire:\n\n` +
      `🚘 *Vehicle:* ${place}\n` +
      `🏷️ *Booking Ref:* ${ref}\n` +
      `📅 *Hire Period:* ${dates}\n` +
      `🕹️ *Mode:* ${booking.hasDriver ? 'With Certified Station Chauffeur' : 'Self-Drive'}\n` +
      `💰 *Paid:* ${amount} (M-Pesa: ${receipt})\n\n` +
      `Looking forward to receiving vehicle handover details. Thank you!`;
  }

  return `https://wa.me/254791888840?text=${encodeURIComponent(message)}`;
}

/**
 * Helper to open WhatsApp Concierge chat directly in browser or app
 */
export function openWhatsAppConcierge(params: {
  booking: StoredBooking;
  isDestination: boolean;
}): void {
  const url = getWhatsAppConciergeUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 4. FLEET HOST VEHICLE APPROVAL WHATSAPP ACCREDITATION
 * Generates instant wa.me link directly to host's WhatsApp number.
 */
export function getHostApprovalWhatsAppUrl(params: {
  hostName: string;
  hostPhone?: string;
  vehicle: StoredVehicle;
}): string {
  const { hostName, hostPhone, vehicle } = params;
  const rawDigits = (hostPhone || '0712345678').replace(/[^0-9]/g, '');
  const intlPhone = rawDigits.startsWith('254')
    ? rawDigits
    : rawDigits.startsWith('0')
    ? `254${rawDigits.slice(1)}`
    : `254${rawDigits}`;

  const message =
    `✨ *M-TRAVEL LUXURY PARTNER NETWORK* ✨\n` +
    `*OFFICIAL VEHICLE APPROVAL & LIVE ACCREDITATION*\n\n` +
    `Dear *${hostName}*,\n\n` +
    `Congratulations! Your *${vehicle.make} ${vehicle.model} (${vehicle.year || 2024})* has successfully passed all M-TRAVEL luxury, mechanical & safety inspections.\n\n` +
    `Your vehicle is officially *APPROVED & PUBLISHED LIVE* for guest bookings across Kenya!\n\n` +
    `📋 *Vehicle Details:*\n` +
    `• *Model:* ${vehicle.make} ${vehicle.model}\n` +
    `• *Category:* ${vehicle.type || '4x4 Luxury Cruiser'}\n` +
    `• *Transmission:* ${vehicle.transmission || 'Automatic'} · Seats: ${vehicle.seats || 7}\n` +
    `• *Rental Base Rate:* KES ${Number(vehicle.pricePerDay || 15000).toLocaleString()} / day\n` +
    `• *Marketplace Status:* LIVE & READY FOR BOOKINGS\n\n` +
    `🔑 *Next Steps for Host:*\n` +
    `• Keep the vehicle clean, fueled, and roadworthy for upcoming reservations.\n` +
    `• All traveler payments and M-Pesa receipts are secured upfront by M-TRAVEL.\n` +
    `• Access your Fleet Host Dashboard to view live bookings and payouts:\n` +
    `  https://m-travel.co.ke/dashboard/owner?tab=fleet\n\n` +
    `M-TRAVEL East Africa Ltd. · Partner Desk: host@mtravel.co.ke · 24/7 Concierge: +254 722 374 535`;

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export function openHostApprovalWhatsApp(params: {
  hostName: string;
  hostPhone?: string;
  vehicle: StoredVehicle;
}): void {
  const url = getHostApprovalWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 5. TRAVELER BOOKING CONFIRMATION & VOUCHER WHATSAPP MESSAGE
 * Generates instant wa.me link with luxury itinerary & payment confirmation.
 */
export function getTravelerBookingWhatsAppUrl(params: {
  booking: StoredBooking;
  isDestination: boolean;
  targetPhone?: string;
}): string {
  const { booking, isDestination, targetPhone } = params;
  const ref = booking.bookingRef;
  const name = booking.touristName || 'Traveler';
  const place = booking.vehicleName;
  const dates = `${booking.startDate.split('T')[0]} to ${booking.endDate.split('T')[0]}`;
  const amount = `KES ${Number(booking.totalAmount).toLocaleString()}`;
  const receipt = booking.mpesaReceipt || 'M-Pesa Confirmed';
  const phone = targetPhone || booking.touristPhone;

  let intlPhone = '254791888840'; // M-TRAVEL Concierge Hotline Desk
  if (phone) {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    if (rawDigits.length >= 9) {
      intlPhone = rawDigits.startsWith('254')
        ? rawDigits
        : rawDigits.startsWith('0')
        ? `254${rawDigits.slice(1)}`
        : `254${rawDigits}`;
    }
  }

  let message = '';
  if (isDestination) {
    message =
      `🌴 *M-TRAVEL EAST AFRICA — DESTINATION BOOKING CONFIRMATION* 🌴\n` +
      `*OFFICIAL TRAVEL VOUCHER & RESERVATION RECEIPT*\n\n` +
      `Dear *${name}*,\n\n` +
      `Thank you for choosing M-TRAVEL! Your luxury holiday destination reservation is *CONFIRMED & FACILITATED*.\n\n` +
      `📋 *Reservation Summary:*\n` +
      `• *Destination / Package:* ${place}\n` +
      `• *Category:* ${booking.destinationCategory === 'TOUR' ? 'Guided Safari Tour' : 'Holiday Sanctuary & Villa'}\n` +
      `• *Booking Reference:* ${ref}\n` +
      `• *Dates:* ${dates}\n` +
      `• *Location:* ${booking.destinationLocation || booking.pickupLocation || 'Kenya'}\n` +
      `• *Total Paid:* ${amount}\n` +
      `• *M-Pesa Receipt Code:* ${receipt}\n` +
      `• *Status:* ✓ CONFIRMED & SECURED\n\n` +
      `🛎️ *Concierge & Ground Facilitation:*\n` +
      `Our travel operations team has coordinated your lodge check-in, park entry vouchers, and local ground logistics. Keep this voucher handy upon arrival.\n\n` +
      `📱 View complete itinerary in your dashboard:\n` +
      `https://m-travel.co.ke/dashboard/bookings\n\n` +
      `Need custom safari requests or transfer updates? Reply to this message!\n` +
      `24/7 Operations Desk: +254 722 374 535 · M-TRAVEL East Africa Ltd.`;
  } else {
    message =
      `🚗 *M-TRAVEL LUXURY MOBILITY — VEHICLE HIRE CONFIRMATION* 🚗\n` +
      `*OFFICIAL RENTAL VOUCHER & HANDOVER PASS*\n\n` +
      `Dear *${name}*,\n\n` +
      `Your luxury vehicle booking has been *CONFIRMED & PREPARED* for your upcoming journey!\n\n` +
      `📋 *Hire Details:*\n` +
      `• *Vehicle:* ${place}\n` +
      `• *Booking Reference:* ${ref}\n` +
      `• *Rental Period:* ${dates}\n` +
      `• *Service Mode:* ${booking.hasDriver ? 'Chauffeur Driven (Station Chauffeur Included)' : 'Self-Drive'}\n` +
      `• *Pickup Point:* ${booking.pickupLocation || 'M-TRAVEL Station Hub, Nairobi'}\n` +
      `• *Total Paid:* ${amount}\n` +
      `• *M-Pesa Receipt:* ${receipt}\n` +
      `• *Insurance:* Comprehensive Cover Included\n\n` +
      `🔑 *Handover Instructions:*\n` +
      `Present your National ID or Passport and driving license (for self-drive) at vehicle handover.\n\n` +
      `📱 Access rental details, security check-in & receipt:\n` +
      `https://m-travel.co.ke/dashboard/my-bookings\n\n` +
      `24/7 Roadside Concierge: +254 722 374 535 · M-TRAVEL East Africa Ltd.`;
  }

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export function openTravelerBookingWhatsApp(params: {
  booking: StoredBooking;
  isDestination: boolean;
  targetPhone?: string;
}): void {
  const url = getTravelerBookingWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 6. FLEET HOST VEHICLE REJECTION WHATSAPP NOTIFICATION
 * Generates direct wa.me link with polite, constructive inspection feedback.
 */
export function getHostRejectionWhatsAppUrl(params: {
  hostName: string;
  hostPhone?: string;
  vehicle: StoredVehicle;
  reasons: string[];
  customFeedback?: string;
}): string {
  const { hostName, hostPhone, vehicle, reasons, customFeedback } = params;
  const rawDigits = (hostPhone || '0712345678').replace(/[^0-9]/g, '');
  const intlPhone = rawDigits.startsWith('254')
    ? rawDigits
    : rawDigits.startsWith('0')
    ? `254${rawDigits.slice(1)}`
    : `254${rawDigits}`;

  const reasonList = reasons && reasons.length > 0
    ? reasons.map((r) => `• ⚠️ *${r}*`).join('\n')
    : '• ⚠️ Quality or safety standards revision required';

  const notesSection = customFeedback && customFeedback.trim().length > 0
    ? `\n\n📝 *Quality Inspector Notes:*\n${customFeedback.trim()}`
    : '';

  const message =
    `🛡️ *M-TRAVEL LUXURY FLEET — VEHICLE REGISTRATION REVIEW* 🛡️\n` +
    `*OFFICIAL INSPECTION & ONBOARDING FEEDBACK*\n\n` +
    `Dear *${hostName}*,\n\n` +
    `Thank you for registering your *${vehicle.make} ${vehicle.model} (${vehicle.year || 2024})* on M-TRAVEL.\n\n` +
    `Our Quality Assurance and Fleet Operations team has conducted the preliminary inspection. At this time, the vehicle *COULD NOT BE APPROVED* for live marketplace booking due to the following item(s):\n\n` +
    `📋 *Required Adjustments:*\n` +
    `${reasonList}${notesSection}\n\n` +
    `🔧 *How to Re-Submit:*\n` +
    `1. Retake clear, high-resolution front & rear photos showing the full vehicle body and visible registration plate.\n` +
    `2. Verify that mechanical roadworthiness and commercial insurance documentation are up to date.\n` +
    `3. Log in to your Fleet Host Dashboard to update and re-submit:\n` +
    `   https://m-travel.co.ke/dashboard/owner?tab=add\n\n` +
    `We value your partnership and look forward to welcoming your vehicle once these details are updated.\n\n` +
    `M-TRAVEL Fleet Quality Assurance · Partner Desk: host@mtravel.co.ke · Hotline: +254 722 374 535`;

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export function openHostRejectionWhatsApp(params: {
  hostName: string;
  hostPhone?: string;
  vehicle: StoredVehicle;
  reasons: string[];
  customFeedback?: string;
}): void {
  const url = getHostRejectionWhatsAppUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

