import React from 'react';

interface UberStreetLiveMapProps {
  plateNumber?: string;
  vehicleModel?: string;
  speed?: number;
  progress?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  etaMinutes?: number;
}

export const UberStreetLiveMap: React.FC<UberStreetLiveMapProps> = (_props) => {
  return null;
};
