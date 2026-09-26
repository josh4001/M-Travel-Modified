import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Car, Calendar, Search } from 'lucide-react';

export const HeroSafariSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [travelDate, setTravelDate] = useState('');

  const popularDestinations = [
    { name: 'Maasai Mara', icon: '🦁' },
    { name: 'Amboseli', icon: '🐘' },
    { name: 'Diani Beach', icon: '🌴' },
    { name: 'Lake Naivasha', icon: '🦩' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) {
      params.set('search', destination.trim());
    }
    if (vehicleType && vehicleType !== 'ALL') {
      params.set('category', vehicleType.toLowerCase());
    }
    navigate(`/catalogue?${params.toString()}`);
  };

  const handleSelectQuickDest = (destName: string) => {
    setDestination(destName);
    navigate(`/catalogue?search=${encodeURIComponent(destName)}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3 font-display">
      {/* ── SMILING CONCIERGE STATEMENT BADGE (TOP OF INPUT FIELDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-amber-300/80 px-4 py-2 rounded-2xl shadow-sm hover:border-amber-400 transition group">
          {/* Smiling Kenyan Safari Specialist Avatar */}
          <div className="relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
              alt="Smiling M-Travel Safari Host"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/90 shadow-2xs group-hover:scale-105 transition-transform"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                "Jambo! I'm James, your safari concierge. Where are you exploring next?"
              </span>
              <span className="text-amber-600 text-xs">✨</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Ready with verified 4x4 Land Cruisers, Safari Vans, Coastal Villas &amp; 24/7 assistance
            </p>
          </div>
        </div>

        {/* Popular Quick Destination Badges */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider pr-1">Trending:</span>
          {popularDestinations.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => handleSelectQuickDest(d.name)}
              className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>{d.icon}</span>
              <span>{d.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── BILLION-DOLLAR INTERACTIVE SAFARI SEARCH CONSOLE ── */}
      <form
        onSubmit={handleSearch}
        className="rounded-3xl bg-white/95 backdrop-blur-2xl border-2 border-amber-300/80 p-3 sm:p-4 shadow-[0_20px_50px_-15px_rgba(245,166,35,0.18)] ring-1 ring-amber-200/50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">

          {/* 1. Destination Input (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200/60 p-3 transition flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Destination or Park
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Maasai Mara, Diani, Amboseli"
                className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none truncate"
              />
            </div>
          </div>

          {/* 2. Vehicle / Category Selector (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200/60 p-3 transition flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Car className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Fleet / Experience
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Safari Fleets</option>
                <option value="SUV">4x4 Land Cruiser (Game Drive)</option>
                <option value="VAN">Safari Van (Pop-Up Roof)</option>
                <option value="BUS">Luxury Intercity Coach</option>
                <option value="STAYS">Holiday Villa &amp; Stays</option>
              </select>
            </div>
          </div>

          {/* 3. Expedition Date (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200/60 p-3 transition flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Expedition Dates
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Action Button (2 Cols) */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full btn-primary !py-3.5 !px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Search className="h-4 w-4" /> Search
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
