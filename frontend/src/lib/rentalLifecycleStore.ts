// =================================================================================================
// M-TRAVEL RENTAL LIFECYCLE & SECURITY ENGINE
// Manages:
// - Full 14-stage rental lifecycle state transitions
// - Handover (pre-rental) & Return inspection records
// - Level 1 Security: Periodic possession check-ins, return countdown, overdue tracking
// - Level 2 Security: On-demand geolocation check-ins, SOS emergency assistance, incident reports
// - Deposit settlement calculation & damage accountability
// - Audit log tracking & exception monitoring
// =================================================================================================

import { supabase } from './supabaseClient';
import { 
  getStoredBookings, 
  updateStoredBooking, 
  getStoredVehicles, 
  updateStoredVehicle,
  StoredBooking,
  isVehicleBooking,
  isTripBooking
} from './bookingStore';

// ==========================================
// 1. DATA MODELS & TYPES
// ==========================================

export interface VehicleHandover {
  id: string;
  bookingId: string;
  bookingRef: string;
  vehicleId: string;
  handoverDate: string;
  odometerReading: number;
  fuelLevelPercent: number; // 0 - 100
  checklist: {
    exteriorOk: boolean;
    interiorOk: boolean;
    spareWheel: boolean;
    toolsJack: boolean;
    cleanliness: boolean;
  };
  existingDamageNotes: string;
  handoverPhotos: string[];
  digitalAgreementSigned: boolean;
  travelerSignatureName: string;
  agencyAgentName: string;
  confirmedAt: string;
}

export interface VehicleInspection {
  id: string;
  bookingId: string;
  bookingRef: string;
  vehicleId: string;
  inspectionType: 'handover' | 'return';
  inspectionDate: string;
  odometerReading: number;
  fuelLevelPercent: number; // 0 - 100
  conditionStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  damageFound: boolean;
  damageDescription?: string;
  damagePhotos?: string[];
  fuelDifferenceCharge: number;
  damageCharge: number;
  lateReturnCharge: number;
  depositHeld: number;
  depositDeducted: number;
  depositRefunded: number;
  settlementStatus: 'PENDING' | 'SETTLED' | 'DISPUTED';
  inspectorName: string;
  settledAt: string;
  settlementNotes?: string;
}

export interface TripCheckin {
  id: string;
  bookingId: string;
  bookingRef: string;
  travelerId: string;
  travelerName: string;
  type: 'POSSESSION' | 'LOCATION' | 'ROUTINE' | 'EMERGENCY_SOS';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  locationName?: string;
  notes?: string;
}

export interface IncidentReport {
  id: string;
  bookingId: string;
  bookingRef: string;
  vehicleId: string;
  vehicleName: string;
  travelerId: string;
  travelerName: string;
  travelerPhone: string;
  type: 'ACCIDENT' | 'BREAKDOWN' | 'FLAT_TYRE' | 'MECHANICAL' | 'LOST_KEY' | 'LATE_RETURN' | 'SECURITY' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  locationDescription: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  emergencyContactCalled: boolean;
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'ACTION_TAKEN' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  actorName: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export interface ExceptionMetrics {
  totalFleet: number;
  available: number;
  activeRentals: number;
  reserved: number;
  returnDue: number;
  overdue: number;
  activeIncidents: number;
}

export interface AttentionItem {
  id: string;
  type: 'OVERDUE' | 'RETURN_DUE' | 'INCIDENT' | 'HANDOVER_PENDING' | 'INSPECTION_PENDING';
  severity: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  timeLabel: string;
  bookingId?: string;
  vehicleId?: string;
  incidentId?: string;
  actionLabel: string;
}

// ==========================================
// 2. PERSISTENCE STORAGE KEYS
// ==========================================

const HANDOVERS_KEY = 'mt_handovers_v1';
const INSPECTIONS_KEY = 'mt_inspections_v1';
const CHECKINS_KEY = 'mt_trip_checkins_v1';
const INCIDENTS_KEY = 'mt_incidents_v1';
const AUDIT_LOGS_KEY = 'mt_audit_logs_v1';

// Initial default audit log entries for immediate demonstration
const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    entityName: 'Vehicle',
    entityId: 'KBZ 892M',
    action: 'INSPECTION_APPROVED',
    actorName: 'Amos (Admin)',
    actorRole: 'ADMIN',
    details: 'Logbook and Commercial Insurance verified. Vehicle moved to AVAILABLE.',
    timestamp: new Date(Date.now() - 3600 * 48 * 1000).toISOString()
  },
  {
    id: 'audit-002',
    entityName: 'Booking',
    entityId: 'MT-BKG-8831',
    action: 'BOOKING_RESERVED',
    actorName: 'System Gateway',
    actorRole: 'SYSTEM',
    details: 'Payment & KES 10,000 security deposit confirmed via M-Pesa.',
    timestamp: new Date(Date.now() - 3600 * 24 * 1000).toISOString()
  }
];

