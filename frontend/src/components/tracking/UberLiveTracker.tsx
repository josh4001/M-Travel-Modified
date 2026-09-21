export interface TrackingVehicle {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  type?: string;
  seats?: number;
  seatingCapacity?: number;
  pricePerDay?: number | string;
  dailyRate?: number | string;
  plateNumber?: string;
  images?: any[];
  owner?: any;
  driverName?: string;
  [key: string]: any;
}

interface UberLiveTrackerProps {
  vehicle?: any;
  bookingRef?: string;
  tripId?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
  viewerRole?: string;
  onClose?: () => void;
  [key: string]: any;
}

export function UberLiveTracker(_props: UberLiveTrackerProps) {
  return null;
}
