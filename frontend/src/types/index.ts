export interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: string;
  hasInsurance: boolean;
  latitude: number;
  longitude: number;
  address?: string;
  ratingAverage: number;
  ratingCount: number;
  images: { id: string; url: string; isPrimary: boolean }[];
  owner: { id: string; firstName: string; lastName: string; avatarUrl?: string; phone?: string };
  distanceKm?: number;
  plateNumber?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  status: string;
  vehicle: Vehicle;
}
