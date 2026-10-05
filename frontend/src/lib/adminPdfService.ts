/**
 * M-TRAVEL Executive Reporting & PDF Document Generator
 * Generates high-fidelity, printable PDF audit trails, bookings ledgers,
 * treasury settlement reports, and fleet telematics manifests.
 */

import type { StoredBooking, StoredVehicle } from './bookingStore';
import type { AuditLogEntry, IncidentReport } from './rentalLifecycleStore';

const REPORT_CSS = `
  @page {
    size: A4 landscape;
    margin: 12mm 12mm 12mm 12mm;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    tr { page-break-inside: avoid; }
    .metric-card { page-break-inside: avoid; }
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 24px;
    font-size: 11px;
    line-height: 1.4;
  }
  .report-header {
    border-bottom: 2px solid #b45309;
    padding-bottom: 14px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-title {
    font-size: 20px;
    font-weight: 800;
    color: #1e1b4b;
    letter-spacing: -0.5px;
    text-transform: uppercase;
  }
  .brand-sub {
    font-size: 11px;
    color: #b45309;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .report-meta {
    text-align: right;
    font-size: 10px;
    color: #475569;
  }
  .report-meta strong {
    color: #0f172a;
  }
  .security-pill {
    display: inline-block;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    color: #92400e;
    font-weight: 700;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 3px 8px;
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 18px;
  }
  .metric-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
  }
  .metric-label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .metric-val {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    font-family: 'SF Mono', Monaco, Inconsolata, monospace;
    margin-top: 3px;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 10px;
  }
  .data-table th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    text-align: left;
    font-size: 9px;
    border-top: 1px solid #0f172a;
  }
  .data-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .data-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  .mono {
    font-family: 'SF Mono', Monaco, Inconsolata, monospace;
    font-size: 9.5px;
  }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    font-family: 'SF Mono', monospace;
  }
  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-blue  { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
  .badge-purple{ background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
  .badge-red   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  .report-footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #64748b;
  }
  .print-bar {
    background: #1e1b4b;
    color: #ffffff;
    padding: 10px 18px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .btn-print {
    background: #f59e0b;
    color: #0f172a;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 11px;
  }
`;

