import React, { useState, useMemo } from 'react';
import {
  X, Gauge, Fuel, AlertTriangle,
  Camera, CheckCircle2, DollarSign,
  TrendingUp
} from 'lucide-react';
import { StoredBooking, isTripBooking } from '@/lib/bookingStore';
import {
  VehicleHandover,
  VehicleInspection,
  executeReturnInspection,
  evaluateTripOverdueStatus
} from '@/lib/rentalLifecycleStore';

interface VehicleReturnInspectionModalProps {
  booking: StoredBooking;
  handover?: VehicleHandover;
  onClose: () => void;
  onInspectionComplete: (inspection: VehicleInspection) => void;
}

export const VehicleReturnInspectionModal: React.FC<VehicleReturnInspectionModalProps> = ({
  booking,
  handover,
  onClose,
  onInspectionComplete
}) => {
  if (isTripBooking(booking)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">Return Inspection Not Applicable</h3>
          <p className="text-xs text-slate-600">
            Booking <strong>{booking.bookingRef}</strong> is for a safari tour or holiday stay. Vehicle return inspections, odometer distance tracking, and vehicle damage checks apply exclusively to fleet vehicle rentals.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  const initialOdo = handover?.odometerReading || 45280;
  const initialFuel = handover?.fuelLevelPercent || 100;

  const [returnOdometer, setReturnOdometer] = useState<number>(initialOdo + 340);
  const [returnFuel, setReturnFuel] = useState<number>(initialFuel);
  const [conditionStatus, setConditionStatus] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [damageFound, setDamageFound] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageCharge, setDamageCharge] = useState<number | string>('');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [inspectorName, setInspectorName] = useState('Amos (Operations Lead)');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate distance driven
  const distanceDriven = useMemo(() => {
    return Math.max(0, returnOdometer - initialOdo);
  }, [returnOdometer, initialOdo]);

  // Calculate overdue late fee if applicable
  const overdueEval = useMemo(() => evaluateTripOverdueStatus(booking), [booking]);
  const lateReturnCharge = useMemo(() => {
    if (overdueEval.isOverdue) {
      const hours = Math.abs(overdueEval.hoursRemaining);
      return Math.min(hours * 1000, 10000); // KES 1,000 per overdue hour up to deposit
    }
    return 0;
  }, [overdueEval]);

  // Automatic fuel deficit calculation (KES 350 per 10% shortage)
  const calculatedFuelCharge = useMemo(() => {
    if (returnFuel < initialFuel) {
      const deficit = initialFuel - returnFuel;
      return Math.round((deficit / 10) * 350); // ~KES 350 per 10% fuel deficit
    }
    return 0;
  }, [returnFuel, initialFuel]);

  const depositHeld = 10000;
  const effectiveDamageCharge = damageFound ? (Number(damageCharge) || 0) : 0;
  const totalDeductions = calculatedFuelCharge + effectiveDamageCharge + lateReturnCharge;
  const depositRefunded = Math.max(0, depositHeld - totalDeductions);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setDamagePhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnOdometer < initialOdo) {
      alert(`Return odometer (${returnOdometer} km) cannot be lower than handover odometer (${initialOdo} km).`);
      return;
    }

    if (damageFound && !damageDescription.trim()) {
      alert('Please describe the damage detected before finalizing inspection.');
      return;
    }

    setIsSubmitting(true);
    try {
      const inspection = await executeReturnInspection({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        vehicleId: booking.vehicleId || 'v-unknown',
        inspectionType: 'return',
        inspectionDate: new Date().toISOString(),
        odometerReading: Number(returnOdometer),
        fuelLevelPercent: Number(returnFuel),
        conditionStatus,
        damageFound,
        damageDescription: damageFound ? damageDescription : undefined,
        damagePhotos: damageFound ? damagePhotos : undefined,
        fuelDifferenceCharge: calculatedFuelCharge,
        damageCharge: effectiveDamageCharge,
        lateReturnCharge,
        depositHeld,
        depositDeducted: totalDeductions,
        depositRefunded,
        settlementStatus: 'SETTLED',
        inspectorName,
        settlementNotes
      });

      onInspectionComplete(inspection);
    } catch (err) {
      console.error('Error completing return inspection:', err);
      alert('Failed to complete return inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Vehicle Return & Settlement Inspection
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  Stage 13 of 14
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                Booking: <span className="font-mono text-amber-300">{booking.bookingRef}</span> • Vehicle: <span className="font-semibold text-white">{booking.vehicleName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Overdue Warning if late */}
          {overdueEval.isOverdue && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Vehicle Returned Late ({Math.abs(overdueEval.hoursRemaining)} Hours Overdue)</h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Scheduled return was {new Date(booking.endDate).toLocaleString()}. A late return charge of KES {lateReturnCharge.toLocaleString()} has been factored into the settlement.
                </p>
              </div>
            </div>
          )}

          {/* Handover Baseline vs Return Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-semibold block">Pre-Rental Handover Baseline</span>
              <p className="font-medium text-gray-800">
                Odometer: <span className="font-mono font-bold">{initialOdo.toLocaleString()} km</span>
              </p>
              <p className="font-medium text-gray-800">
                Fuel Level: <span className="font-bold text-amber-600">{initialFuel}%</span>
              </p>
              {handover?.existingDamageNotes && (
                <p className="text-xs text-gray-500 italic">
                  Noted at start: "{handover.existingDamageNotes}"
                </p>
              )}
            </div>

            <div className="space-y-1 md:border-l md:border-slate-200 md:pl-4">
              <span className="text-xs text-indigo-700 uppercase font-bold block flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Trip Distance Summary
              </span>
              <p className="text-2xl font-black font-mono text-gray-900">
                +{distanceDriven.toLocaleString()} <span className="text-sm font-sans font-medium text-gray-500">KM driven</span>
              </p>
              <p className="text-xs text-gray-600">
                Renter: <span className="font-semibold">{booking.touristName}</span> ({booking.touristPhone})
              </p>
            </div>
          </div>

          {/* Return Odometer & Fuel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                Return Odometer Reading (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={initialOdo}
                  required
                  value={returnOdometer}
                  onChange={e => setReturnOdometer(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-lg font-mono font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold">KM</span>
              </div>
              <p className="text-xs text-gray-500">Must be ≥ {initialOdo.toLocaleString()} km.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  Fuel Level at Return
                </span>
                <span className="font-bold text-amber-700">{returnFuel}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={returnFuel}
                onChange={e => setReturnFuel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>Empty (0%)</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              {calculatedFuelCharge > 0 && (
                <p className="text-xs text-red-600 font-semibold">
                  Fuel deficit surcharge: KES {calculatedFuelCharge.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Condition Evaluation */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Overall Return Vehicle Condition</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'] as const).map(cond => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => {
                    setConditionStatus(cond);
                    if (cond === 'DAMAGED') setDamageFound(true);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    conditionStatus === cond
                      ? cond === 'DAMAGED'
                        ? 'bg-red-600 text-white border-red-700 shadow-sm'
                        : 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Damage Check & Deductions */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${damageFound ? 'text-red-600' : 'text-gray-400'}`} />
                  Damage or Excessive Wear Detected?
                </h4>
                <p className="text-xs text-gray-500">Record any new scratches, dents, cracked glass, or interior burns.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDamageFound(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    !damageFound ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  No Damage (Clean)
                </button>
                <button
                  type="button"
                  onClick={() => setDamageFound(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    damageFound ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Damage Found
                </button>
              </div>
            </div>

            {damageFound && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Damage Description & Location on Vehicle
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={damageDescription}
                    onChange={e => setDamageDescription(e.target.value)}
                    placeholder="e.g. Rear right bumper scratch (approx 15cm) and broken fog lamp reflector."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Assessed Repair / Restitution Cost (KES)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={depositHeld}
                      placeholder="0"
                      value={damageCharge}
                      onChange={e => {
                        const val = e.target.value;
                        setDamageCharge(val === '' ? '' : Math.max(0, Number(val)));
                      }}
                      onFocus={() => {
                        if (String(damageCharge) === '0') {
                          setDamageCharge('');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-mono font-bold text-red-700 focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Attach Evidence Photos ({damagePhotos.length})
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors w-full justify-center">
                      <Camera className="w-3.5 h-3.5" />
                      Upload Damage Photo
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {damagePhotos.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {damagePhotos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-red-300"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Deposit Settlement Breakdown */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
            <h4 className="text-sm font-bold text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Security Deposit Settlement Breakdown
              </span>
              <span className="text-xs font-mono font-bold text-indigo-800 bg-white px-2.5 py-0.5 rounded border border-indigo-200">
                Deposit Held: KES {depositHeld.toLocaleString()}
              </span>
            </h4>

            <div className="space-y-1.5 text-xs text-gray-700 pt-1 border-t border-indigo-100">
              <div className="flex justify-between">
                <span>Security Deposit Held:</span>
                <span className="font-mono font-semibold">+ KES {depositHeld.toLocaleString()}</span>
              </div>
              {calculatedFuelCharge > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Fuel Deficit Deduction:</span>
                  <span className="font-mono font-semibold">- KES {calculatedFuelCharge.toLocaleString()}</span>
                </div>
              )}
              {effectiveDamageCharge > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Damage Restitution Deduction:</span>
                  <span className="font-mono font-semibold">- KES {effectiveDamageCharge.toLocaleString()}</span>
                </div>
              )}
              {lateReturnCharge > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Return Overdue Fee:</span>
                  <span className="font-mono font-semibold">- KES {lateReturnCharge.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-indigo-200 text-sm font-bold">
                <span className="text-indigo-950">Net Deposit Refunded to Traveler:</span>
                <span className="font-mono text-emerald-700 text-base">
                  KES {depositRefunded.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Inspector & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Inspecting Staff Officer
              </label>
              <input
                type="text"
                required
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Settlement Notes (Optional)
              </label>
              <input
                type="text"
                value={settlementNotes}
                onChange={e => setSettlementNotes(e.target.value)}
                placeholder="e.g. M-Pesa deposit refund of KES 10,000 processed."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'Finalizing Inspection...' : 'Finalize Return & Close Booking 🏁'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
