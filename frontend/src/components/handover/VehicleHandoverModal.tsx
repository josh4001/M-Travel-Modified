import React, { useState } from 'react';
import {
  X, CheckSquare, ShieldCheck, Gauge, Fuel,
  FileCheck, Camera, Check
} from 'lucide-react';
import { StoredBooking, StoredVehicle, isTripBooking } from '@/lib/bookingStore';
import { executeHandover, VehicleHandover } from '@/lib/rentalLifecycleStore';

interface VehicleHandoverModalProps {
  booking: StoredBooking;
  vehicle?: StoredVehicle;
  onClose: () => void;
  onHandoverComplete: (handover: VehicleHandover) => void;
}

export const VehicleHandoverModal: React.FC<VehicleHandoverModalProps> = ({
  booking,
  vehicle,
  onClose,
  onHandoverComplete
}) => {
  if (isTripBooking(booking)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">Vehicle Handover Not Applicable</h3>
          <p className="text-xs text-slate-600">
            Booking <strong>{booking.bookingRef}</strong> is for a guided tour or holiday stay. Pre-rental handovers, odometer readings, and condition checklists apply exclusively to fleet vehicle rentals.
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
  const [odometerReading, setOdometerReading] = useState<number>(45280);
  const [fuelLevelPercent, setFuelLevelPercent] = useState<number>(100);
  const [exteriorOk, setExteriorOk] = useState(true);
  const [interiorOk, setInteriorOk] = useState(true);
  const [spareWheel, setSpareWheel] = useState(true);
  const [toolsJack, setToolsJack] = useState(true);
  const [cleanliness, setCleanliness] = useState(true);
  const [idVerified, setIdVerified] = useState(true);
  const [licenseVerified, setLicenseVerified] = useState(true);
  const [existingDamageNotes, setExistingDamageNotes] = useState('');
  const [digitalAgreementSigned, setDigitalAgreementSigned] = useState(true);
  const [travelerSignatureName, setTravelerSignatureName] = useState(booking.touristName || '');
  const [agencyAgentName, setAgencyAgentName] = useState('Amos (Operations Lead)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([
    vehicle?.images?.[0] || booking.vehicleImage || '/images/cars/default.png'
  ]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotoPreviews(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!digitalAgreementSigned) {
      alert('The digital agreement must be accepted prior to releasing the vehicle.');
      return;
    }

    if (!travelerSignatureName.trim()) {
      alert('Please enter the traveler signature confirmation name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const handover = await executeHandover({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        vehicleId: booking.vehicleId || vehicle?.id || 'v-unknown',
        handoverDate: new Date().toISOString(),
        odometerReading: Number(odometerReading),
        fuelLevelPercent: Number(fuelLevelPercent),
        checklist: {
          exteriorOk,
          interiorOk,
          spareWheel,
          toolsJack,
          cleanliness
        },
        existingDamageNotes,
        handoverPhotos: photoPreviews,
        digitalAgreementSigned,
        travelerSignatureName,
        agencyAgentName
      });

      onHandoverComplete(handover);
    } catch (err) {
      console.error('Error executing handover:', err);
      alert('Failed to complete handover. Please try again.');
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
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Pre-Rental Handover Inspection
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  Step 8 of 14
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
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div>
              <span className="text-xs text-gray-500 block uppercase font-medium">Renter / Traveler</span>
              <span className="font-bold text-gray-900">{booking.touristName}</span>
              <span className="text-xs text-gray-500 block">{booking.touristPhone}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-medium">Rental Period</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-medium">Security Deposit</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                KES 10,000 (Held)
              </span>
            </div>
          </div>

          {/* Odometer & Fuel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                Handover Odometer Reading (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={odometerReading}
                  onChange={e => setOdometerReading(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-lg font-mono font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold">KM</span>
              </div>
              <p className="text-xs text-gray-500">Current dashboard reading recorded upon key release.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  Fuel Level at Handover
                </span>
                <span className="font-bold text-amber-700">{fuelLevelPercent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fuelLevelPercent}
                onChange={e => setFuelLevelPercent(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>Empty (0%)</span>
                <span>Quarter (25%)</span>
                <span>Half (50%)</span>
                <span>Full (100%)</span>
              </div>
            </div>
          </div>

          {/* MANDATORY TRAVELER DOCUMENT VERIFICATION CHECKBOXES */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Mandatory Traveler Identity &amp; Document Verification
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">Executive Inspection</span>
            </h4>
            <p className="text-xs text-amber-800 font-medium">
              Confirm physical original documents have been manually inspected &amp; verified by M-TRAVEL agents before key release:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
              <label className="flex items-center space-x-2.5 cursor-pointer p-2.5 rounded-lg bg-white border border-amber-200 hover:border-amber-400">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={e => setIdVerified(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-gray-800">Original National ID Card or Passport Verified</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-2.5 rounded-lg bg-white border border-amber-200 hover:border-amber-400">
                <input
                  type="checkbox"
                  checked={licenseVerified}
                  onChange={e => setLicenseVerified(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-gray-800">Valid Driving License Verified (Self-Drive)</span>
              </label>
            </div>
          </div>

          {/* Vehicle Checklist */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Pre-Departure Condition Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  checked={exteriorOk}
                  onChange={e => setExteriorOk(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-gray-700">Exterior Bodywork & Glass OK</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  checked={interiorOk}
                  onChange={e => setInteriorOk(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-gray-700">Cabin & Upholstery Condition OK</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  checked={spareWheel}
                  onChange={e => setSpareWheel(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-gray-700">Spare Tyre Present & Inflated</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  checked={toolsJack}
                  onChange={e => setToolsJack(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-gray-700">Jack, Spanner & Warning Triangles</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={cleanliness}
                  onChange={e => setCleanliness(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-gray-700">Cleanliness Standard Confirmed (Car Wash Certified)</span>
              </label>
            </div>
          </div>

          {/* Pre-existing Damage Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Existing Blemishes or Scratch Notes (Protects Traveler)</span>
              <span className="text-xs text-gray-500 font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              value={existingDamageNotes}
              onChange={e => setExistingDamageNotes(e.target.value)}
              placeholder="e.g. Minor 2cm stone chip on passenger side door; slight rim scratch on rear left alloy wheel."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Photos at Handover */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Handover Condition Photos ({photoPreviews.length})
              </label>
              <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors border border-indigo-200">
                <span>+ Add Inspection Photo</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-300 group">
                  <img src={url} alt={`Handover ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1 rounded font-mono">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Rental Agreement Terms */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3 text-xs text-gray-700">
            <h5 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
              <FileCheck className="w-4 h-4 text-amber-700" />
              M-TRAVEL Digital Rental Agreement Terms
            </h5>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Authorized Driver:</strong> Vehicle shall be piloted solely by the verified registered hirer.</li>
              <li><strong>Speed Compliance:</strong> Hirer adheres strictly to Kenyan highway regulations (100 km/h ceiling).</li>
              <li><strong>Security Deposit:</strong> KES 10,000 deposit refundable upon return inspection minus fuel or damage.</li>
              <li><strong>Safety & Check-ins:</strong> Hirer affirms periodic possession check-ins and emergency SOS reporting.</li>
            </ul>

            <label className="flex items-start space-x-2.5 cursor-pointer pt-2 border-t border-amber-200 font-medium text-amber-950">
              <input
                type="checkbox"
                required
                checked={digitalAgreementSigned}
                onChange={e => setDigitalAgreementSigned(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
              />
              <span>Traveler has reviewed, countersigned, and accepted all rental conditions.</span>
            </label>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Traveler Countersignature Name
              </label>
              <input
                type="text"
                required
                value={travelerSignatureName}
                onChange={e => setTravelerSignatureName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Agency Dispatch Officer Name
              </label>
              <input
                type="text"
                required
                value={agencyAgentName}
                onChange={e => setAgencyAgentName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-900"
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
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5" />
              {isSubmitting ? 'Activating Rental...' : 'Complete Handover & Activate Rental 🔐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