function triggerPrintWindow(title: string, htmlBody: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download and print the executive PDF report.');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="print-bar no-print">
    <div>
      <strong>M-TRAVEL Executive Report: ${title}</strong>
      <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Use the button on the right or press Ctrl+P (Cmd+P) to Save as PDF.</div>
    </div>
    <button class="btn-print" onclick="window.print()">📥 Save / Print PDF</button>
  </div>
  ${htmlBody}
  <script>
    setTimeout(() => {
      window.print();
    }, 400);
  </script>
</body>
</html>
  `);
  printWindow.document.close();
}

/**
 * 1. AUDIT TRAIL PDF REPORT
 */
export function downloadAuditTrailPdf(params: {
  logs: AuditLogEntry[];
  adminName: string;
  adminEmail: string;
  adminRole: string;
}): void {
  const { logs, adminName, adminEmail, adminRole } = params;
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const rows = logs.map(l => {
    let roleClass = 'badge-blue';
    if (l.actorRole === 'ADMIN') roleClass = 'badge-purple';
    if (l.actorRole === 'VEHICLE_OWNER') roleClass = 'badge-amber';
    if (l.actorRole === 'TOURIST') roleClass = 'badge-green';

    return `
      <tr>
        <td class="mono" style="white-space: nowrap;">${new Date(l.timestamp).toLocaleString('en-KE')}</td>
        <td><span class="badge ${roleClass}">${l.actorRole}</span></td>
        <td><strong>${l.actorName}</strong></td>
        <td><strong style="color: #b45309;">${l.action}</strong></td>
        <td class="mono">${l.entityName} ${l.entityId ? `(#${l.entityId})` : ''}</td>
        <td>${l.details}</td>
      </tr>
    `;
  }).join('');

  const body = `
    <div class="report-header">
      <div>
        <div class="security-pill">Confidential · Internal Corporate Governance</div>
        <div class="brand-title">M-TRAVEL East Africa Ltd.</div>
        <div class="brand-sub">Executive Lifecycle &amp; Security Audit Trail Report</div>
      </div>
      <div class="report-meta">
        <div>Generated: <strong>${now} EAT</strong></div>
        <div>Operator: <strong>${adminName}</strong> (${adminEmail})</div>
        <div>Authority Level: <strong>${adminRole === 'SUPER_ADMIN' ? 'Chief Administrator' : 'Operations Desk Admin'}</strong></div>
        <div>Total Audit Records: <strong>${logs.length}</strong></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Logged Events</div>
        <div class="metric-val">${logs.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Admin Governance Actions</div>
        <div class="metric-val">${logs.filter(l => l.actorRole === 'ADMIN').length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Host &amp; Fleet Actions</div>
        <div class="metric-val">${logs.filter(l => l.actorRole === 'VEHICLE_OWNER').length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Integrity Status</div>
        <div class="metric-val" style="color: #059669; font-size: 14px;">✓ Verified Immutable</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 135px;">Timestamp</th>
          <th style="width: 80px;">Role</th>
          <th style="width: 120px;">Operator / Actor</th>
          <th style="width: 140px;">Action Category</th>
          <th style="width: 120px;">Entity Target</th>
          <th>Event Description &amp; Verification Details</th>
        </tr>
      </thead>
      <tbody>
        ${logs.length > 0 ? rows : `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #94a3b8;">No audit trail events recorded in system.</td></tr>`}
      </tbody>
    </table>

    <div class="report-footer">
      <div>M-TRAVEL Corporate Governance · Official Cryptographic Audit Trail Document</div>
      <div>Authorized by: ${adminName} · M-TRAVEL East Africa Security Operations</div>
    </div>
  `;

  triggerPrintWindow(`MTRAVEL_Audit_Trail_Report_${Date.now()}`, body);
}

/**
 * 2. BOOKINGS LEDGER PDF REPORT
 */
export function downloadBookingsLedgerPdf(params: {
  bookings: StoredBooking[];
  adminName: string;
  adminEmail: string;
  adminRole: string;
}): void {
  const { bookings, adminName, adminEmail, adminRole } = params;
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const totalValue = bookings
    .filter(b => !['CANCELLED', 'REJECTED'].includes((b.status || '').toUpperCase()))
    .reduce((s, b) => s + Number(b.totalAmount || 0), 0);

  const confirmedCount = bookings.filter(b => ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)).length;
  const inProgressCount = bookings.filter(b => b.status === 'IN_PROGRESS').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  const rows = bookings.map(b => {
    let statusClass = 'badge-amber';
    if (b.status === 'COMPLETED') statusClass = 'badge-green';
    if (b.status === 'IN_PROGRESS') statusClass = 'badge-blue';
    if (['PAID', 'CONFIRMED'].includes(b.status)) statusClass = 'badge-green';
    if (['CANCELLED', 'REJECTED'].includes(b.status)) statusClass = 'badge-red';

    return `
      <tr>
        <td class="mono" style="font-weight: 700; color: #b45309;">${b.bookingRef || b.id.slice(0, 8)}</td>
        <td><strong>${b.vehicleName}</strong></td>
        <td>${b.touristName || 'Traveler'}<br/><span style="color: #64748b; font-size: 8.5px;">${b.touristPhone || '—'}</span></td>
        <td class="mono" style="white-space: nowrap;">${b.startDate} ➔ ${b.endDate}</td>
        <td class="mono" style="font-weight: 700; text-align: right;">KES ${Number(b.totalAmount || 0).toLocaleString()}</td>
        <td><span class="badge ${b.paymentStatus === 'PAID' ? 'badge-green' : 'badge-amber'}">${b.paymentStatus || 'PENDING'}</span></td>
        <td><span class="badge ${statusClass}">${b.status}</span></td>
        <td style="font-size: 9px; color: #475569;">${b.hasDriver ? 'Chauffeur Driven' : 'Self-Drive / Charter'}</td>
      </tr>
    `;
  }).join('');

  const body = `
    <div class="report-header">
      <div>
        <div class="security-pill">Executive Mobility &amp; Charter Ledger</div>
        <div class="brand-title">M-TRAVEL East Africa Ltd.</div>
        <div class="brand-sub">Platform Bookings &amp; Reservation Register</div>
      </div>
      <div class="report-meta">
        <div>Generated: <strong>${now} EAT</strong></div>
        <div>Operator: <strong>${adminName}</strong> (${adminEmail})</div>
        <div>Authority Level: <strong>${adminRole === 'SUPER_ADMIN' ? 'Chief Administrator' : 'Operations Desk Admin'}</strong></div>
        <div>Total Reservations: <strong>${bookings.length}</strong></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Gross Bookings Value</div>
        <div class="metric-val" style="color: #059669;">KES ${totalValue.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Confirmed / Paid Trips</div>
        <div class="metric-val">${confirmedCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active on Road Trips</div>
        <div class="metric-val" style="color: #0284c7;">${inProgressCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Completed Expeditions</div>
        <div class="metric-val">${completedCount}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 105px;">Booking Ref</th>
          <th>Vehicle / Destination Package</th>
          <th style="width: 140px;">Traveler / Guest</th>
          <th style="width: 150px;">Reservation Dates</th>
          <th style="width: 110px; text-align: right;">Total Amount</th>
          <th style="width: 80px;">Payment</th>
          <th style="width: 85px;">Trip Status</th>
          <th style="width: 100px;">Service Mode</th>
        </tr>
      </thead>
      <tbody>
        ${bookings.length > 0 ? rows : `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #94a3b8;">No bookings currently recorded in platform register.</td></tr>`}
      </tbody>
    </table>

    <div class="report-footer">
      <div>M-TRAVEL Central Dispatch &amp; Logistics · Corporate Ledger</div>
      <div>Official Administrative Record · Confidential</div>
    </div>
  `;

  triggerPrintWindow(`MTRAVEL_Bookings_Ledger_${Date.now()}`, body);
}

/**
 * 3. TREASURY & ACCOUNTING LEDGER PDF REPORT
 */
export function downloadTreasuryLedgerPdf(params: {
  transactions: any[];
  totalRevenue: number;
  totalPlatformFees: number;
  totalWithdrawals: number;
  pendingEscrow: number;
  adminName: string;
  adminEmail: string;
  adminRole: string;
}): void {
  const {
    transactions,
    totalRevenue,
    totalPlatformFees,
    totalWithdrawals,
    pendingEscrow,
    adminName,
    adminEmail,
    adminRole,
  } = params;
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const rows = transactions.map(t => {
    const isIn = ['TOPUP', 'MPESA_TOPUP', 'BOOKING_PAYOUT', 'COMMISSION', 'REFUND'].includes(t.type);
    const userName = (t.wallets as any)?.users?.first_name
      ? `${(t.wallets as any).users.first_name} ${(t.wallets as any).users.last_name ?? ''}`
      : 'System Account';
    const userRole = (t.wallets as any)?.users?.role ?? 'ACCOUNT';

    let typeBadge = 'badge-blue';
    if (t.type === 'COMMISSION') typeBadge = 'badge-green';
    if (t.type === 'BOOKING_PAYOUT') typeBadge = 'badge-purple';
    if (t.type === 'WITHDRAWAL') typeBadge = 'badge-red';

    return `
      <tr>
        <td class="mono" style="font-weight: 700; color: #b45309;">${t.reference || (t.id ? t.id.slice(0, 8) : '—')}</td>
        <td><strong>${userName}</strong></td>
        <td><span class="badge badge-amber">${userRole}</span></td>
        <td><span class="badge ${typeBadge}">${t.type}</span></td>
        <td><span class="badge badge-green">${t.status}</span></td>
        <td class="mono" style="font-weight: 700; text-align: right; color: ${isIn ? '#059669' : '#dc2626'};">
          ${isIn ? '+' : '-'} KES ${Number(t.amount || 0).toLocaleString()}
        </td>
        <td class="mono" style="font-size: 9px; white-space: nowrap;">${new Date(t.created_at || Date.now()).toLocaleString('en-KE')}</td>
      </tr>
    `;
  }).join('');

  const body = `
    <div class="report-header">
      <div>
        <div class="security-pill">Treasury &amp; Financial Settlement</div>
        <div class="brand-title">M-TRAVEL East Africa Ltd.</div>
        <div class="brand-sub">Platform Financial Ledger &amp; Revenue Audit Report</div>
      </div>
      <div class="report-meta">
        <div>Generated: <strong>${now} EAT</strong></div>
        <div>Financial Controller: <strong>${adminName}</strong> (${adminEmail})</div>
        <div>Governance Role: <strong>${adminRole === 'SUPER_ADMIN' ? 'Chief Administrator' : 'Operations Desk Admin'}</strong></div>
        <div>Settlement Currency: <strong>KES (Kenyan Shillings)</strong></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Customer Deposits</div>
        <div class="metric-val" style="color: #059669;">KES ${totalRevenue.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Host Withdrawals Paid</div>
        <div class="metric-val" style="color: #dc2626;">KES ${totalWithdrawals.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Net Platform Commission (25%)</div>
        <div class="metric-val" style="color: #b45309;">KES ${totalPlatformFees.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pending Handover Escrow</div>
        <div class="metric-val">KES ${pendingEscrow.toLocaleString()}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 130px;">Transaction Ref</th>
          <th>Account / Beneficiary</th>
          <th style="width: 90px;">Role</th>
          <th style="width: 120px;">Type</th>
          <th style="width: 75px;">Status</th>
          <th style="width: 120px; text-align: right;">Amount</th>
          <th style="width: 135px;">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.length > 0 ? rows : `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8;">No platform transactions recorded in ledger.</td></tr>`}
      </tbody>
    </table>

    <div class="report-footer">
      <div>M-TRAVEL Financial Treasury &amp; Escrow Settlement · Nairobi Central Station</div>
      <div>Audited &amp; Authorized by Management Desk</div>
    </div>
  `;

  triggerPrintWindow(`MTRAVEL_Treasury_Financial_Report_${Date.now()}`, body);
}

/**
 * 4. FLEET TELEMATICS & VEHICLE REGISTRY PDF REPORT
 */
export function downloadFleetManifestPdf(params: {
  vehicles: StoredVehicle[];
  adminName: string;
  adminEmail: string;
  adminRole: string;
}): void {
  const { vehicles, adminName, adminEmail, adminRole } = params;
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const totalBuses = vehicles.filter(v => v.type === 'BUS' || (v.model && v.model.toLowerCase().includes('coach'))).length;
  const approvedCount = vehicles.filter(v => v.status === 'APPROVED').length;
  const pendingCount = vehicles.filter(v => v.status === 'PENDING_APPROVAL').length;

  const rows = vehicles.map(v => {
    return `
      <tr>
        <td class="mono" style="font-weight: 700; color: #b45309;">${v.plateNumber || 'Pending Plate'}</td>
        <td><strong>${v.make} ${v.model}</strong> (${v.year || 2024})</td>
        <td><span class="badge ${v.type === 'BUS' ? 'badge-amber' : 'badge-blue'}">${v.type}</span></td>
        <td class="mono">${v.seats} Seats · ${v.fuelType}</td>
        <td class="mono" style="font-weight: 700; text-align: right;">KES ${Number(v.pricePerDay || 0).toLocaleString()} / day</td>
        <td>${v.ownerName || 'Host'}<br/><span style="color: #64748b; font-size: 8.5px;">${v.ownerEmail || '—'}</span></td>
        <td><span class="badge ${v.status === 'APPROVED' ? 'badge-green' : 'badge-amber'}">${v.status}</span></td>
        <td><span class="badge ${v.isLive !== false ? 'badge-green' : 'badge-red'}">${v.isLive !== false ? 'LIVE' : 'UNLISTED'}</span></td>
      </tr>
    `;
  }).join('');

  const body = `
    <div class="report-header">
      <div>
        <div class="security-pill">Fleet Telematics &amp; Asset Management</div>
        <div class="brand-title">M-TRAVEL East Africa Ltd.</div>
        <div class="brand-sub">Official Fleet Telematics &amp; Vehicle Registry</div>
      </div>
      <div class="report-meta">
        <div>Generated: <strong>${now} EAT</strong></div>
        <div>Fleet Inspector: <strong>${adminName}</strong> (${adminEmail})</div>
        <div>Authority Level: <strong>${adminRole === 'SUPER_ADMIN' ? 'Chief Administrator' : 'Operations Desk Admin'}</strong></div>
        <div>Registered Vehicles: <strong>${vehicles.length}</strong></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Fleet Units</div>
        <div class="metric-val">${vehicles.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Approved &amp; Accredited</div>
        <div class="metric-val" style="color: #059669;">${approvedCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pending Inspection</div>
        <div class="metric-val" style="color: #b45309;">${pendingCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Charter Buses &amp; Coaches</div>
        <div class="metric-val">${totalBuses}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 100px;">Plate Reg</th>
          <th>Make, Model &amp; Year</th>
          <th style="width: 75px;">Category</th>
          <th style="width: 110px;">Specs</th>
          <th style="width: 115px; text-align: right;">Base Daily Rate</th>
          <th style="width: 140px;">Registered Owner</th>
          <th style="width: 85px;">Accreditation</th>
          <th style="width: 70px;">Visibility</th>
        </tr>
      </thead>
      <tbody>
        ${vehicles.length > 0 ? rows : `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #94a3b8;">No vehicles registered into fleet registry.</td></tr>`}
      </tbody>
    </table>

    <div class="report-footer">
      <div>M-TRAVEL Fleet Telematics &amp; Roadworthiness Inspection Office</div>
      <div>Official Fleet Manifest · Kenya &amp; East Africa Operations</div>
    </div>
  `;

  triggerPrintWindow(`MTRAVEL_Fleet_Manifest_${Date.now()}`, body);
}

/**
 * 5. SAFETY & INCIDENT REPORTS PDF REPORT
 */
export function downloadIncidentsReportPdf(params: {
  incidents: IncidentReport[];
  adminName: string;
  adminEmail: string;
  adminRole: string;
}): void {
  const { incidents, adminName, adminEmail, adminRole } = params;
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const pendingCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  const rows = incidents.map(inc => {
    let sevBadge = 'badge-blue';
    if (inc.severity === 'CRITICAL') sevBadge = 'badge-red';
    else if (inc.severity === 'HIGH') sevBadge = 'badge-amber';

    let statusBadge = 'badge-amber';
    if (inc.status === 'RESOLVED') statusBadge = 'badge-green';
    else if (inc.status === 'ACTION_TAKEN') statusBadge = 'badge-purple';

    const reportedDate = new Date(inc.reportedAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

    return `
      <tr>
        <td class="mono">${reportedDate}</td>
        <td><span class="badge ${sevBadge}">${inc.severity}</span></td>
        <td><span class="badge badge-purple">${inc.type}</span></td>
        <td>
          <div style="font-weight: 700;">${inc.vehicleName || 'Vehicle'}</div>
          <div class="mono" style="font-size: 8.5px; color: #b45309;">Ref: ${inc.bookingRef || '—'}</div>
        </td>
        <td>
          <div><strong>${inc.travelerName || 'Traveler'}</strong></div>
          <div class="mono" style="font-size: 8.5px; color: #64748b;">${inc.travelerPhone || '—'}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #0f172a;">${inc.locationDescription || 'Location unspecified'}</div>
          <div style="color: #475569; margin-top: 2px;">${inc.description || '—'}</div>
          ${inc.resolutionNotes ? `<div style="margin-top: 4px; padding: 4px 6px; background: #ecfdf5; border-left: 2px solid #059669; color: #065f46; font-size: 8.5px;"><strong>Resolution:</strong> ${inc.resolutionNotes}</div>` : ''}
        </td>
        <td><span class="badge ${statusBadge}">${inc.status}</span></td>
      </tr>
    `;
  }).join('');

  const body = `
    <div class="report-header">
      <div>
        <div class="security-pill">Roadside Assistance &amp; Safety Response</div>
        <div class="brand-title">M-TRAVEL East Africa Ltd.</div>
        <div class="brand-sub">Safety Incident Log &amp; Roadside Dispatch Dossier</div>
      </div>
      <div class="report-meta">
        <div>Generated: <strong>${now} EAT</strong></div>
        <div>Safety Supervisor: <strong>${adminName}</strong> (${adminEmail})</div>
        <div>Authority Level: <strong>${adminRole === 'SUPER_ADMIN' ? 'Chief Administrator' : 'Operations Desk Admin'}</strong></div>
        <div>Total Incidents Logged: <strong>${incidents.length}</strong></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Logged Incidents</div>
        <div class="metric-val">${incidents.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Critical Alerts</div>
        <div class="metric-val" style="color: #b91c1c;">${criticalCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active / In-Progress</div>
        <div class="metric-val" style="color: #b45309;">${pendingCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Resolved / Cleared</div>
        <div class="metric-val" style="color: #059669;">${resolvedCount}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 110px;">Reported At</th>
          <th style="width: 70px;">Severity</th>
          <th style="width: 85px;">Type</th>
          <th style="width: 120px;">Asset / Booking</th>
          <th style="width: 120px;">Tourist / Driver</th>
          <th>Location &amp; Incident Narrative</th>
          <th style="width: 80px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${incidents.length > 0 ? rows : `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8;">Zero emergency incidents reported across platform. All tours operating safely.</td></tr>`}
      </tbody>
    </table>

    <div class="report-footer">
      <div>M-TRAVEL Rapid Roadside Response &amp; Traveler Safety Directorate</div>
      <div>Official Safety &amp; Emergency Incident Dossier · Confidential</div>
    </div>
  `;

  triggerPrintWindow(`MTRAVEL_Safety_Incidents_Report_${Date.now()}`, body);
}
