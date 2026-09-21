import React from 'react';

interface TravellerLiveMapProps {
  tripId?: string;
  vehicleModel?: string;
  plateNumber?: string;
  driverName?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
  height?: string;
  userCoords?: [number, number] | null;
  driverLiveCoords?: [number, number] | null;
  driverSpeed?: number;
  driverHeading?: number;
  routeCoordinates?: [number, number][];
  onRouteCalculated?: (coords: [number, number][], eta: any) => void;
}

export const TravellerLiveMap: React.FC<TravellerLiveMapProps> = (_props) => {
  return null;
};
