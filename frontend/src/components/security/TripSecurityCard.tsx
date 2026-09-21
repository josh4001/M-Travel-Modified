import React, { useState, useEffect } from 'react';
import {
  Shield, CheckCircle2, AlertOctagon,
  AlertTriangle, Clock, History,
  ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { StoredBooking, isTripBooking } from '@/lib/bookingStore';
import {
  TripCheckin,
  getCheckinsByBookingId,
  recordTripCheckin,
  evaluateTripOverdueStatus,
  TripOverdueStatus
} from '@/lib/rentalLifecycleStore';
import { EmergencyAssistanceModal } from './EmergencyAssistanceModal';
import { IncidentReportModal } from './IncidentReportModal';

interface TripSecurityCardProps {
  booking: StoredBooking;
  isTravelerFacing?: boolean;
}

export const TripSecurityCard: React.FC<TripSecurityCardProps> = ({
  booking,
  isTravelerFacing: _isTravelerFacing = true
}) => {
  // Security suite applies exclusively to vehicle rentals, not trip/tour bookings
  if (isTripBooking(booking)) {
    return null;
  }
  const [checkins, setCheckins] = useState<TripCheckin[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const overdueStatus: TripOverdueStatus = evaluateTripOverdueStatus(booking);

  const loadCheckins = () => {
    setCheckins(getCheckinsByBookingId(booking.id));
  };

  useEffect(() => {
    loadCheckins();

    const handleCheckinEvent = () => loadCheckins();
    window.addEventListener('mt_trip_checkin', handleCheckinEvent);
    return () => window.removeEventListener('mt_trip_checkin', handleCheckinEvent);
  }, [booking.id]);

  const latestCheckin = checkins[0];

  // Possession Affirmation Check-in
  const handlePossessionCheckin = () => {
    setIsCheckingIn(true);
    setTimeout(() => {
      recordTripCheckin({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        travelerId: booking.touristId,
        travelerName: booking.touristName,
        type: 'POSSESSION',
        notes: 'Affirmed active possession and normal driving status.'
      });
      setIsCheckingIn(false);
      setFeedbackMessage('✓ Possession affirmed! Safe travels.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-indigo-500/30 space-y-4">
      {/* Top Banner: Status + Return Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-white">Active Rental Security Suite</h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                Verified &amp; Protected
              </span>
            </div>
            <p className="text-xs text-gray-300">
              Vehicle: <span className="font-semibold text-white">{booking.vehicleName}</span> • Ref: <span className="font-mono text-amber-300">{booking.bookingRef}</span>
            </p>
          </div>
        </div>

        {/* Overdue / Countdown Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${overdueStatus.badgeClass}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{overdueStatus.label}</span>
        </div>
      </div>

      {/* Critical Warning if Overdue */}
      {overdueStatus.isOverdue && (
        <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">RETURN TIME HAS PASSED</span>
            Please return vehicle to pickup station or contact agency immediately at 0722374535 to avoid late return penalty charges.
          </div>
        </div>
      )}

      {/* Interactive Possession Affirmation Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handlePossessionCheckin}
          disabled={isCheckingIn}
          className="w-full p-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Renter Status Check-In
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-sm font-bold text-white">
            {isCheckingIn ? 'Affirming...' : "✓ I'm in safe possession of vehicle"}
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">
            Affirm vehicle possession and normal driving condition to host and agency.
          </p>
        </button>
      </div>

      {/* Safety & Emergency Assistance Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SOS Button */}
        <button
          type="button"
          onClick={() => setShowEmergencyModal(true)}
          className="py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4 animate-pulse" />
          🆘 EMERGENCY ASSISTANCE (SOS)
        </button>

        {/* Incident Button */}
        <button
          type="button"
          onClick={() => setShowIncidentModal(true)}
          className="py-3 px-4 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Report Incident / Breakdown
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-300 text-center animate-fade-in">
          {feedbackMessage}
        </div>
      )}

      {/* Check-in Log / Latest Check-in Footer */}
      <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {latestCheckin ? (
              <>
                Last check-in:{' '}
                <strong className="text-gray-200">
                  {new Date(latestCheckin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>{' '}
                ({latestCheckin.type.toLowerCase()})
              </>
            ) : (
              'Handover completed. Awaiting first traveler check-in.'
            )}
          </span>
        </div>

        {checkins.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            {checkins.length} check-in{checkins.length === 1 ? '' : 's'}
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Check-in History Dropdown */}
      {showHistory && (
        <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20 space-y-2 max-h-48 overflow-y-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Trip Verification Timeline
          </span>
          {checkins.map(chk => (
            <div key={chk.id} className="text-xs p-2 rounded-lg bg-white/5 border border-white/5 flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-gray-200 block">
                  {chk.type === 'POSSESSION' ? '✓ Possession Affirmed' : chk.type === 'LOCATION' ? '📍 Station Check-In' : '🆘 SOS Emergency Alert'}
                </span>
                <span className="text-[11px] text-gray-400">
                  {chk.locationName || chk.notes}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                {new Date(chk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showEmergencyModal && (
        <EmergencyAssistanceModal
          booking={booking}
          onClose={() => setShowEmergencyModal(false)}
        />
      )}

      {showIncidentModal && (
        <IncidentReportModal
          booking={booking}
          onClose={() => setShowIncidentModal(false)}
          onIncidentReported={() => {
            setFeedbackMessage('Incident reported. Operations team notified.');
            setTimeout(() => setFeedbackMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
