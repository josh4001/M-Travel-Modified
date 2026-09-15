import { useState, useEffect } from 'react';
import {
  Car, MapPin, Phone, MessageSquare, Shield, Navigation,
  CheckCircle2, Star, X, Map, Video, Compass, Radio
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { TourTimeline } from '@/components/tracking/TourTimeline';
import { LiveVehicleTrackingVideo } from '@/components/tracking/LiveVehicleTrackingVideo';
import { UberStreetLiveMap } from '@/components/tracking/UberStreetLiveMap';
import { NavigableKenyaUberMap } from '@/components/tracking/NavigableKenyaUberMap';
import { TravellerLiveMap } from '@/components/tracking/TravellerLiveMap';

interface UberLiveTrackerProps {
  vehicle: Vehicle;
  bookingRef: string;
  tripId?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  onClose?: () => void;
}

export function UberLiveTracker({
  vehicle,
  bookingRef,
  tripId,
  pickupLocation = 'Westlands, Nairobi',
  dropoffLocation = 'Maasai Mara National Reserve',
  onClose,
}: UberLiveTrackerProps) {
  const [progress, setProgress] = useState(35); // 0 to 100%
  const [speed, setSpeed] = useState(64);
  const [trackerMode, setTrackerMode] = useState<'realtime_gps' | 'kenya_gps' | 'uber_vector' | 'video_motion'>('realtime_gps');

  // Simulate live movement fallback for progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setSpeed(0);
          return 100;
        }
        const next = prev + 1.5;
        setSpeed(Math.floor(58 + Math.random() * 18));
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const driverName = `${vehicle.owner.firstName} ${vehicle.owner.lastName}`;
  const driverPhone = vehicle.owner.phone || '+254 712 345 678';
  const plateNumber = vehicle.plateNumber || `KDA ${Math.floor(100 + Math.random() * 899)}X`;
  const effectiveTripId = tripId || bookingRef;

  return (
    <div className="glass-card-3d overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal via-emerald-500 to-marigold shadow-glow">
            <Car className="h-5 w-5 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-900 text-base">Uber-Style Live Ride Monitor</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-600 border border-emerald-500/30 font-bold animate-pulse">
                ● Live GPS Kenya
              </span>
            </div>
            <p className="text-xs text-slate-500">Booking #{bookingRef}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TRACKING MODE SWITCHER (REAL-TIME SUPABASE GPS / NAVIGABLE KENYA GPS MAP / UBER VECTOR / 3D VIDEO) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 border border-slate-300 text-xs font-semibold">
            <button
              onClick={() => setTrackerMode('realtime_gps')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                trackerMode === 'realtime_gps' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="h-3.5 w-3.5" /> Real-time GPS
            </button>
            <button
              onClick={() => setTrackerMode('kenya_gps')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                trackerMode === 'kenya_gps' ? 'bg-slate-900 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="h-3.5 w-3.5" /> Scenic Map
            </button>
            <button
              onClick={() => setTrackerMode('uber_vector')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                trackerMode === 'uber_vector' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="h-3.5 w-3.5" /> Vector Route
            </button>
            <button
              onClick={() => setTrackerMode('video_motion')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                trackerMode === 'video_motion' ? 'bg-teal-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="h-3.5 w-3.5" /> 3D Drive
            </button>
          </div>

          {onClose && (
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* TOP LIVE TRACKING DISPLAY (TRAVELLER LIVE MAP / NAVIGABLE KENYA LEAFLET MAP / UBER MAP / 3D VIDEO) */}
      <div className="p-4 pb-0">
        {trackerMode === 'realtime_gps' ? (
          <TravellerLiveMap
            tripId={effectiveTripId}
            vehicleModel={`${vehicle.make} ${vehicle.model}`}
            plateNumber={plateNumber}
            driverName={driverName}
            vehicleType={vehicle.type}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            height="400px"
          />
        ) : trackerMode === 'kenya_gps' ? (
          <NavigableKenyaUberMap
            plateNumber={plateNumber}
            vehicleModel={`${vehicle.make} ${vehicle.model}`}
            speed={speed}
            progress={progress}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            driverName={driverName}
            height="380px"
          />
        ) : trackerMode === 'uber_vector' ? (
          <UberStreetLiveMap
            plateNumber={plateNumber}
            vehicleModel={`${vehicle.make} ${vehicle.model}`}
            speed={speed}
            progress={progress}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            etaMinutes={3}
          />
        ) : (
          <LiveVehicleTrackingVideo
            vehicleModel={`${vehicle.make} ${vehicle.model}`}
            plateNumber={plateNumber}
            speed={speed}
            progress={progress}
            driverName={driverName}
          />
        )}
      </div>

      {/* TRIP STATUS PROGRESS BAR */}
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-900">
            <span className="flex items-center gap-1 text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" /> Driver Assigned
            </span>
            <span className={progress >= 30 ? 'text-teal font-bold' : 'text-slate-400'}>En Route</span>
            <span className={progress >= 70 ? 'text-teal font-bold' : 'text-slate-400'}>On Trip</span>
            <span className={progress >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Arrived</span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal via-amber-500 to-emerald-500 transition-all duration-700 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* DRIVER & VEHICLE DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-marigold to-coral p-0.5">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-amber-400 text-lg">
                {driverName.charAt(0)}
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-slate-900 text-sm">{driverName}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center text-amber-600 gap-0.5 font-semibold">
                  <Star className="h-3 w-3 fill-amber-500" /> 4.9
                </span>
                <span>• 340 Trips</span>
                <span className="rounded bg-teal/20 px-1.5 py-0.5 text-[10px] font-mono text-teal font-semibold">Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div>
              <span className="block text-[10px] text-slate-500">Vehicle</span>
              <span className="font-display font-semibold text-slate-900 text-sm">
                {vehicle.make} {vehicle.model}
              </span>
              <span className="block font-mono text-xs text-amber-600 font-bold">{plateNumber}</span>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${driverPhone}`}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a
                href={`https://wa.me/${driverPhone.replace(/\+/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-teal/40 bg-teal/10 px-3 py-2 text-xs font-semibold text-teal hover:bg-teal/20 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </a>
            </div>
          </div>
        </div>

        {/* TRIP ROUTE INFORMATION */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-500 mb-1">Pick-up Location</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{pickupLocation}</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[10px] text-slate-500 mb-1">Destination</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Navigation className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{dropoffLocation}</span>
            </div>
          </div>
        </div>

        {/* TOUR TIMELINE WITH MULTI-STOP PROGRESS */}
        <TourTimeline
          currentStatus={progress >= 100 ? 'TRIP_COMPLETED' : progress >= 30 ? 'TRIP_IN_PROGRESS' : 'DRIVING_TO_PICKUP'}
          pickupLocation={pickupLocation}
          destinationLocation={dropoffLocation}
        />

        {/* SAFETY & SOS */}
        <div className="flex items-center justify-between rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>24/7 M-TRAVEL Emergency Roadside & Trip Safety active</span>
          </div>
          <button
            onClick={() => alert('Emergency SOS Alert sent to M-TRAVEL Support and local authorities!')}
            className="rounded-lg bg-red-600 px-3 py-1 text-white font-bold text-[11px] hover:bg-red-700 transition shadow-sm"
          >
            SOS
          </button>
        </div>
      </div>
    </div>
  );
}
