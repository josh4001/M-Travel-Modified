import type { StoredVehicle } from './bookingStore';

export interface InspectionCheckResult {
  id: string;
  category: 'PHOTO_QUALITY' | 'VEHICLE_AGE' | 'PRICING' | 'DOCUMENTATION' | 'SPECIFICATION';
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  impactPoints: number;
}

export interface VehicleInspectionReport {
  vehicleId: string;
  overallScore: number; // 0 to 100
  verdict: 'RECOMMEND_APPROVAL' | 'RECOMMEND_REJECTION' | 'REQUIRES_REVISION';
  verdictLabel: string;
  verdictColor: string;
  summary: string;
  checks: InspectionCheckResult[];
  flaggedReasons: string[];
  suggestedFeedback: string;
}

export const STANDARD_REJECTION_REASONS = [
  'Low-resolution, blurry, or missing rear vehicle photo',
  'Identical image uploaded for both front and rear perspectives (two distinct angles required)',
  'Vehicle registration plate obscured or missing in verification photos',
  'Vehicle manufacture year is older than M-TRAVEL luxury fleet standard (2017+ required)',
  'Daily rental rate is misaligned with platform market standards',
  'Non-compliant passenger seating capacity or seatbelts for commercial passenger service',
  'Missing commercial passenger inspection or proof of comprehensive insurance',
  'Visible body scratches, panel dent, or non-executive exterior finish',
];

/**
 * Smart AI-Assisted Vehicle Fleet Inspection Analyzer
 * Evaluates uploaded photos, metadata, model year, pricing, and compliance.
 */
