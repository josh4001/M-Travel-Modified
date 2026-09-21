import React from 'react';

interface OpenCvVehicleTrackerProps {
  vehicleName?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  bookingRef?: string;
  bookingId?: string;
  touristName?: string;
  role?: 'tourist' | 'owner' | 'admin';
  pickup?: string;
  destination?: string;
  onClose?: () => void;
}

export const OpenCvVehicleTracker: React.FC<OpenCvVehicleTrackerProps> = (_props) => {
  return null;
};
