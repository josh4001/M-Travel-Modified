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
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-4 md:p-6 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1),0_2px_8px_-2px_rgba(0,0,0,0.04)] relative overflow-hidden backdrop-blur-xl">
      {/* LUXURY GOLD DECORATIVE ACCENT LINE */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

      {/* SERVICE TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-150 pb-4">
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
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-amber-600'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB TRIP TYPE SELECTOR */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
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
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* INSTANT BOOKING BADGE */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Instant Verified M-PESA Booking
          </span>
        </div>
      </div>

      {/* SEARCH INPUTS FORM */}
      <form onSubmit={handleSearch} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* PICKUP LOCATION */}
        <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:bg-white transition-all">
          <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-600" /> Pick-Up Location
          </label>
          <select
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {popularLocations.map((loc) => (
              <option key={loc} value={loc} className="bg-white text-slate-900">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* DESTINATION LOCATION */}
        <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:bg-white transition-all">
          <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-600" /> Destination / Drop-off
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {popularLocations.map((loc) => (
              <option key={loc} value={loc} className="bg-white text-slate-900">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* DATES */}
        <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:bg-white transition-all">
          <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-600" /> Travel Dates
          </label>
          <div className={`grid ${tripType === 'round' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs`}>
            <input
              type="date"
              value={departDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full bg-transparent font-medium text-[11px] text-slate-800 focus:outline-none cursor-pointer"
            />
            {tripType === 'round' && (
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent font-medium text-[11px] text-slate-800 focus:outline-none cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* PASSENGERS & VEHICLE TYPE */}
        <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:bg-white transition-all">
          <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" /> Travelers & Category
          </label>
          <div className="flex items-center justify-between text-xs font-bold">
            <select
              value={vehicleCategory}
              onChange={(e) => setVehicleCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all" className="bg-white text-slate-900">All Vehicles</option>
              <option value="4x4" className="bg-white text-slate-900">4x4 Safari Cruisers</option>
              <option value="SUV" className="bg-white text-slate-900">Luxury SUVs</option>
              <option value="VAN" className="bg-white text-slate-900">Executive Vans (Alphard)</option>
              <option value="SEDAN" className="bg-white text-slate-900">Premium Sedans</option>
            </select>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-full text-[11px] text-slate-800 shadow-sm">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPassengers(Math.max(1, passengers - 1)); }}
                className="h-4 w-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold"
              >
                -
              </button>
              <span className="font-semibold">{passengers} Pax</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPassengers(Math.min(10, passengers + 1)); }}
                className="h-4 w-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK FILTER PILLS & ACTION BUTTON */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-150 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Popular:</span>
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
                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                  : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* SUBMIT BUTTON WITH MPESA BADGE */}
        <button
          type="button"
          onClick={handleSearch}
          className="btn-primary !px-7 !py-3 text-sm flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="h-4 w-4 fill-white" />
          <span>Search & Book with M-PESA</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