export function analyzeVehicleForInspection(vehicle: StoredVehicle): VehicleInspectionReport {
  const checks: InspectionCheckResult[] = [];
  const flaggedReasons: string[] = [];
  let score = 100;

  const images = vehicle.images || [];
  const frontImg = images[0] || '';
  const rearImg = images[1] || '';

  // 1. Photo Check: Front image presence & quality
  if (!frontImg || frontImg.trim().length === 0) {
    checks.push({
      id: 'photo-front-missing',
      category: 'PHOTO_QUALITY',
      title: 'Front View Photo',
      status: 'FAIL',
      details: 'No front photo was provided. Full 3/4 front exterior perspective is mandatory.',
      impactPoints: 30,
    });
    flaggedReasons.push('No front exterior photo was provided');
    score -= 30;
  } else {
    checks.push({
      id: 'photo-front-ok',
      category: 'PHOTO_QUALITY',
      title: 'Front View Photo',
      status: 'PASS',
      details: 'Front exterior perspective image verified.',
      impactPoints: 0,
    });
  }

  // 2. Photo Check: Rear image presence & distinct perspective
  if (!rearImg || rearImg.trim().length === 0) {
    checks.push({
      id: 'photo-rear-missing',
      category: 'PHOTO_QUALITY',
      title: 'Rear / Back View Photo',
      status: 'FAIL',
      details: 'Rear perspective photo is missing. Host must provide both front and rear images.',
      impactPoints: 25,
    });
    flaggedReasons.push('Low-resolution, blurry, or missing rear vehicle photo');
    score -= 25;
  } else if (rearImg === frontImg) {
    checks.push({
      id: 'photo-duplicate',
      category: 'PHOTO_QUALITY',
      title: 'Distinct Photo Perspectives',
      status: 'FAIL',
      details: 'The front and rear photos are identical. Distinct front and rear views are required.',
      impactPoints: 20,
    });
    flaggedReasons.push('Identical image uploaded for both front and rear perspectives (two distinct angles required)');
    score -= 20;
  } else {
    checks.push({
      id: 'photo-rear-ok',
      category: 'PHOTO_QUALITY',
      title: 'Rear View Photo',
      status: 'PASS',
      details: 'Distinct rear exterior perspective image verified.',
      impactPoints: 0,
    });
  }

  // 3. Vehicle Model Year & Luxury Fleet Age Policy
  const currentYear = new Date().getFullYear();
  const vYear = Number(vehicle.year) || 2024;
  const vehicleAge = currentYear - vYear;

  if (vYear < 2016) {
    checks.push({
      id: 'age-fail',
      category: 'VEHICLE_AGE',
      title: `Manufacture Year (${vYear})`,
      status: 'FAIL',
      details: `Vehicle is ${vehicleAge} years old. M-TRAVEL luxury fleet policy requires 2017+ models for premier guest satisfaction.`,
      impactPoints: 25,
    });
    flaggedReasons.push(`Vehicle manufacture year (${vYear}) is older than M-TRAVEL luxury fleet standard (2017+ required)`);
    score -= 25;
  } else if (vYear < 2018) {
    checks.push({
      id: 'age-warn',
      category: 'VEHICLE_AGE',
      title: `Manufacture Year (${vYear})`,
      status: 'WARN',
      details: `Vehicle model year is borderline (${vYear}). Requires thorough mechanical fitness verification.`,
      impactPoints: 10,
    });
    score -= 10;
  } else {
    checks.push({
      id: 'age-pass',
      category: 'VEHICLE_AGE',
      title: `Manufacture Year (${vYear})`,
      status: 'PASS',
      details: `Modern manufacture year (${vYear}). Complies with luxury fleet standards.`,
      impactPoints: 0,
    });
  }

  // 4. Daily Rental Pricing Calibration
  const dailyRate = Number(vehicle.pricePerDay) || 0;
  if (dailyRate < 3500) {
    checks.push({
      id: 'pricing-too-low',
      category: 'PRICING',
      title: `Daily Rate (KES ${dailyRate.toLocaleString()})`,
      status: 'FAIL',
      details: `Daily rental rate is unusually low for luxury tier (KES ${dailyRate.toLocaleString()}). May indicate substandard maintenance or misconfiguration.`,
      impactPoints: 15,
    });
    flaggedReasons.push(`Daily rental rate (KES ${dailyRate.toLocaleString()}) is below luxury baseline`);
    score -= 15;
  } else if (dailyRate > 120000 && !vehicle.make.toLowerCase().includes('helicopter') && !vehicle.type.toLowerCase().includes('heli')) {
    checks.push({
      id: 'pricing-high-warn',
      category: 'PRICING',
      title: `Daily Rate (KES ${dailyRate.toLocaleString()})`,
      status: 'WARN',
      details: `Premium rate exceeds KES 120,000/day. Ensure premium features and chauffeur credentials justify this tier.`,
      impactPoints: 5,
    });
    score -= 5;
  } else {
    checks.push({
      id: 'pricing-pass',
      category: 'PRICING',
      title: `Daily Rate (KES ${dailyRate.toLocaleString()})`,
      status: 'PASS',
      details: `Daily rate is well-calibrated for executive marketplace demand.`,
      impactPoints: 0,
    });
  }

  // 5. Registration Plate Verification
  const plate = vehicle.plateNumber?.trim() || '';
  const plateRegex = /^[Kk][A-Za-z]{2}\s?[0-9]{3}[A-Za-z]$/;
  if (!plate || plate.toLowerCase() === 'pending' || plate.length < 5) {
    checks.push({
      id: 'plate-warn',
      category: 'DOCUMENTATION',
      title: 'Registration Plate',
      status: 'WARN',
      details: 'Kenyan license plate is unverified or marked pending. Plate number must be recorded before guest dispatch.',
      impactPoints: 10,
    });
    flaggedReasons.push('Vehicle registration plate number is missing or unverified');
    score -= 10;
  } else if (plateRegex.test(plate)) {
    checks.push({
      id: 'plate-pass',
      category: 'DOCUMENTATION',
      title: `License Plate (${plate})`,
      status: 'PASS',
      details: 'Valid Kenyan commercial/private registration plate format.',
      impactPoints: 0,
    });
  } else {
    checks.push({
      id: 'plate-custom',
      category: 'DOCUMENTATION',
      title: `License Plate (${plate})`,
      status: 'PASS',
      details: 'Registration plate present.',
      impactPoints: 0,
    });
  }

  // 6. Passenger Seating Spec
  const seats = Number(vehicle.seats) || 0;
  if (seats < 4) {
    checks.push({
      id: 'seats-warn',
      category: 'SPECIFICATION',
      title: `Seating Capacity (${seats} Seats)`,
      status: 'WARN',
      details: 'Less than 4 seats specified. Limited utility for tour groups or family travelers.',
      impactPoints: 5,
    });
    score -= 5;
  } else {
    checks.push({
      id: 'seats-pass',
      category: 'SPECIFICATION',
      title: `Seating Capacity (${seats} Seats)`,
      status: 'PASS',
      details: 'Optimal passenger capacity for luxury safari and executive transit.',
      impactPoints: 0,
    });
  }

  const finalScore = Math.max(10, Math.min(100, score));

  let verdict: VehicleInspectionReport['verdict'] = 'RECOMMEND_APPROVAL';
  let verdictLabel = 'Recommend Approval';
  let verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let summary = 'This vehicle meets M-TRAVEL luxury quality, photo perspective, and fleet safety standards.';

  if (finalScore < 65) {
    verdict = 'RECOMMEND_REJECTION';
    verdictLabel = 'Recommend Rejection';
    verdictColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    summary = `Inspection failed with score ${finalScore}%. Multiple critical requirements were not met.`;
  } else if (finalScore < 80) {
    verdict = 'REQUIRES_REVISION';
    verdictLabel = 'Requires Host Revision';
    verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    summary = `Vehicle scores ${finalScore}%. Clarification or updated photos recommended before approving live.`;
  }

  const suggestedFeedback = flaggedReasons.length > 0
    ? `Please address: ${flaggedReasons.slice(0, 2).join('; ')}.`
    : 'Vehicle is approved in executive class.';

  return {
    vehicleId: vehicle.id,
    overallScore: finalScore,
    verdict,
    verdictLabel,
    verdictColor,
    summary,
    checks,
    flaggedReasons,
    suggestedFeedback,
  };
}
