import React, { useState } from 'react';
import { Star, X, Sparkles, Car, Palmtree, Send } from 'lucide-react';
import { rateBooking, type StoredBooking } from '@/lib/bookingStore';
import { sendNotification } from '@/lib/notificationService';

interface BookingRatingModalProps {
  booking: StoredBooking | any;
  onClose: () => void;
  onRated?: (rating: number, comment?: string, tags?: string[]) => void;
}

const RATING_TIERS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Poor', desc: 'Sub-standard condition or service issues experienced.', color: 'text-rose-500' },
  2: { label: 'Fair', desc: 'Service was acceptable but had notable room for improvement.', color: 'text-amber-500' },
  3: { label: 'Good', desc: 'Satisfactory journey meeting standard expectations.', color: 'text-yellow-500' },
  4: { label: 'Very Good', desc: 'Comfortable, punctual, and well-facilitated experience.', color: 'text-emerald-500' },
  5: { label: 'Exceptional Luxury', desc: 'Flawless 5-star experience, immaculate vehicle & world-class hospitality.', color: 'text-amber-400' },
};

const PRAISE_TAGS = [
  '✨ Immaculate Cleanliness',
  '⏱️ Prompt & Punctual',
  '👔 Professional Chauffeur',
  '🦁 Scenic Safari Knowledge',
  '🛡️ Smooth & Safe Drive',
  '🔑 Seamless Handover',
  '💬 Responsive Host',
  '🏨 Luxury Accommodations',
];

export const BookingRatingModal: React.FC<BookingRatingModalProps> = ({
  booking,
  onClose,
  onRated,
}) => {
  const [rating, setRating] = useState<number>(booking?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(booking?.reviewComment || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(booking?.reviewTags || []);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeRating = hoverRating || rating;
  const isDest =
    booking?.bookingType === 'DESTINATION' ||
    booking?.bookingType === 'TOUR' ||
    booking?.bookingRef?.startsWith('MT-HOL-') ||
    booking?.vehicleId?.startsWith('dest-');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;

    setSubmitting(true);
    setTimeout(() => {
      // 1. Persist rating in centralized store
      rateBooking(booking.id || booking.bookingRef, rating, comment.trim(), selectedTags);

      // 2. Notify Host of traveler's review
      if (booking.ownerId) {
        sendNotification({
          recipientId: booking.ownerId,
          role: 'VEHICLE_OWNER',
          type: 'RATING_RECEIVED',
          title: `New ${rating}-Star Review Received!`,
          message: `Traveler ${booking.touristName || 'Guest'} rated your vehicle ${booking.vehicleName} ${rating}/5 stars. "${comment.trim() || 'Great experience!'}"`,
          link: '/dashboard/owner?tab=fleet',
        });
      }

      setSubmitting(false);
      setIsSuccess(true);

      if (onRated) {
        onRated(rating, comment.trim(), selectedTags);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs font-display overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-[#131b2e] to-slate-950 p-6 sm:p-8 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">Thank You for Your Review!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your {rating}-star rating has been recorded and published. Your feedback helps maintain M-TRAVEL's signature executive standards.
            </p>
            <div className="flex justify-center gap-1 text-amber-400 pt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-6 w-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* HEADER */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  {isDest ? 'Destination Stay Feedback' : 'Vehicle Hire Review'}
                </span>
                <span className="text-xs text-slate-400 font-mono">Ref: {booking.bookingRef}</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
                Rate Your Experience
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                How was your journey with <strong className="text-amber-300">{booking.destinationTitle || booking.vehicleName}</strong>?
              </p>
            </div>

            {/* VEHICLE / TRIP SNIPPET */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="h-14 w-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                <img
                  src={booking.vehicleImage || 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73'}
                  alt={booking.vehicleName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-sm font-bold text-white truncate">
                  {booking.destinationTitle || booking.vehicleName}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                  {isDest ? <Palmtree className="h-3 w-3 text-amber-400" /> : <Car className="h-3 w-3 text-amber-400" />}
                  <span>{booking.startDate?.split('T')[0]} to {booking.endDate?.split('T')[0]}</span>
                </p>
              </div>
            </div>

            {/* INTERACTIVE 5-STAR RATING */}
            <div className="rounded-2xl bg-gradient-to-b from-white/5 to-white/2 border border-amber-500/20 p-5 text-center space-y-2.5">
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 text-amber-400 transition-all duration-150 hover:scale-125 focus:outline-hidden"
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 sm:h-9 sm:w-9 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* TIER DESCRIPTION */}
              <div className="pt-1">
                <p className={`font-serif text-sm font-bold ${RATING_TIERS[activeRating]?.color || 'text-amber-400'}`}>
                  {RATING_TIERS[activeRating]?.label} ({activeRating} of 5 Stars)
                </p>
                <p className="text-[11px] text-slate-300 font-medium max-w-sm mx-auto mt-0.5">
                  {RATING_TIERS[activeRating]?.desc}
                </p>
              </div>
            </div>

            {/* PRAISE TAGS */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                What stood out the most? (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRAISE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs scale-[1.02]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REVIEW COMMENTARY */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Your Review &amp; Commentary (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about the journey, vehicle comfort, scenic highlights, or host communication..."
                className="w-full rounded-2xl border border-white/15 bg-slate-900/90 p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition shadow-md flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit 5-Star Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