// ==========================================
// 3. STORAGE GETTERS & HELPERS
// ==========================================

export const getAllHandovers = (): VehicleHandover[] => {
  try {
    const raw = localStorage.getItem(HANDOVERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getHandoverByBookingId = (bookingId: string): VehicleHandover | undefined => {
  return getAllHandovers().find(h => h.bookingId === bookingId);
};

export const getAllInspections = (): VehicleInspection[] => {
  try {
    const raw = localStorage.getItem(INSPECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getInspectionByBookingId = (bookingId: string): VehicleInspection | undefined => {
  return getAllInspections().find(i => i.bookingId === bookingId);
};

export const getAllCheckins = (): TripCheckin[] => {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getCheckinsByBookingId = (bookingId: string): TripCheckin[] => {
  return getAllCheckins().filter(c => c.bookingId === bookingId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const getAllIncidents = (): IncidentReport[] => {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getIncidentsByBookingId = (bookingId: string): IncidentReport[] => {
  return getAllIncidents().filter(inc => inc.bookingId === bookingId);
};

export const getAllAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_AUDIT_LOGS;
  } catch {
    return DEFAULT_AUDIT_LOGS;
  }
};

// ==========================================
// 4. AUDIT TRAIL LOGGING
// ==========================================

export const logAuditEvent = (
  action: string,
  entityName: string,
  entityId: string,
  details: string,
  actorName: string = 'Staff Admin',
  actorRole: string = 'ADMIN'
): AuditLogEntry => {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityName,
    entityId,
    action,
    actorName,
    actorRole,
    details,
    timestamp: new Date().toISOString()
  };

  try {
    const logs = getAllAuditLogs();
    logs.unshift(entry);
    // Keep last 300 logs
    const capped = logs.slice(0, 300);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(capped));
    window.dispatchEvent(new CustomEvent('mt_audit_logged', { detail: entry }));
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }

  // Real-time sync to Supabase audit_logs (compatible with both metadata and custom columns)
  if (supabase) {
    (async () => {
      try {
        const payload: any = {
          action: action.toUpperCase(),
          entity: entityName,
          entity_id: String(entityId || ''),
          metadata: {
            actor_name: actorName,
            actor_role: actorRole,
            details: details,
          },
          created_at: entry.timestamp,
        };

        const { error } = await supabase.from('audit_logs').insert([payload]);
        if (error) {
          // If metadata or custom column mismatch occurs, retry with fallback payload
          const fallback: any = {
            action: action.toUpperCase(),
            entity: entityName,
            entity_id: String(entityId || ''),
            actor_name: actorName,
            actor_role: actorRole,
            details: details,
            created_at: entry.timestamp,
          };
          await supabase.from('audit_logs').insert([fallback]);
        }
      } catch (err) {
        console.warn('Supabase audit_log insert notice:', err);
      }
    })();
  }

  return entry;
};

// ==========================================
// 5. LIFECYCLE ACTION: PRE-RENTAL HANDOVER
// ==========================================

export const executeHandover = async (
  handoverData: Omit<VehicleHandover, 'id' | 'confirmedAt'>
): Promise<VehicleHandover> => {
  const allBookings = getStoredBookings();
  const currentBooking = allBookings.find(b => b.id === handoverData.bookingId || b.bookingRef === handoverData.bookingRef);
  if (currentBooking && !isVehicleBooking(currentBooking)) {
    console.warn(`[executeHandover] Handover skipped for trip booking ${handoverData.bookingRef}. Pre-rental handovers apply to vehicle rentals only.`);
    return {
      ...handoverData,
      id: `ho-skipped-${Date.now()}`,
      confirmedAt: new Date().toISOString()
    };
  }

  const fullHandover: VehicleHandover = {
    ...handoverData,
    id: `ho-${Date.now()}`,
    confirmedAt: new Date().toISOString()
  };

  // 1. Save handover record
  const handovers = getAllHandovers();
  const existingIdx = handovers.findIndex(h => h.bookingId === fullHandover.bookingId);
  if (existingIdx >= 0) {
    handovers[existingIdx] = fullHandover;
  } else {
    handovers.push(fullHandover);
  }
  localStorage.setItem(HANDOVERS_KEY, JSON.stringify(handovers));

  // 2. Update Booking status to 'IN_PROGRESS' (or ACTIVE)
  updateStoredBooking(fullHandover.bookingId, {
    status: 'IN_PROGRESS'
  });

  // 3. Update Vehicle operational status to active rental and set odometer
  if (fullHandover.vehicleId) {
    updateStoredVehicle(fullHandover.vehicleId, {
      isLive: false // not available for new search while active
    });
  }

  // 4. Record Initial Trip Checkin (Possession Affirmation)
  recordTripCheckin({
    bookingId: fullHandover.bookingId,
    bookingRef: fullHandover.bookingRef,
    travelerId: 'traveler-active',
    travelerName: fullHandover.travelerSignatureName || 'Renter',
    type: 'POSSESSION',
    notes: `Pre-rental vehicle handover completed at ${fullHandover.odometerReading} km, Fuel: ${fullHandover.fuelLevelPercent}%. Agreement signed.`
  });

  // 5. Log Audit Event
  logAuditEvent(
    'PRE_RENTAL_HANDOVER_CONFIRMED',
    'Booking',
    fullHandover.bookingRef,
    `Vehicle handed over to ${fullHandover.travelerSignatureName}. Initial odometer: ${fullHandover.odometerReading} km, fuel: ${fullHandover.fuelLevelPercent}%.`,
    fullHandover.agencyAgentName || 'Agent',
    'AGENT'
  );

  window.dispatchEvent(new CustomEvent('mt_rental_handover', { detail: fullHandover }));

  // Supabase background sync
  if (supabase) {
    try {
      supabase.from('vehicle_handovers').insert([{
        booking_id: fullHandover.bookingId,
        vehicle_id: fullHandover.vehicleId,
        odometer_reading: fullHandover.odometerReading,
        fuel_level_percent: fullHandover.fuelLevelPercent,
        checklist_exterior_condition: fullHandover.checklist.exteriorOk,
        checklist_interior_condition: fullHandover.checklist.interiorOk,
        checklist_spare_wheel: fullHandover.checklist.spareWheel,
        checklist_tools_jack: fullHandover.checklist.toolsJack,
        checklist_cleanliness: fullHandover.checklist.cleanliness,
        existing_damage_notes: fullHandover.existingDamageNotes,
        digital_agreement_signed: fullHandover.digitalAgreementSigned,
        agency_agent_name: fullHandover.agencyAgentName
      }]).then(() => {}, () => {});
    } catch {}
  }

  return fullHandover;
};

// ==========================================
// 6. LIFECYCLE ACTION: POST-RENTAL RETURN INSPECTION & DEPOSIT SETTLEMENT
// ==========================================

export const executeReturnInspection = async (
  inspectionData: Omit<VehicleInspection, 'id' | 'settledAt'>
): Promise<VehicleInspection> => {
  const allBookings = getStoredBookings();
  const currentBooking = allBookings.find(b => b.id === inspectionData.bookingId || b.bookingRef === inspectionData.bookingRef);
  if (currentBooking && !isVehicleBooking(currentBooking)) {
    console.warn(`[executeReturnInspection] Return inspection skipped for trip booking ${inspectionData.bookingRef}. Return inspections apply to vehicle rentals only.`);
    return {
      ...inspectionData,
      id: `insp-skipped-${Date.now()}`,
      depositRefunded: inspectionData.depositHeld - inspectionData.depositDeducted,
      settlementStatus: 'SETTLED',
      settledAt: new Date().toISOString()
    };
  }

  const fullInspection: VehicleInspection = {
    ...inspectionData,
    id: `insp-${Date.now()}`,
    settledAt: new Date().toISOString()
  };

  // 1. Save Inspection record
  const inspections = getAllInspections();
  const existingIdx = inspections.findIndex(i => i.bookingId === fullInspection.bookingId);
  if (existingIdx >= 0) {
    inspections[existingIdx] = fullInspection;
  } else {
    inspections.push(fullInspection);
  }
  localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));

  // 2. Mark Booking as COMPLETED
  updateStoredBooking(fullInspection.bookingId, {
    status: 'COMPLETED'
  });

  // 3. Mark Vehicle as available again
  if (fullInspection.vehicleId) {
    updateStoredVehicle(fullInspection.vehicleId, {
      isLive: true
    });
  }

  // 4. Log Audit Event
  const damageNote = fullInspection.damageFound 
    ? `Damage detected: ${fullInspection.damageDescription || 'Detailed on report'}. Deducted: KES ${fullInspection.depositDeducted.toLocaleString()}.` 
    : 'No damage detected. Clean condition.';

  logAuditEvent(
    'RETURN_INSPECTION_AND_SETTLEMENT',
    'Booking',
    fullInspection.bookingRef,
    `Vehicle returned at ${fullInspection.odometerReading} km, Fuel: ${fullInspection.fuelLevelPercent}%. ${damageNote} Refunded: KES ${fullInspection.depositRefunded.toLocaleString()}.`,
    fullInspection.inspectorName || 'Amos (Admin)',
    'ADMIN'
  );

  window.dispatchEvent(new CustomEvent('mt_return_inspected', { detail: fullInspection }));

  // Supabase background sync
  if (supabase) {
    try {
      supabase.from('vehicle_inspections').insert([{
        booking_id: fullInspection.bookingId,
        vehicle_id: fullInspection.vehicleId,
        inspection_type: 'return',
        inspector_name: fullInspection.inspectorName,
        odometer_reading: fullInspection.odometerReading,
        fuel_level_percent: fullInspection.fuelLevelPercent,
        condition_status: fullInspection.conditionStatus,
        damage_found: fullInspection.damageFound,
        damage_description: fullInspection.damageDescription,
        deposit_held: fullInspection.depositHeld,
        deposit_deducted: fullInspection.depositDeducted,
        deposit_refunded: fullInspection.depositRefunded,
        settlement_status: fullInspection.settlementStatus
      }]).then(() => {}, () => {});
    } catch {}
  }

  return fullInspection;
};

// ==========================================
// 7. LEVEL 1 & 2 SECURITY: TRIP CHECK-INS & GEOLOCATION
// ==========================================

export const recordTripCheckin = (
  checkinData: Omit<TripCheckin, 'id' | 'timestamp'>
): TripCheckin => {
  const fullCheckin: TripCheckin = {
    ...checkinData,
    id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString()
  };

  const checkins = getAllCheckins();
  checkins.unshift(fullCheckin);
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));

  // Log in audit trail
  logAuditEvent(
    'TRIP_SECURITY_CHECKIN',
    'Booking',
    fullCheckin.bookingRef,
    `Checkin type: ${fullCheckin.type}. ${fullCheckin.locationName ? 'Location: ' + fullCheckin.locationName : ''} ${fullCheckin.notes || ''}`,
    fullCheckin.travelerName,
    'TRAVELER'
  );

  window.dispatchEvent(new CustomEvent('mt_trip_checkin', { detail: fullCheckin }));

  if (supabase) {
    try {
      supabase.from('trip_checkins').insert([{
        booking_id: fullCheckin.bookingId,
        checkin_type: fullCheckin.type.toLowerCase(),
        latitude: fullCheckin.latitude,
        longitude: fullCheckin.longitude,
        accuracy_meters: fullCheckin.accuracyMeters,
        location_name: fullCheckin.locationName,
        traveler_comment: fullCheckin.notes
      }]).then(() => {}, () => {});
    } catch {}
  }

  return fullCheckin;
};

// ==========================================
// 8. LEVEL 2 SECURITY: INCIDENT & SOS REPORTING
// ==========================================

export const reportIncident = (
  incidentData: Omit<IncidentReport, 'id' | 'reportedAt' | 'status'>
): IncidentReport => {
  const fullIncident: IncidentReport = {
    ...incidentData,
    id: `inc-${Date.now()}`,
    status: 'REPORTED',
    reportedAt: new Date().toISOString()
  };

  const incidents = getAllIncidents();
  incidents.unshift(fullIncident);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));

  // Audit log
  logAuditEvent(
    'INCIDENT_FILED',
    'Incident',
    fullIncident.id,
    `🚨 [${fullIncident.severity.toUpperCase()}] ${fullIncident.type}: ${fullIncident.description}. Booking: ${fullIncident.bookingRef}`,
    fullIncident.travelerName,
    'TRAVELER'
  );

  window.dispatchEvent(new CustomEvent('mt_incident_reported', { detail: fullIncident }));

  if (supabase) {
    try {
      supabase.from('incidents').insert([{
        booking_id: fullIncident.bookingId,
        vehicle_id: fullIncident.vehicleId,
        incident_type: fullIncident.type.toLowerCase(),
        severity: fullIncident.severity.toLowerCase(),
        description: fullIncident.description,
        location_description: fullIncident.locationDescription,
        latitude: fullIncident.latitude,
        longitude: fullIncident.longitude,
        photo_urls: fullIncident.photos,
        emergency_contact_called: fullIncident.emergencyContactCalled,
        status: 'reported'
      }]).then(() => {}, () => {});
    } catch {}
  }

  return fullIncident;
};

