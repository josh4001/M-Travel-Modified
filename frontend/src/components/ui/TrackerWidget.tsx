import React, { useState } from 'react';
import { Search, MapPin, Car, Phone, ShieldCheck, CheckCircle2, Clock, Navigation } from 'lucide-react';
import { MpesaLogo } from './MpesaLogo';

export const TrackerWidget: React.FC = () => {
  const [bookingRef, setBookingRef] = useState('');
  const [statusResult, setStatusResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRef.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setStatusResult({
        ref: bookingRef.toUpperCase(),
        vehicle: 'Toyota Land Cruiser 4x4 V8 Safari Edition',
        plate: 'KDA 789X',
        driver: 'John Kamau (Certified Safari Guide)',
        driverPhone: '0722 998 811',
        pickup: 'Nairobi JKIA Airport (Terminal 1A)',
        destination: 'Maasai Mara Sopa Lodge',
        status: 'Confirmed & En Route',
        eta: '35 mins away',
        paymentStatus: 'Paid via M-PESA Express',
        paymentRef: 'QK89X201',
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-card">
      <div className="flex items-center justify-between border-b border-slate-150 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
            Live Booking & Transport Status
          </span>
          <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-amber-600" /> Check Trip & Ride Status
          </h3>
        </div>

        <MpesaLogo variant="badge" />
      </div>

      <form onSubmit={handleTrack} className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            required
            placeholder="Enter Booking Ref (e.g. MT-884920 or M-PESA Code)"
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value)}
            className="input-field text-xs !py-3.5 !pl-11 font-mono uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-xs !py-3.5 !px-6 font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Track Transport</span>
            </>
          )}
        </button>
      </form>

      {statusResult && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Booking Reference</span>
              <p className="font-mono text-lg font-bold text-slate-900">{statusResult.ref}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> {statusResult.status}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-2">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Car className="h-4 w-4 text-amber-600" /> {statusResult.vehicle}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5 font-mono text-[11px]">
                <span>Plate:</span> <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">{statusResult.plate}</span>
              </p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-600" /> {statusResult.driver} —{' '}
                <a href={`tel:${statusResult.driverPhone}`} className="text-teal-700 font-mono font-bold hover:underline">
                  {statusResult.driverPhone}
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pick-up:</strong> {statusResult.pickup}
                </span>
              </p>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Destination:</strong> {statusResult.destination}
                </span>
              </p>
              <p className="text-slate-600 flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>ETA: <strong className="text-slate-900">{statusResult.eta}</strong></span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700 font-bold font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {statusResult.paymentStatus} (Ref: {statusResult.paymentRef})
            </span>
            <button
              onClick={() => alert(`Connecting live call to ${statusResult.driver}...`)}
              className="text-amber-700 font-bold hover:underline flex items-center gap-1"
            >
              <Phone className="h-3 w-3" /> Call Chauffeur Driver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
