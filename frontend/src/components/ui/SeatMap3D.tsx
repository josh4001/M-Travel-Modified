import { useState } from 'react';
import { motion } from 'framer-motion';
import { Armchair, CheckCircle2, Ticket } from 'lucide-react';

interface Seat {
  id: string;
  number: string;
  status: 'available' | 'booked' | 'selected';
  price: number;
}

export function SeatMap3D() {
  const [selectedSeat, setSelectedSeat] = useState<string | null>('12B');

  const seats: Seat[] = [
    { id: '1A', number: '01', status: 'booked', price: 1500 },
    { id: '1B', number: '02', status: 'available', price: 1500 },
    { id: '2A', number: '03', status: 'available', price: 1500 },
    { id: '2B', number: '04', status: 'available', price: 1500 },
    { id: '3A', number: '05', status: 'booked', price: 1500 },
    { id: '3B', number: '06', status: 'available', price: 1500 },
    { id: '4A', number: '07', status: 'available', price: 1500 },
    { id: '4B', number: '08', status: 'booked', price: 1500 },
    { id: '5A', number: '09', status: 'available', price: 1800 },
    { id: '5B', number: '10', status: 'available', price: 1800 },
    { id: '11A', number: '11', status: 'booked', price: 1800 },
    { id: '12B', number: '12', status: 'selected', price: 1800 },
  ];

  return (
    <div className="glass-card-3d p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-teal">
            <Ticket className="h-3.5 w-3.5" /> Interactive 3D Bus Seat Selector
          </span>
          <h3 className="font-display text-xl font-medium">Nairobi → Mombasa Express</h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-ink-50 border border-white/20" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-marigold" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-coral/40" /> Booked</span>
        </div>
      </div>

      {/* 3D Perspective Bus Floorplan */}
      <div className="perspective-1000 my-8 py-4">
        <motion.div
          initial={{ rotateX: 25, rotateY: -10 }}
          animate={{ rotateX: 20, rotateY: -5 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="mx-auto max-w-md rounded-2xl border border-white/15 bg-ink-100/90 p-6 shadow-3d-md preserve-3d"
        >
          <div className="mb-6 flex justify-between items-center border-b border-white/10 pb-3 text-xs text-bone/50">
            <span>DRIVER CAB</span>
            <span className="rounded bg-teal/20 px-2 py-0.5 text-teal">FRONT</span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            {seats.map((seat) => {
              const isSelected = selectedSeat === seat.id || seat.status === 'selected';
              const isBooked = seat.status === 'booked';

              return (
                <motion.button
                  key={seat.id}
                  whileHover={!isBooked ? { scale: 1.1, zIndex: 10 } : {}}
                  whileTap={!isBooked ? { scale: 0.95 } : {}}
                  disabled={isBooked}
                  onClick={() => setSelectedSeat(seat.id)}
                  className={`relative flex flex-col items-center justify-center rounded-xl p-3 text-xs transition-all duration-200 ${
                    isBooked
                      ? 'bg-coral/10 border border-coral/30 text-coral/50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-marigold text-ink font-semibold border-2 border-white shadow-3d-glow transform -translate-z-4'
                      : 'bg-ink-50 border border-white/10 text-bone hover:border-marigold/50 hover:bg-white/5'
                  }`}
                >
                  <Armchair className="h-5 w-5 mb-1" />
                  <span>{seat.number}</span>
                  <span className="mt-0.5 text-[10px] opacity-75">{seat.id}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
        <div>
          <span className="text-bone/60">Selected Seat: </span>
          <span className="font-display font-medium text-marigold">{selectedSeat || 'None'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-base text-marigold">KES 1,800</span>
          <button className="btn-primary !py-2 !px-4 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" /> Reserve Seat
          </button>
        </div>
      </div>
    </div>
  );
}