export const updateIncidentStatus = (
  incidentId: string,
  newStatus: IncidentReport['status'],
  resolutionNotes?: string
): IncidentReport | null => {
  const incidents = getAllIncidents();
  const idx = incidents.findIndex(i => i.id === incidentId);
  if (idx === -1) return null;

  incidents[idx].status = newStatus;
  if (resolutionNotes) {
    incidents[idx].resolutionNotes = resolutionNotes;
  }
  if (newStatus === 'RESOLVED') {
    incidents[idx].resolvedAt = new Date().toISOString();
  }

  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));

  logAuditEvent(
    'INCIDENT_STATUS_UPDATED',
    'Incident',
    incidentId,
    `Status moved to ${newStatus}. ${resolutionNotes ? 'Notes: ' + resolutionNotes : ''}`,
    'Amos (Admin)',
    'ADMIN'
  );

  window.dispatchEvent(new CustomEvent('mt_incident_updated', { detail: incidents[idx] }));
  return incidents[idx];
};

// ==========================================
// 9. OVERDUE & EXPIRY EVALUATOR
// ==========================================

export interface TripOverdueStatus {
  isOverdue: boolean;
  isDueSoon: boolean;
  hoursRemaining: number;
  label: string;
  badgeClass: string;
}

export const evaluateTripOverdueStatus = (booking: StoredBooking): TripOverdueStatus => {
  // Trips/tours/stays are not vehicles — they do not have vehicle return overdue timers
  if (isTripBooking(booking)) {
    return {
      isOverdue: false,
      isDueSoon: false,
      hoursRemaining: 0,
      label: 'Trip / Stay',
      badgeClass: 'bg-purple-100 text-purple-800'
    };
  }

  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
    return {
      isOverdue: false,
      isDueSoon: false,
      hoursRemaining: 0,
      label: 'Closed',
      badgeClass: 'bg-gray-100 text-gray-700'
    };
  }

  const now = new Date().getTime();
  const end = new Date(booking.endDate).getTime();
  const diffMs = end - now;
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(hoursRemaining);
    return {
      isOverdue: true,
      isDueSoon: false,
      hoursRemaining,
      label: `OVERDUE by ${overdueHours}h 🚨`,
      badgeClass: 'bg-red-600 text-white font-black animate-pulse'
    };
  }

  if (hoursRemaining <= 6) {
    return {
      isOverdue: false,
      isDueSoon: true,
      hoursRemaining,
      label: `Return due in ${hoursRemaining}h ⚠️`,
      badgeClass: 'bg-amber-500 text-white font-bold'
    };
  }

  return {
    isOverdue: false,
    isDueSoon: false,
    hoursRemaining,
    label: `${Math.ceil(hoursRemaining / 24)}d left`,
    badgeClass: 'bg-emerald-100 text-emerald-800'
  };
};

