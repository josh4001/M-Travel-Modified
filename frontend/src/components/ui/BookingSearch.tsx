import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bus, Home, Palmtree, Calendar, MapPin, Users, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const BookingSearch: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cars' | 'buses' | 'homes' | 'packages'>('cars');
  const [tripType, setTripType] = useState<'round' | 'oneway' | 'chauffeur'>('round');
  const [pickup, setPickup] = useState('Nairobi JKIA Airport (NBO)');
  const [destination, setDestination] = useState('Maasai Mara National Reserve');
  const [departDate, setDepartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [passengers, setPassengers] = useState(2);
  const [vehicleCategory, setVehicleCategory] = useState('all');

  const popularLocations = [
    'Nairobi JKIA Airport (NBO)',
    'Westlands, Nairobi',
    'Maasai Mara National Reserve',
    'Diani Beach, Ukunda',
    'Naivasha Lakefront',
    'Moi Intl Airport, Mombasa',
    'Nakuru Town',
    'Kisumu Airport (KIS)',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      tab: activeTab,
      type: vehicleCategory,
      pickup,
      destination,
      passengers: passengers.toString(),
    });
    navigate(`/search?${query.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-mtravel-gold/30 bg-mtravel-gradient p-4 md:p-6 shadow-3d-glow relative overflow-hidden backdrop-blur-2xl">
      {/* LUXURY GOLD DECORATIVE ACCENT LINE */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

      {/* SERVICE TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'cars', label: 'Car Hire & Safaris', icon: Car, badge: 'Popular' },
          { id: 'buses', label: 'Intercity Bus Express', icon: Bus, badge: 'Daily' },
          { id: 'homes', label: 'Holiday Stays & Villas', icon: Home, badge: 'Luxury' },
          { id: 'packages', label: 'Flight & Safari Combos', icon: Palmtree, badge: 'Package' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? 'bg-gold-gradient text-mtravel-obsidian shadow-gold-glow scale-[1.02]'
                  : 'text-bone/70 hover:text-bone hover:bg-white/10'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-mtravel-obsidian' : 'text-mtravel-lightGold'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-extrabold ${
                  isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-mtravel-lightGold'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB TRIP TYPE SELECTOR */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-bone">
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
          {[
            { id: 'round', label: 'Round Trip' },
            { id: 'oneway', label: 'One Way' },
            { id: 'chauffeur', label: 'With Chauffeur Driver' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTripType(type.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                tripType === type.id
                  ? 'bg-mtravel-burgundy text-white shadow-sm border border-mtravel-gold/40'
                  : 'text-bone/60 hover:text-bone'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* INSTANT BOOKING BADGE */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[11px] text-mtravel-lightGold items-center gap-1 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Instant Verified Booking
          </span>
        </div>
      </div>

      {/* SEARCH INPUTS FORM */}
      <form onSubmit={handleSearch} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* PICKUP LOCATION */}
        <div className="space-y-1 rounded-2xl bg-black/40 p-3 border border-white/15 focus-within:border-mtravel-gold transition">
          <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-mtravel-lightGold flex items-center gap-1">
            <MapPin className="h-3 w-3 text-mtravel-gold" /> Pick-Up Location
          </label>
          <select
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-bone focus:outline-none cursor-pointer"
          >
            {popularLocations.map((loc) => (
              <option key={loc} value={loc} className="bg-mtravel-obsidian text-bone">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* DESTINATION LOCATION */}
        <div className="space-y-1 rounded-2xl bg-black/40 p-3 border border-white/15 focus-within:border-mtravel-gold transition">
          <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-mtravel-lightGold flex items-center gap-1">
            <MapPin className="h-3 w-3 text-marigold" /> Destination / Drop-off
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-bone focus:outline-none cursor-pointer"
          >
            {popularLocations.map((loc) => (
              <option key={loc} value={loc} className="bg-mtravel-obsidian text-bone">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* DATES */}
        <div className="space-y-1 rounded-2xl bg-black/40 p-3 border border-white/15 focus-within:border-mtravel-gold transition">
          <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-mtravel-lightGold flex items-center gap-1">
            <Calendar className="h-3 w-3 text-mtravel-gold" /> Travel Dates
          </label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <input
              type="date"
              value={departDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartDate(e.target.value)}
              className="bg-transparent font-mono text-[11px] text-bone focus:outline-none cursor-pointer"
            />
            {tripType === 'round' && (
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="bg-transparent font-mono text-[11px] text-bone focus:outline-none cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* PASSENGERS & VEHICLE TYPE */}
        <div className="space-y-1 rounded-2xl bg-black/40 p-3 border border-white/15 focus-within:border-mtravel-gold transition">
          <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-mtravel-lightGold flex items-center gap-1">
            <Users className="h-3 w-3 text-mtravel-gold" /> Travelers & Category
          </label>
          <div className="flex items-center justify-between text-xs font-bold">
            <select
              value={vehicleCategory}
              onChange={(e) => setVehicleCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-bone focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-mtravel-obsidian text-bone">All Vehicles</option>
              <option value="4x4" className="bg-mtravel-obsidian text-bone">4x4 Safari Cruisers</option>
              <option value="SUV" className="bg-mtravel-obsidian text-bone">Luxury SUVs</option>
              <option value="VAN" className="bg-mtravel-obsidian text-bone">Executive Vans (Alphard)</option>
              <option value="SEDAN" className="bg-mtravel-obsidian text-bone">Premium Sedans</option>
            </select>
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full font-mono text-[11px]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPassengers(Math.max(1, passengers - 1)); }}
                className="h-4 w-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-bone font-bold"
              >
                -
              </button>
              <span>{passengers} Pax</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPassengers(Math.min(10, passengers + 1)); }}
                className="h-4 w-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-bone font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK FILTER PILLS & ACTION BUTTON */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-mono text-mtravel-lightGold">Quick Filter:</span>
          {[
            { label: '4x4 Safari Land Cruisers', val: '4x4' },
            { label: 'Executive Vans (Alphard)', val: 'VAN' },
            { label: 'Self-Drive SUVs', val: 'SUV' },
            { label: 'Airport VIP Transfer', val: 'SEDAN' },
          ].map((pill) => (
            <button
              key={pill.val}
              type="button"
              onClick={() => setVehicleCategory(pill.val)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition ${
                vehicleCategory === pill.val
                  ? 'border-mtravel-gold bg-mtravel-gold/20 text-mtravel-lightGold'
                  : 'border-white/10 text-bone/60 hover:text-bone hover:border-white/20'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* SUBMIT BUTTON WITH MPESA LOGO */}
        <button
          type="button"
          onClick={handleSearch}
          className="btn-primary !bg-gold-gradient text-mtravel-obsidian font-bold tracking-wide text-sm !px-7 !py-3 shadow-gold-glow hover:scale-105 transition-all duration-300 flex items-center gap-3 border border-mtravel-lightGold/50"
        >
          <Sparkles className="h-4 w-4 fill-mtravel-obsidian" />
          <span>Search Offers & Book with M-PESA</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
