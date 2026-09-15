import { CheckCircle2, Clock, MapPin, Navigation, Coffee, Flag, Compass } from 'lucide-react';
import type { DriverTripStatus } from '@/lib/driverGpsService';

export interface TourTimelineStep {
  key: string;
  label: string;
  description: string;
  icon: any;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  timestamp?: string;
}

interface TourTimelineProps {
  currentStatus: DriverTripStatus;
  pickupLocation?: string;
  destinationLocation?: string;
  onUpdateStep?: (stepKey: string) => void;
  isDriver?: boolean;
}

export function TourTimeline({
  currentStatus,
  pickupLocation = 'Nairobi Pickup Point',
  destinationLocation = 'Maasai Mara National Reserve',
  onUpdateStep,
  isDriver = false,
}: TourTimelineProps) {
  // Map DriverTripStatus to completed step index
  const getStepIndex = (status: DriverTripStatus): number => {
    switch (status) {
      case 'BOOKING_ASSIGNED': return 1;
      case 'DRIVING_TO_PICKUP': return 2;
      case 'WAITING_FOR_TOURIST': return 3;
      case 'TRIP_STARTED': return 4;
      case 'TRIP_IN_PROGRESS': return 5;
      case 'TRIP_COMPLETED': return 7;
      default: return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  const steps: TourTimelineStep[] = [
    {
      key: 'CONFIRMED',
      label: 'Booking Confirmed',
      description: 'Safari & vehicle booking locked in system',
      icon: CheckCircle2,
      status: activeIndex >= 0 ? 'COMPLETED' : 'PENDING',
      timestamp: '08:00 AM',
    },
    {
      key: 'ASSIGNED',
      label: 'Driver Assigned',
      description: 'Chauffeur driver confirmed for trip',
      icon: Compass,
      status: activeIndex >= 1 ? 'COMPLETED' : activeIndex === 0 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '08:15 AM',
    },
    {
      key: 'EN_ROUTE',
      label: 'Driver En Route',
      description: 'Vehicle driving to tourist pickup point',
      icon: Navigation,
      status: activeIndex >= 2 ? 'COMPLETED' : activeIndex === 1 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '08:30 AM',
    },
    {
      key: 'PICKED_UP',
      label: 'Tourist Picked Up',
      description: `Passengers onboard at ${pickupLocation}`,
      icon: MapPin,
      status: activeIndex >= 3 ? 'COMPLETED' : activeIndex === 2 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '08:45 AM',
    },
    {
      key: 'STOP_1',
      label: 'Landmark / Viewpoint Stop',
      description: 'Great Rift Valley Viewpoint photo stop',
      icon: Compass,
      status: activeIndex >= 4 ? 'COMPLETED' : activeIndex === 3 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '10:30 AM',
    },
    {
      key: 'LUNCH',
      label: 'Lunch & Refreshment Break',
      description: 'Narok Town Curio & Lunch Stop',
      icon: Coffee,
      status: activeIndex >= 5 ? 'COMPLETED' : activeIndex === 4 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '01:00 PM',
    },
    {
      key: 'DESTINATION',
      label: 'Arrived at Destination',
      description: `Reached ${destinationLocation}`,
      icon: Flag,
      status: activeIndex >= 6 ? 'COMPLETED' : activeIndex === 5 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '03:30 PM',
    },
    {
      key: 'COMPLETED',
      label: 'Tour Completed',
      description: 'Safe arrival & key check-in completed',
      icon: CheckCircle2,
      status: activeIndex >= 7 ? 'COMPLETED' : activeIndex === 6 ? 'IN_PROGRESS' : 'PENDING',
      timestamp: '04:00 PM',
    },
  ];

  return (
    <div className="card-luxe bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700">
            <MapPin className="h-3 w-3" /> Tour Progress Timeline
          </span>
          <h3 className="text-sm font-bold text-slate-900 font-display">Multi-Stop Journey Progress</h3>
        </div>
        <span className="rounded-full bg-teal/10 border border-teal/30 px-3 py-1 text-[11px] font-bold text-teal flex items-center gap-1.5 font-mono">
          <Clock className="h-3 w-3 animate-pulse" /> Live Tracking Active
        </span>
      </div>

      {/* TIMELINE LIST */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = step.status === 'COMPLETED';
          const isCurrent = step.status === 'IN_PROGRESS';

          return (
            <div key={step.key} className="relative flex items-start justify-between group">
              {/* TIMELINE CIRCLE BADGE */}
              <div
                className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-all ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'border-amber-500 bg-amber-500 text-slate-950 animate-bounce shadow-sm font-bold'
                    : 'border-slate-300 bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </div>

              {/* STEP CONTENT */}
              <div className="flex-1 pl-2">
                <div className="flex items-baseline justify-between">
                  <h4
                    className={`text-xs font-bold ${
                      isDone
                        ? 'text-slate-900'
                        : isCurrent
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[10px] font-mono text-slate-500 font-medium">{step.timestamp}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">{step.description}</p>
              </div>

              {/* DRIVER ACTION BUTTON TO ADVANCE STEP */}
              {isDriver && isCurrent && onUpdateStep && (
                <button
                  onClick={() => onUpdateStep(step.key)}
                  className="ml-2 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                >
                  <span>Mark Step Complete</span>
                  <CheckCircle2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
