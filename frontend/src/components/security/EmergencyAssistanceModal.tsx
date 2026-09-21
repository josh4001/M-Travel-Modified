import React, { useState, useEffect } from 'react';
import {
  X, AlertOctagon, PhoneCall, MessageSquare,
  CheckCircle2, Loader2, Navigation
} from 'lucide-react';
import { StoredBooking } from '@/lib/bookingStore';
import { reportIncident, recordTripCheckin } from '@/lib/rentalLifecycleStore';

interface EmergencyAssistanceModalProps {
  booking: StoredBooking;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmergencyAssistanceModal: React.FC<EmergencyAssistanceModalProps> = ({
  booking,
  onClose,
  onSuccess
}) => {
  const [emergencyType, setEmergencyType] = useState<
    'BREAKDOWN' | 'ACCIDENT' | 'MEDICAL' | 'SECURITY' | 'FLAT_TYRE'
  >('BREAKDOWN');
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('Detecting your location coordinates...');
  const [hasSent, setHasSent] = useState(false);

  // Auto-fetch location when emergency modal opens
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setIsLocating(false);
          setLocationStatus(`Location Locked: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`);
        },
        () => {
          setIsLocating(false);
          setLocationStatus('Location unavailable or permission denied. Please state your location below.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStatus('Browser does not support geolocation.');
    }
  }, []);

  const handleTriggerSOS = () => {
    const coordsText = coords ? `\n📍 Location Coordinates: https://maps.google.com/?q=${coords.lat},${coords.lng}` : '';
    const emergencyMsg = `🚨 *EMERGENCY SOS ALERT - M-TRAVEL ASSISTANCE REQUIRED* 🚨\n\n` +
      `*Booking Ref:* ${booking.bookingRef}\n` +
      `*Vehicle:* ${booking.vehicleName}\n` +
      `*Traveler:* ${booking.touristName} (${booking.touristPhone})\n` +
      `*Emergency Type:* ${emergencyType}\n` +
      `*Situation Details:* ${details || 'Urgent roadside assistance requested'}${coordsText}\n\n` +
      `_Dispatched via M-Travel 24/7 Concierge Incident Management_`;

    // 1. Report critical incident in store
    reportIncident({
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      vehicleId: booking.vehicleId || 'v-unknown',
      vehicleName: booking.vehicleName,
      travelerId: booking.touristId,
      travelerName: booking.touristName,
      travelerPhone: booking.touristPhone,
      type: emergencyType === 'ACCIDENT' ? 'ACCIDENT' : emergencyType === 'BREAKDOWN' ? 'BREAKDOWN' : 'OTHER',
      severity: 'CRITICAL',
      description: `[EMERGENCY SOS] ${details || emergencyType} reported by traveler.`,
      locationDescription: coords ? `Lat ${coords.lat}, Lng ${coords.lng}` : 'Manual coordinates pending',
      latitude: coords?.lat,
      longitude: coords?.lng,
      photos: [],
      emergencyContactCalled: true
    });

    // 2. Also record SOS trip checkin
    recordTripCheckin({
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      travelerId: booking.touristId,
      travelerName: booking.touristName,
      type: 'EMERGENCY_SOS',
      latitude: coords?.lat,
      longitude: coords?.lng,
      notes: `EMERGENCY SOS TRIGGERED: ${emergencyType}`
    });

    // 3. Open WhatsApp emergency line (M-TRAVEL 24/7 hotline: 0791888840 / +254791888840)
    const waUrl = `https://wa.me/254791888840?text=${encodeURIComponent(emergencyMsg)}`;
    window.open(waUrl, '_blank');

    setHasSent(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-600">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl animate-pulse">
              <AlertOctagon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">SOS EMERGENCY ASSISTANCE</h3>
              <p className="text-xs text-red-100">Direct 24/7 Hotline & Roadside Response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {hasSent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Emergency Alert Dispatched!</h4>
                <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
                  Our 24/7 dispatch team and vehicle operations lead have received your coordinates and are coordinating assistance.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="tel:0722374535"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 text-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  Direct Call: Amos (0722374535)
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Emergency Type Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Select Nature of Emergency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BREAKDOWN', label: '🚗 Mechanical Breakdown' },
                    { id: 'ACCIDENT', label: '💥 Road Accident' },
                    { id: 'FLAT_TYRE', label: '🛞 Flat Tyre / Stuck' },
                    { id: 'SECURITY', label: '👮 Security / Police' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEmergencyType(opt.id as any)}
                      className={`p-2.5 text-xs font-bold rounded-xl border text-left transition-all ${
                        emergencyType === opt.id
                          ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geolocation Status */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className={`p-2 rounded-lg ${coords ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Incident Location</span>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{locationStatus}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Situation Details & Landmark
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="e.g. Engine overheated near Naivasha toll station; safely pulled over onto the shoulder."
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleTriggerSOS}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black rounded-xl shadow-xl shadow-red-600/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <MessageSquare className="w-5 h-5" />
                  TRANSMIT EMERGENCY SOS (WHATSAPP 24/7)
                </button>

                <a
                  href="tel:0722374535"
                  className="w-full py-2.5 border border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Or Call Direct: Amos 0722374535 / Office 0207855558
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
