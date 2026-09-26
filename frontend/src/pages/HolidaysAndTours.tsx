import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palmtree, Home, Compass, MapPin, Search, Sparkles, Star,
  ShieldCheck, CheckCircle2, X, MessageSquare, Lock, UserPlus, ArrowRight
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { MpesaStkPushModal } from '@/components/ui/MpesaStkPushModal';
import {
  getStoredDestinations,
  type TravelDestinationItem,
} from '@/lib/destinationsStore';
import { saveBooking } from '@/lib/bookingStore';
import { sendNotification } from '@/lib/notificationService';
import {
  sendTravelerBookingEmail,
  openTravelerBookingWhatsApp,
  getTravelerBookingWhatsAppUrl,
  type DispatchedEmail
} from '@/lib/communicationService';
import { LuxuryEmailPreviewModal } from '@/components/ui/LuxuryEmailPreviewModal';

type TabFilter = 'ALL' | 'TOUR' | 'HOLIDAY_HOME';

export default function HolidaysAndTours() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((s: RootState) => s.auth.user);
  const { formatPrice } = useCurrency();
  const touristName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Jane Wanjiru';
  const touristPhone = user?.phone || '+254722374535';
  const touristEmail = user?.email || 'traveler@mtravel.co.ke';

  const tabParam = searchParams.get('tab');
  const [activeCategory, setActiveCategory] = useState<TabFilter>(() => {
    if (tabParam === 'homes') return 'HOLIDAY_HOME';
    if (tabParam === 'tours') return 'TOUR';
    return 'ALL';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [destinations, setDestinations] = useState<TravelDestinationItem[]>(() =>
    getStoredDestinations().filter((d) => d.isLive)
  );

  const [selectedItem, setSelectedItem] = useState<TravelDestinationItem | null>(null);
  const [authRequiredItem, setAuthRequiredItem] = useState<TravelDestinationItem | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState<DispatchedEmail | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const loadData = () => {
    const liveOnly = getStoredDestinations().filter((d) => d.isLive);
    setDestinations(liveOnly);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('mt_destinations_updated', handleUpdate);
    return () => window.removeEventListener('mt_destinations_updated', handleUpdate);
  }, []);

  // Handle returning from login/register with ?book=<id>
  useEffect(() => {
    const bookId = searchParams.get('book');
    if (bookId && destinations.length > 0) {
      const target = destinations.find((d) => d.id === bookId);
      if (target) {
        if (user) {
          setSelectedItem(target);
          setShowMpesaModal(true);
          searchParams.delete('book');
          setSearchParams(searchParams, { replace: true });
        } else {
          setAuthRequiredItem(target);
        }
      }
    }
  }, [searchParams, user, destinations, setSearchParams]);

  const handleTabChange = (cat: TabFilter) => {
    setActiveCategory(cat);
    if (cat === 'ALL') {
      searchParams.delete('tab');
    } else if (cat === 'TOUR') {
      searchParams.set('tab', 'tours');
    } else if (cat === 'HOLIDAY_HOME') {
      searchParams.set('tab', 'homes');
    }
    setSearchParams(searchParams);
  };

  const filteredItems = destinations.filter((item) => {
    const matchesCategory =
      activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBookNow = (item: TravelDestinationItem) => {
    if (!user) {
      setAuthRequiredItem(item);
      return;
    }
    setSelectedItem(item);
    setShowMpesaModal(true);
  };

  const handleBookingConfirmed = async (receipt: string) => {
    if (!selectedItem) return;
    const bookingRef = `MT-HOL-${Date.now().toString().slice(-6)}`;

    // Save to local shared bookings with destination metadata
    const newBooking = saveBooking({
      bookingRef,
      bookingType: 'DESTINATION',
      destinationCategory: selectedItem.category,
      destinationTitle: selectedItem.title,
      destinationBadge: selectedItem.badge,
      destinationLocation: selectedItem.location,
      destinationSpecs: selectedItem.specs,
      vehicleId: selectedItem.id,
      vehicleMake: selectedItem.title,
      vehicleModel: selectedItem.badge,
      vehicleName: selectedItem.title,
      vehicleImage: selectedItem.imageUrl,
      ownerId: 'admin-curated',
      driverName: selectedItem.category === 'TOUR' ? 'Certified Safari Guide & Chauffeur' : undefined,
      touristId: user?.id || 'tourist-user',
      touristEmail,
      touristName,
      touristPhone,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      totalAmount: selectedItem.priceKES,
      paymentStatus: 'PAID',
      mpesaReceipt: receipt || `QK${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'CONFIRMED',
      pickupMethod: 'SELF_COLLECT',
      pickupLocation: selectedItem.location,
    });

    // 1. In-app notification to Traveler
    if (user?.id) {
      sendNotification({
        recipientId: user.id,
        role: 'TOURIST',
        type: 'DESTINATION_BOOKING_CONFIRMED',
        title: 'Destination Booking Placed & Confirmed',
        message: `Your booking for ${selectedItem.title} (${selectedItem.badge}) has been placed. Our concierge operations team is actively facilitating all arrangements.`,
        link: '/dashboard/bookings',
      });
    }

    // 2. In-app notification to Admin with full details of place & client to facilitate
    sendNotification({
      role: 'ADMIN',
      type: 'NEW_DESTINATION_BOOKING_ADMIN',
      title: `New Destination Booking: ${selectedItem.title}`,
      message: `Client ${touristName} (${touristPhone}) booked ${selectedItem.title} for KES ${selectedItem.priceKES.toLocaleString()} (Ref: ${bookingRef}). Action required: Facilitate lodge & ground arrangements.`,
      link: '/dashboard/admin?tab=bookings',
    });

    // 3. Automated WhatsApp Destination Booking Confirmation Voucher
    try {
      openTravelerBookingWhatsApp({
        booking: newBooking,
        isDestination: true,
        targetPhone: touristPhone,
      });
    } catch {}

    // 4. Dispatch Luxury Confirmation Email (backup)
    sendTravelerBookingEmail({
      booking: newBooking,
      isDestination: true,
    }).then((email) => {
      setLastEmailSent(email);
    }).catch(() => {});
    setBookingSuccessRef(bookingRef);
    setShowMpesaModal(false);
    navigate('/dashboard/bookings');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-12 font-display">
      {/* HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-200">
              East Africa's Curated Holiday Sanctuaries
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Holidays, Safaris & Private Villas
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-body">
            Handpicked African holiday escapes verified by M-TRAVEL. Choose from all-inclusive Maasai Mara safari game drives, Mount Kenya retreats, and beachfront Swahili villas with private pools & personal chefs.
          </p>

          {/* SEARCH BAR */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-amber-400" />
              <input
                type="text"
                placeholder="Search safari packages, villas, beaches, or reserves..."
                className="input-field pl-12 bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-400 text-xs md:text-sm focus:border-amber-400 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL' as TabFilter, label: 'All Holidays & Tours', icon: Compass, count: destinations.length },
            { id: 'TOUR' as TabFilter, label: 'Guided Safaris & Tours', icon: Palmtree, count: destinations.filter(d => d.category === 'TOUR').length },
            { id: 'HOLIDAY_HOME' as TabFilter, label: 'Holiday Homes & Villas', icon: Home, count: destinations.filter(d => d.category === 'HOLIDAY_HOME').length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/30 text-white' : 'bg-white text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Curated & Updated Exclusively by M-TRAVEL Administration</span>
        </div>
      </div>

      {/* PUBLIC TRAVELER BANNER (WHEN NOT LOGGED IN) */}
      {!user && (
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 p-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs sm:text-sm">Browsing M-TRAVEL Holidays & Stays</p>
              <p className="text-slate-600 text-[11px] sm:text-xs">
                To confirm bookings, lock travel dates, and receive official digital itineraries, please register or sign in as a traveler.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/register?role=TOURIST&redirect=/holidays-and-tours"
              className="btn-primary !py-2 !px-3.5 text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register as Traveler</span>
            </Link>
            <Link
              to="/login?redirect=/holidays-and-tours"
              className="btn-secondary !py-2 !px-3 text-xs font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {bookingSuccessRef && (
        <div className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 p-6 text-slate-900 shadow-xl flex flex-col md:flex-row items-start justify-between gap-6 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  Booking Placed &amp; Confirmed
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">Ref: {bookingSuccessRef}</span>
              </div>
              <h3 className="font-bold text-xl text-slate-900 font-serif mt-1">
                Your Holiday Destination Reservation is Placed!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed font-medium">
                Our M-TRAVEL travel operations team has received your destination reservation and is actively facilitating your ground arrangements and lodge coordination. A luxury confirmation email has been dispatched.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={getTravelerBookingWhatsAppUrl({
                    booking: {
                      id: bookingSuccessRef,
                      bookingRef: bookingSuccessRef,
                      vehicleName: selectedItem?.title || 'Safari Destination',
                      destinationTitle: selectedItem?.title,
                      destinationCategory: selectedItem?.category,
                      destinationLocation: selectedItem?.location,
                      startDate: new Date().toISOString(),
                      endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                      totalAmount: selectedItem?.priceKES || 0,
                      status: 'CONFIRMED',
                      paymentStatus: 'PAID',
                      touristName,
                      touristPhone,
                      pickupLocation: selectedItem?.location,
                      createdAt: new Date().toISOString(),
                    } as any,
                    isDestination: true,
                    targetPhone: touristPhone,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 text-xs font-bold transition shadow-sm flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 fill-white" />
                  Open WhatsApp Booking Voucher
                </a>

                <Link
                  to="/dashboard/bookings"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  View in My Bookings ➔
                </Link>
              </div>
            </div>
          </div>
          <button
            onClick={() => setBookingSuccessRef(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ITEM GRID */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-4">
          <Palmtree className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-slate-800">No Holiday Packages Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active holiday destinations or safaris match your query. Try clearing your search term.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}
            className="btn-primary !py-2 !px-4 text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* PHOTO CONTAINER */}
                <div className="relative h-60 overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* BADGES */}
                  <span className="absolute top-3 left-3 rounded-full bg-slate-950/85 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-300 border border-white/20">
                    {item.badge}
                  </span>

                  <span className="absolute top-3 right-3 rounded-full bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-amber-400 border border-white/20 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400" /> {item.rating.toFixed(2)}
                  </span>

                  {/* LOCATION BAR */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-medium truncate drop-shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {item.location}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      {item.region}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {item.category === 'TOUR' ? 'Safari Package' : 'Holiday Home'}
                    </span>
                    <span className="text-xs text-slate-400">({item.reviews} reviews)</span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>

                  {/* SPECS TAGS */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.specs.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/60"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* FOOTER & PRICING */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">All-Inclusive Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-slate-950">
                      {formatPrice(item.priceKES)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{item.priceUnit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleBookNow(item)}
                    className="btn-primary !py-2 !px-4 text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedItem && !showMpesaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl space-y-6"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
              >
                <X className="h-5 w-5" />
              </button>

              {/* MODAL HEADER */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                  <Sparkles className="h-3 w-3 text-amber-600" /> {selectedItem.badge}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-950">
                  {selectedItem.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>{selectedItem.location} — {selectedItem.region}</span>
                </p>
              </div>

              {/* PHOTO PREVIEW & GALLERY CAROUSEL */}
              {(() => {
                const photos = selectedItem.images && selectedItem.images.length > 0
                  ? selectedItem.images
                  : [selectedItem.imageUrl];
                const activePhoto = photos[activePhotoIdx] || photos[0] || selectedItem.imageUrl;
                return (
                  <div className="space-y-2">
                    <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                      <img
                        src={activePhoto}
                        alt={selectedItem.title}
                        className="h-full w-full object-cover transition-all duration-300"
                      />
                      <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
                        Photo {activePhotoIdx + 1} of {photos.length}
                      </div>
                    </div>
                    {photos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {photos.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePhotoIdx(idx)}
                            className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition ${activePhotoIdx === idx ? 'border-amber-500 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                          >
                            <img src={p} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* OVERVIEW */}
              <div className="space-y-2">
                <h4 className="font-serif text-base font-bold text-slate-900">Overview</h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {selectedItem.details.overview}
                </p>
              </div>

              {/* HIGHLIGHTS */}
              {selectedItem.details.highlights?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-serif text-base font-bold text-slate-900">Key Highlights & Inclusions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedItem.details.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ITINERARY */}
              {selectedItem.details.scheduleOrItinerary && selectedItem.details.scheduleOrItinerary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    {selectedItem.category === 'TOUR' ? 'Expedition Itinerary' : 'Stay Schedule & Policies'}
                  </h4>
                  <div className="space-y-2">
                    {selectedItem.details.scheduleOrItinerary.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-slate-700 bg-amber-50/40 p-3 rounded-xl border border-amber-200/50">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRAVELER ACCOUNT NOTICE IN DETAIL MODAL */}
              {!user && (
                <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Traveler account required to reserve — clicking <strong>Reserve Now</strong> will guide you to register or sign in.</span>
                </div>
              )}

              {/* MODAL ACTIONS */}
              <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total Investment</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-slate-950">
                      {formatPrice(selectedItem.priceKES)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{selectedItem.priceUnit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href="https://wa.me/254722374535"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 text-xs font-bold transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp Concierge</span>
                  </a>
                  <button
                    onClick={() => handleBookNow(selectedItem)}
                    className="flex-1 sm:flex-initial btn-primary !py-2.5 !px-6 text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    Reserve Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRAVELER REGISTRATION REQUIRED POPUP MODAL */}
      <AnimatePresence>
        {authRequiredItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl space-y-6 text-slate-900"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setAuthRequiredItem(null)}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* HEADER BADGE */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Traveler Account Required</span>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-950 tracking-tight">
                  Register as a Traveler to Reserve
                </h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  To confirm your reservation and receive your official digital itinerary, vouchers, and 24/7 concierge assistance, please register or sign in as a traveler.
                </p>
              </div>

              {/* SELECTED ITEM PREVIEW CARD */}
              <div className="rounded-2xl border border-slate-200/90 bg-[#FAF8F5] p-3.5 flex items-center gap-4 shadow-xs">
                <img
                  src={authRequiredItem.imageUrl}
                  alt={authRequiredItem.title}
                  className="h-16 w-20 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase font-mono">
                      {authRequiredItem.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {authRequiredItem.location}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-slate-900 truncate mt-1">
                    {authRequiredItem.title}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-serif font-bold text-amber-700 text-sm">
                      {formatPrice(authRequiredItem.priceKES)}
                    </span>
                    <span className="text-[11px] text-slate-500">{authRequiredItem.priceUnit}</span>
                  </div>
                </div>
              </div>

              {/* BENEFITS CHECKLIST */}
              <div className="space-y-2 rounded-2xl bg-amber-50/50 border border-amber-200/60 p-3.5 text-xs text-slate-700">
                <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                  Why you need a Traveler Account:
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Instant M-Pesa receipt verification & booking confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Official safari voucher & stay access credentials sent to your email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Live 24/7 dedicated WhatsApp & phone concierge support</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const returnUrl = `/holidays-and-tours?book=${authRequiredItem.id}`;
                    navigate(`/register?role=TOURIST&redirect=${encodeURIComponent(returnUrl)}&reason=booking`, {
                      state: {
                        message: `Please register as a traveler to complete your reservation for "${authRequiredItem.title}".`,
                        redirect: returnUrl,
                      },
                    });
                  }}
                  className="btn-primary w-full !py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register as Traveler & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const returnUrl = `/holidays-and-tours?book=${authRequiredItem.id}`;
                    navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&reason=booking`, {
                      state: {
                        message: `Please sign in to complete your reservation for "${authRequiredItem.title}".`,
                        redirect: returnUrl,
                      },
                    });
                  }}
                  className="btn-secondary w-full !py-2.5 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  <span>Already have an account? Sign In</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* M-PESA PAYMENT STK PUSH MODAL */}
      {showMpesaModal && selectedItem && (
        <MpesaStkPushModal
          amount={selectedItem.priceKES}
          bookingRef={`MT-HOL-${Date.now().toString().slice(-6)}`}
          vehicleName={selectedItem.title}
          touristPhone={user?.phone || ''}
          onClose={() => setShowMpesaModal(false)}
          onSuccess={handleBookingConfirmed}
        />
      )}

      {/* LUXURY EMAIL PREVIEW MODAL */}
      {showEmailModal && lastEmailSent && (
        <LuxuryEmailPreviewModal
          email={lastEmailSent}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