// ==========================================
// 10. EXCEPTION METRICS & ATTENTION QUEUE
// ==========================================

export const getExceptionMetrics = (): ExceptionMetrics => {
  const vehicles = getStoredVehicles();
  const bookings = getStoredBookings();
  const incidents = getAllIncidents();

  let activeRentals = 0;
  let reserved = 0;
  let returnDue = 0;
  let overdue = 0;

  bookings.forEach(b => {
    // Strictly fleet vehicles only — trips are not vehicles
    if (!isVehicleBooking(b)) return;

    const status = (b.status || '').toUpperCase();
    if (status === 'IN_PROGRESS' || status === 'ACTIVE') {
      activeRentals++;
      const timeEval = evaluateTripOverdueStatus(b);
      if (timeEval.isOverdue) overdue++;
      else if (timeEval.isDueSoon) returnDue++;
    } else if (status === 'CONFIRMED' || status === 'PAID' || status === 'ACCEPTED' || status === 'RESERVED') {
      reserved++;
    }
  });

  const available = vehicles.filter(v => v.status === 'APPROVED' && v.isLive !== false).length;
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED').length;

  return {
    totalFleet: vehicles.length,
    available,
    activeRentals,
    reserved,
    returnDue,
    overdue,
    activeIncidents
  };
};

