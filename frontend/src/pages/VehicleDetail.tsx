import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Star, ShieldCheck, Phone as PhoneIcon, Mail, Calendar, MapPin,
  Car, CheckCircle2, CreditCard, Lock, Headset, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Vehicle } from '@/types';
import { MOCK_VEHICLES } from '@/data/mockVehicles';
import { UberLiveTracker } from '@/components/tracking/UberLiveTracker';
import { createBooking, fetchVehicleBookedDates, fetchVehicleById } from '@/lib/supabaseClient';
import { payForBooking } from '@/lib/paymentService';
import { selectUser } from '@/store/slices/authSlice';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaLogo } from '@/components/ui/MpesaLogo';
import { sendNotification } from '@/lib/notificationService';
import { saveBooking, getStoredVehicles, getVehicleHireStatus } from '@/lib/bookingStore';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const { formatPrice } = useCurrency();

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState('18:00');
  const [pickupLocation, setPickupLocation] = useState('Nairobi CBD / Hotel');
  const [dropoffLocation, setDropoffLocation] = useState('Maasai Mara National Reserve');
  const [withDriver, setWithDriver] = useState(true);
  const [showTracker, setShowTracker] = useState(false);
  const [bookedRef, setBookedRef] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check stored vehicles & hire status in real-time
  const storedVehicles = getStoredVehicles();
  const storedMatch = storedVehicles.find((v) => v.id === id);
  const hireStatus = getVehicleHireStatus(id ?? '');
  const isLive = storedMatch ? storedMatch.isLive !== false : true;
  const isAvailableForHire = isLive && !hireStatus.isHired;

  // Query with Supabase direct fetch, stored vehicle support, and mock fallback
  const { data: vehicle } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      try {
        return (await api.get<Vehicle>(`/vehicles/${id}`)).data;
      } catch {
        // 1. Fetch directly from Supabase
        if (id) {
          const sbVehicle = await fetchVehicleById(id);
          if (sbVehicle) return sbVehicle;
        }

        // 2. Fall back to local store match
        if (storedMatch) {
          return {
            id: storedMatch.id,
            make: storedMatch.make,
            model: storedMatch.model,
            year: storedMatch.year,
            type: storedMatch.type as any,
            pricePerDay: String(storedMatch.pricePerDay),
            seats: storedMatch.seats,
            fuelType: storedMatch.fuelType as any,
            transmission: storedMatch.transmission as any,
            location: storedMatch.address,
            images: (storedMatch.images || []).map((url, idx) => ({ id: `img-${idx}`, url, isPrimary: idx === 0 })),
            isAvailable: storedMatch.isLive !== false && !hireStatus.isHired,
            ratingAverage: storedMatch.ratingAverage,
            ratingCount: storedMatch.ratingCount,
            hasInsurance: storedMatch.hasInsurance,
            owner: {
              id: storedMatch.ownerId,
              firstName: storedMatch.ownerName?.split(' ')[0] || 'Fleet',
              lastName: storedMatch.ownerName?.split(' ').slice(1).join(' ') || 'Host',
              email: storedMatch.ownerEmail,
            },
            ownerId: storedMatch.ownerId,
            ownerName: storedMatch.ownerName,
          } as any;
        }
        const found = MOCK_VEHICLES.find((v) => v.id === id);
        return found || MOCK_VEHICLES[0];
      }
    },
  });

  const fallbackVehicle = storedMatch ? {
    id: storedMatch.id,
    make: storedMatch.make,
    model: storedMatch.model,
    year: storedMatch.year,
    type: storedMatch.type as any,
    pricePerDay: storedMatch.pricePerDay,
    seats: storedMatch.seats,
    fuelType: storedMatch.fuelType as any,
    transmission: storedMatch.transmission as any,
    location: storedMatch.address,
    images: storedMatch.images,
    isAvailable: storedMatch.isLive !== false && !hireStatus.isHired,
    ratingAverage: storedMatch.ratingAverage,
    ratingCount: storedMatch.ratingCount,
    hasInsurance: storedMatch.hasInsurance,
    ownerId: storedMatch.ownerId,
    ownerName: storedMatch.ownerName,
  } as any : (MOCK_VEHICLES.find((v) => v.id === id) || MOCK_VEHICLES[0]);

  const targetVehicle = vehicle || fallbackVehicle;

  // Calculate days & pricing
  const days = Math.max(
    1,
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  const dailyPrice = Number(targetVehicle.pricePerDay);
  const vehicleTotal = days * dailyPrice;
  const driverCost = withDriver ? days * 2000 : 0;
  const insuranceCost = targetVehicle.hasInsurance ? 0 : days * 500;
  const grandTotal = vehicleTotal + driverCost + insuranceCost;

  // Fetch booked dates for this vehicle from Supabase
  const { data: bookedDates } = useQuery<string[]>({
    queryKey: ['booked-dates', id],
    queryFn: () => fetchVehicleBookedDates(id ?? ''),
    enabled: !!id,
    staleTime: 60_000,
  });

  const isDateBooked = (dateStr: string) =>
    (bookedDates ?? []).includes(dateStr);

  const handleBooking = async () => {
    if (!user?.id) {
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&reason=booking`, {
        state: {
          message: `Please sign in or create an account to book the ${targetVehicle.make} ${targetVehicle.model}.`,
          redirect: returnUrl,
        },
      });
      return;
    }

    if (paymentMethod === 'mpesa' && (!mpesaPhone || mpesaPhone.length < 9)) {
      setPaymentError('Please enter a valid M-Pesa phone number.');
      return;
    }

    if (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc)) {
      setPaymentError('Please enter complete card details.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    // 1. Create booking in database
    let bookingId = targetVehicle.id;
    let finalRef = `MT-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const booking = await createBooking({
        userId: user.id,
        vehicleId: targetVehicle.id,
        startDate: `${startDate}T${startTime}:00`,
        endDate: `${endDate}T${endTime}:00`,
        totalAmount: grandTotal,
        currency: 'KES',
      });
      bookingId = booking.id;
      finalRef = booking.booking_ref;
      setBookedRef(finalRef);
    } catch {
      setBookedRef(finalRef);
    }

    // 2. Process Payment (M-Pesa or Card)
    let paySuccess = false;
    if (paymentMethod === 'mpesa') {
      const payResult = await payForBooking(bookingId, mpesaPhone, grandTotal);
      paySuccess = payResult.success;
      if (!paySuccess) setPaymentError(payResult.message);
    } else {
      // Simulate Card Processing
      await new Promise((resolve) => setTimeout(resolve, 1200));
      paySuccess = true;
    }

    if (paySuccess) {
      setIsSuccess(true);

      // Save to centralized store for real-time dashboards
      saveBooking({
        bookingRef: finalRef,
        vehicleId: targetVehicle.id,
        vehicleMake: targetVehicle.make,
        vehicleModel: targetVehicle.model,
        vehicleName: `${targetVehicle.make} ${targetVehicle.model}`,
        vehicleImage: targetVehicle.images?.[0]?.url || (targetVehicle as any).imageUrl || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
        ownerId: targetVehicle.ownerId || targetVehicle.owner?.id || 'owner-1',
        driverName: targetVehicle.owner?.firstName ? `${targetVehicle.owner.firstName} ${targetVehicle.owner.lastName || ''}`.trim() : 'Samuel Omondi',
        touristId: user.id,
        touristEmail: user.email,
        touristName: `${user.firstName || 'Traveler'} ${user.lastName || ''}`.trim(),
        touristPhone: mpesaPhone || user.phone || '0712345678',
        startDate: `${startDate}T${startTime}:00`,
        endDate: `${endDate}T${endTime}:00`,
        totalAmount: grandTotal,
        paymentStatus: 'PAID',
        mpesaReceipt: `QK${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'CONFIRMED',
      });

      // 3. SEND REAL-TIME NOTIFICATION ALERTS TO OWNER, TOURIST & ADMIN
      const ownerRecipientId = targetVehicle.ownerId || targetVehicle.owner?.id;
      if (ownerRecipientId) {
        sendNotification({
          recipientId: ownerRecipientId,
          role: 'VEHICLE_OWNER',
          type: 'BOOKING_CREATED_OWNER',
          title: `New Booking Request: ${targetVehicle.make} ${targetVehicle.model}`,
          message: `Tourist ${user.firstName ?? 'Traveler'} booked your ${targetVehicle.make} ${targetVehicle.model} for ${days} day(s) (Ref: ${finalRef}).`,
          link: '/dashboard/owner',
        });
      }

      sendNotification({
        recipientId: user.id,
        role: 'TOURIST',
        type: 'BOOKING_CONFIRMED_TOURIST',
        title: `Trip Booked: ${targetVehicle.make} ${targetVehicle.model}`,
        message: `Your booking (Ref: ${finalRef}) has been confirmed! Total paid: KES ${grandTotal.toLocaleString()}.`,
        link: '/dashboard/bookings',
      });

      sendNotification({
        role: 'ADMIN',
        type: 'BOOKING_CREATED_ADMIN',
        title: `System Alert: Booking ${finalRef} Created`,
        message: `New booking for ${targetVehicle.make} ${targetVehicle.model} by ${user.email} (Amount: KES ${grandTotal.toLocaleString()}).`,
        link: '/dashboard/admin',
      });
    }

    setPaymentLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* LIVE UBER TRACKER MODAL IF BOOKED */}
      {showTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl">
            <UberLiveTracker
              vehicle={targetVehicle}
              bookingRef={bookedRef || 'MT-884920'}
              startDate={startDate}
              endDate={endDate}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              onClose={() => setShowTracker(false)}
            />
          </div>
        </div>
      )}

      {/* HEADER BREADCRUMB */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="cursor-pointer hover:text-amber-700 transition" onClick={() => navigate('/search')}>
          Vehicles
        </span>
        <span>/</span>
        <span className="text-amber-700 font-bold">
          {targetVehicle.make} {targetVehicle.model}
        </span>
      </div>

      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
        {/* LEFT COLUMN: VEHICLE DETAILS */}
        <div className="space-y-6">
          <div className="relative h-80 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group">
            <img
              src={targetVehicle.images[0]?.url || 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b'}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
              alt={`${targetVehicle.make} ${targetVehicle.model}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <span className="absolute top-4 left-4 rounded-full bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1 uppercase tracking-wider shadow-md">
              {targetVehicle.type}
            </span>
            <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs text-white bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-md">
              <MapPin className="h-3.5 w-3.5 text-amber-400" /> {targetVehicle.address || 'Nairobi, Kenya'}
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {targetVehicle.make} {targetVehicle.model}{' '}
              <span className="text-slate-500 text-xl font-normal">({targetVehicle.year})</span>
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-700 font-bold">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {targetVehicle.ratingAverage.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-medium">({targetVehicle.ratingCount} verified reviews)</span>
              {targetVehicle.hasInsurance && (
                <span className="flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal border border-teal/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Comprehensive Insurance Included
                </span>
              )}
            </div>
          </div>

          {/* SPECS GRID */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ['Seats', `${targetVehicle.seats} Passengers`],
              ['Fuel', targetVehicle.fuelType],
              ['Transmission', targetVehicle.transmission],
              ['Category', targetVehicle.type],
            ].map(([k, v]) => (
              <div key={k as string} className="card-luxe bg-white border border-slate-200 p-3 text-center rounded-xl shadow-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{k}</p>
                <p className="mt-1 font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          {/* STRICT DISINTERMEDIATION: M-TRAVEL OFFICIAL SUPPORT CONCIERGE */}
          <div className="card-luxe bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Headset className="h-4 w-4 text-amber-600" /> M-TRAVEL Official Concierge &amp; Support
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              For security and platform insurance protection, all inquiries, bookings, and driver requests are managed through M-TRAVEL Concierge.
            </p>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5 text-teal" /> 0207855558 / 0722374535
                </p>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5 font-medium">
                  <Mail className="h-3 w-3 text-amber-600" /> safari@jambo.africa
                </p>
              </div>
              <a
                href="https://wa.me/254791888840"
                target="_blank"
                rel="noreferrer"
                className="btn-primary !px-3.5 !py-1.5 text-xs flex items-center gap-1.5 shadow-sm"
              >
                Concierge Chat
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CALENDAR & DUAL PAYMENT GATEWAY CARD */}
        <div className="card-luxe bg-white border border-slate-200 h-fit p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="font-mono text-3xl font-bold text-amber-700">
                {formatPrice(dailyPrice)}
              </span>
              <span className="text-xs text-slate-500 font-semibold font-sans"> / day</span>
            </div>
            {hireStatus.isHired ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-800 border border-amber-300 animate-pulse">
                🚗 In Use (Hired)
              </span>
            ) : !isLive ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-mono font-bold text-rose-800 border border-rose-300">
                ⏸️ Offline
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-700 border border-emerald-300">
                🟢 Available Now
              </span>
            )}
          </div>

          {/* AVAILABILITY NOTICES */}
          {hireStatus.isHired && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Vehicle Currently On Active Trip
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                This vehicle is currently on a trip with a traveler until <strong>{hireStatus.returnDate || 'return'}</strong>. It is locked for booking until safely inspected and returned.
              </p>
            </div>
          )}

          {!hireStatus.isHired && !isLive && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 space-y-1">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                Vehicle Temporarily Offline
              </div>
              <p className="text-xs text-rose-800 leading-relaxed font-medium">
                This car is temporarily not available for hire at the moment upon host/admin request. Please explore other available cars or check back later.
              </p>
            </div>
          )}

          {/* SUCCESS BOOKING CONFIRMATION */}
          {isSuccess && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Booking Confirmed!
              </div>
              <p className="text-xs text-slate-800 font-medium">
                Ref: <span className="font-mono text-amber-700 font-bold">{bookedRef}</span>
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                Your payment has been processed. Notification sent to owner &amp; platform admin.
              </p>

              <button
                onClick={() => setShowTracker(true)}
                className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-2 shadow-sm"
              >
                <Car className="h-4 w-4" /> Monitor Ride Live (Uber View)
              </button>
            </div>
          )}

          {/* CALENDAR & TRIP DETAILS FORM */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" /> Select Travel Dates &amp; Time
            </h4>

            {/* PICKUP DATE & TIME */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pick-up Date</label>
                <input
                  type="date"
                  className={`input-field text-xs !py-2 ${isDateBooked(startDate) ? 'border-coral/60' : ''}`}
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {isDateBooked(startDate) && (
                  <p className="flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" /> Already booked — please choose another date
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pick-up Time</label>
                <input
                  type="time"
                  className="input-field text-xs !py-2"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* RETURN DATE & TIME */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Drop-off Date</label>
                <input
                  type="date"
                  className="input-field text-xs !py-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Drop-off Time</label>
                <input
                  type="time"
                  className="input-field text-xs !py-2"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* LOCATIONS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Pick-up Location</label>
              <input
                type="text"
                className="input-field text-xs !py-2"
                placeholder="e.g. Westlands, Nairobi Airport, Hotel"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Drop-off Location</label>
              <input
                type="text"
                className="input-field text-xs !py-2"
                placeholder="e.g. Maasai Mara, Diani, Nakuru"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
              />
            </div>

            {/* WITH DRIVER CHECKBOX */}
            <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-xl p-3 bg-slate-50/80 hover:bg-slate-100 transition shadow-sm">
              <input
                type="checkbox"
                checked={withDriver}
                onChange={(e) => setWithDriver(e.target.checked)}
                className="accent-amber-600 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Include Chauffeur Driver</span>
                <span className="text-[10px] text-slate-500 font-semibold">{formatPrice(2000)} / day allowance</span>
              </div>
            </label>
          </div>

          {/* COST SUMMARY */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>
                Vehicle ({days} day{days > 1 ? 's' : ''}):
              </span>
              <span className="font-mono font-bold text-slate-900">{formatPrice(vehicleTotal)}</span>
            </div>
            {withDriver && (
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Driver Chauffeur:</span>
                <span className="font-mono font-bold text-slate-900">{formatPrice(driverCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 font-medium">
              <span>M-Pesa / Card Security &amp; Protection:</span>
              <span className="font-mono font-bold text-emerald-700">Included</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-amber-700">
              <span className="text-slate-900">Total Payable</span>
              <span className="font-mono text-lg text-amber-700">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* PAYMENT GATEWAY SELECTOR (M-PESA OR CARD) */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
              Select Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'mpesa'
                    ? 'border-[#00A859] bg-[#00A859]/10 text-emerald-700 shadow-sm ring-1 ring-[#00A859]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MpesaLogo variant="icon" />
                <span>M-PESA</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-500'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span>Card (Visa/MC)</span>
              </button>
            </div>

            {/* MOBILE CHECKOUT FORM */}
            {paymentMethod === 'mpesa' && (
              <div className="space-y-1.5 rounded-xl border border-emerald-300 bg-emerald-50/50 p-3">
                <label className="block text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5" /> Mobile Number for Reservation
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0712345678 or 254712345678"
                  className="input-field text-xs !py-2 bg-white focus:border-emerald-500 font-mono text-slate-900 font-bold"
                  value={mpesaPhone}
                  onChange={(e) => {
                    setMpesaPhone(e.target.value);
                    setPaymentError(null);
                  }}
                />
                <p className="text-[10px] text-slate-600 font-medium">
                  A secure authorization prompt will be sent to your phone to confirm reservation of {formatPrice(grandTotal)}
                </p>
              </div>
            )}

            {/* CREDIT CARD FORM */}
            {paymentMethod === 'card' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-amber-600" /> Encrypted Card Checkout
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Visa / Mastercard / Amex</span>
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className="input-field text-xs !py-2 bg-white"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Card Number (4000 0000 0000 0000)"
                  className="input-field text-xs !py-2 font-mono bg-white"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="input-field text-xs !py-2 font-mono bg-white"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVC"
                    className="input-field text-xs !py-2 font-mono bg-white"
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {paymentError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
          {!isAvailableForHire ? (
            hireStatus.isHired ? (
              <button
                disabled
                className="w-full text-sm !py-3 font-bold rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 flex items-center justify-center gap-2 shadow-none"
              >
                <Lock className="h-4 w-4 text-slate-400" />
                Vehicle Currently In Use (Returns {hireStatus.returnDate || 'Soon'})
              </button>
            ) : (
              <button
                disabled
                className="w-full text-sm !py-3 font-bold rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 flex items-center justify-center gap-2 shadow-none"
              >
                <Lock className="h-4 w-4 text-slate-400" />
                Vehicle Unavailable for Hire at the Moment
              </button>
            )
          ) : !user ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 space-y-1 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Lock className="h-4 w-4 text-amber-700" />
                  <span>Account Required to Book</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Please sign in or create an account to reserve this {targetVehicle.make} {targetVehicle.model}. You will return here immediately after signing in to finalize your booking.
                </p>
              </div>
              <button
                onClick={() => {
                  const returnUrl = location.pathname + location.search;
                  navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&reason=booking`, {
                    state: {
                      message: `Please sign in or create an account to book the ${targetVehicle.make} ${targetVehicle.model}.`,
                      redirect: returnUrl,
                    },
                  });
                }}
                className="btn-primary w-full text-sm !py-3.5 font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" /> Sign In / Create Account to Book
              </button>
            </div>
          ) : paymentMethod === 'mpesa' ? (
            <MpesaLogo
              label={`Confirm & Secure Reservation (${formatPrice(grandTotal)})`}
              onClick={handleBooking}
              loading={paymentLoading}
            />
          ) : (
            <button
              onClick={handleBooking}
              disabled={paymentLoading}
              className="btn-primary w-full text-sm !py-3 font-bold shadow-md flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing Card Payment…
                </span>
              ) : (
                <span className="flex items-center gap-2 font-display">
                  <CreditCard className="h-4 w-4" /> Pay {formatPrice(grandTotal)} via Card
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
