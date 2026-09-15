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
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-white/15 bg-ink-100/90 p-6 shadow-3d-md backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-mtravel-lightGold font-bold">
            Live Booking & Transport Status
          </span>
          <h3 className="font-serif text-xl font-bold text-bone flex items-center gap-2">
            <Navigation className="h-5 w-5 text-mtravel-gold" /> Check Trip & Ride Status
          </h3>
        </div>

        <MpesaLogo variant="badge" />
      </div>

      <form onSubmit={handleTrack} className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-bone/40" />
          <input
            type="text"
            required
            placeholder="Enter Booking Ref (e.g. MT-884920 or M-PESA Code)"
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value)}
            className="input-field text-xs !py-3.5 !pl-11 font-mono uppercase tracking-wider"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-xs !py-3.5 !px-6 font-bold shadow-glow flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Track Transport</span>
            </>
          )}
        </button>
      </form>

      {statusResult && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-ink-100 to-ink-50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono text-bone/50 uppercase">Booking Reference</span>
              <p className="font-mono text-lg font-bold text-mtravel-lightGold">{statusResult.ref}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="h-3.5 w-3.5" /> {statusResult.status}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-bone flex items-center gap-1.5">
                <Car className="h-4 w-4 text-mtravel-gold" /> {statusResult.vehicle}
              </p>
              <p className="text-bone/70 flex items-center gap-1.5 font-mono text-[11px]">
                <span>Plate:</span> <span className="font-bold text-bone bg-white/10 px-2 py-0.5 rounded">{statusResult.plate}</span>
              </p>
              <p className="text-bone/70 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal" /> {statusResult.driver} —{' '}
                <a href={`tel:${statusResult.driverPhone}`} className="text-teal font-mono font-bold hover:underline">
                  {statusResult.driverPhone}
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-bone/70 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-marigold shrink-0 mt-0.5" />
                <span>
                  <strong>Pick-up:</strong> {statusResult.pickup}
                </span>
              </p>
              <p className="text-bone/70 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Destination:</strong> {statusResult.destination}
                </span>
              </p>
              <p className="text-bone/70 flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="h-3.5 w-3.5 text-mtravel-lightGold" />
                <span>ETA: <strong className="text-mtravel-lightGold">{statusResult.eta}</strong></span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-bone/60">
            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
              <ShieldCheck className="h-3.5 w-3.5" /> {statusResult.paymentStatus} (Ref: {statusResult.paymentRef})
            </span>
            <button
              onClick={() => alert(`Connecting live call to ${statusResult.driver}...`)}
              className="text-mtravel-lightGold font-bold hover:underline flex items-center gap-1"
            >
              <Phone className="h-3 w-3" /> Call Chauffeur Driver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