export const getAttentionRequiredQueue = (): AttentionItem[] => {
  const items: AttentionItem[] = [];
  const bookings = getStoredBookings();
  const incidents = getAllIncidents();

  // 1. Unresolved Incidents
  incidents.filter(i => i.status !== 'RESOLVED').forEach(inc => {
    items.push({
      id: `att-inc-${inc.id}`,
      type: 'INCIDENT',
      severity: inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'high' : 'medium',
      title: `🚨 ${inc.type.replace('_', ' ')}: ${inc.vehicleName}`,
      subtitle: `${inc.travelerName} (${inc.travelerPhone}) - ${inc.description.substring(0, 70)}...`,
      timeLabel: new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      incidentId: inc.id,
      bookingId: inc.bookingId,
      actionLabel: 'Resolve Incident'
    });
  });

  // 2. Overdue Bookings & Pre-rental Handovers (strictly vehicle rentals only)
  bookings.forEach(b => {
    // Trips and tours are not vehicles — they do not require vehicle handovers or vehicle return inspections
    if (!isVehicleBooking(b)) return;

    const status = (b.status || '').toUpperCase();
    if (status === 'IN_PROGRESS' || status === 'ACTIVE') {
      const timeEval = evaluateTripOverdueStatus(b);
      if (timeEval.isOverdue) {
        items.push({
          id: `att-od-${b.id}`,
          type: 'OVERDUE',
          severity: 'high',
          title: `🚨 VEHICLE RETURN OVERDUE: ${b.vehicleName}`,
          subtitle: `Renter: ${b.touristName} (${b.touristPhone}) - Scheduled return was ${new Date(b.endDate).toLocaleString()}`,
          timeLabel: timeEval.label,
          bookingId: b.id,
          vehicleId: b.vehicleId,
          actionLabel: 'Inspect & Settle'
        });
      } else if (timeEval.isDueSoon) {
        items.push({
          id: `att-due-${b.id}`,
          type: 'RETURN_DUE',
          severity: 'medium',
          title: `⚠️ Return Due Soon: ${b.vehicleName}`,
          subtitle: `Renter: ${b.touristName} (${b.touristPhone}) - ${timeEval.label}`,
          timeLabel: `${timeEval.hoursRemaining}h left`,
          bookingId: b.id,
          vehicleId: b.vehicleId,
          actionLabel: 'Prepare Inspection'
        });
      }
    } else if (status === 'CONFIRMED' || status === 'PAID' || status === 'ACCEPTED' || status === 'RESERVED') {
      // Check if handover needed
      const handover = getHandoverByBookingId(b.id);
      if (!handover) {
        items.push({
          id: `att-ho-${b.id}`,
          type: 'HANDOVER_PENDING',
          severity: 'low',
          title: `🔑 Pre-Rental Handover Pending: ${b.vehicleName}`,
          subtitle: `Reserved by ${b.touristName} (${b.touristPhone}). Awaiting digital agreement & checklist.`,
          timeLabel: 'Pickup Ready',
          bookingId: b.id,
          vehicleId: b.vehicleId,
          actionLabel: 'Execute Handover'
        });
      }
    }
  });

  return items;
};
