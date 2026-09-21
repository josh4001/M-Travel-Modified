import React, { useState } from 'react';
import {
  X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { StoredBooking } from '@/lib/bookingStore';
import { reportIncident, IncidentReport } from '@/lib/rentalLifecycleStore';

interface IncidentReportModalProps {
  booking: StoredBooking;
  onClose: () => void;
  onIncidentReported: (incident: IncidentReport) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  booking,
  onClose,
  onIncidentReported
}) => {
  const [type, setType] = useState<IncidentReport['type']>('BREAKDOWN');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('MEDIUM');
  const [description, setDescription] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe what happened.');
      return;
    }

    setIsSubmitting(true);
    try {
      const incident = reportIncident({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        vehicleId: booking.vehicleId || 'v-unknown',
        vehicleName: booking.vehicleName,
        travelerId: booking.touristId,
        travelerName: booking.touristName,
        travelerPhone: booking.touristPhone,
        type,
        severity,
        description,
        locationDescription: locationDescription || 'Location provided in description',
        photos,
        emergencyContactCalled: severity === 'HIGH' || severity === 'CRITICAL'
      });

      onIncidentReported(incident);
      onClose();
    } catch (err) {
      console.error('Error reporting incident:', err);
      alert('Failed to report incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Report Rental Incident</h3>
              <p className="text-xs text-amber-100">Vehicle: {booking.vehicleName} ({booking.bookingRef})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Incident Category
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="BREAKDOWN">Mechanical Breakdown / Engine Fault</option>
              <option value="FLAT_TYRE">Flat Tyre / Wheel Puncture</option>
              <option value="ACCIDENT">Road Collision / Body Scratch</option>
              <option value="LOST_KEY">Lost Vehicle Key / Lockout</option>
              <option value="LATE_RETURN">Unavoidable Late Return Delay</option>
              <option value="SECURITY">Police Check / Security Issue</option>
              <option value="OTHER">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                    severity === lvl
                      ? lvl === 'HIGH'
                        ? 'bg-red-600 text-white border-red-700 shadow-sm'
                        : 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Current Location or Landmark
            </label>
            <input
              type="text"
              value={locationDescription}
              onChange={e => setLocationDescription(e.target.value)}
              placeholder="e.g. Near Shell Petrol Station, Mai Mahiu Road"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Detailed Description of Problem
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide a clear description of the situation so operations can dispatch assistance or replacement..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Evidence Photos ({photos.length})
              </label>
              <label className="cursor-pointer text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                + Add Photo
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {photos.map((p, i) => (
                  <img key={i} src={p} alt="Incident" className="w-16 h-16 object-cover rounded-lg border" />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'File Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
