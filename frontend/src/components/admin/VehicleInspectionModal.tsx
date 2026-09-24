import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, X,
  MessageSquare, Trash2, ExternalLink, FileText, ShieldCheck,
  Eye, Download, ZoomIn, Check,
  ChevronLeft, ChevronRight, ShieldAlert, Paperclip
} from 'lucide-react';
import type { StoredVehicle, VehicleDocument } from '@/lib/bookingStore';
import { ensureVehicleComplianceDocs } from '@/lib/bookingStore';
import { getHostRejectionWhatsAppUrl } from '@/lib/communicationService';

interface VehicleInspectionModalProps {
  vehicle: StoredVehicle;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  onApprove: () => void;
  onReject: (reasons: string[], customFeedback: string) => void;
  onClose: () => void;
}

export const MANUAL_REJECTION_REASONS = [
  'Missing or unverified Vehicle Logbook (Proof of Ownership)',
  'Registration plate does not match submitted logbook details',
  'Missing or expired Commercial / PSV Insurance Certificate',
  'Missing or expired NTSA Roadworthiness Inspection Certificate',
  'Exterior vehicle photos are blurry, dark, or taken from inadequate angles',
  'Missing clear rear perspective photo with visible registration plate',
  'Vehicle model year does not meet platform luxury minimum criteria (2017+)',
  'Daily rental base rate is calibrated outside luxury market benchmarks',
  'Vehicle bodywork, paint, or interior condition requires detailing/servicing',
  'Duplicate or inconsistent vehicle photos submitted',
];

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  vehicle,
  hostName,
  hostPhone,
  hostEmail,
  onApprove,
  onReject,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'PHOTOS' | 'DOCUMENTS' | 'REJECT_REASONS' | 'WHATSAPP_PREVIEW'>('PHOTOS');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState<VehicleDocument | null>(null);

  const vehicleImages = useMemo(() => {
    return vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : ['/vehicles/prado-front.jpg', '/vehicles/prado-rear.jpg'];
  }, [vehicle.images]);

  const vehicleDocs = useMemo(() => {
    return ensureVehicleComplianceDocs(vehicle.id, vehicle);
  }, [vehicle]);

  const hasLogbook = vehicleDocs.some(d => d.type === 'LOGBOOK');
  const hasInsurance = vehicleDocs.some(d => d.type === 'INSURANCE');

  const [selectedReasons, setSelectedReasons] = useState<string[]>(() => {
    const initial: string[] = [];
    if (!hasLogbook) initial.push('Missing or unverified Vehicle Logbook (Proof of Ownership)');
    if (!hasInsurance) initial.push('Missing or expired Commercial / PSV Insurance Certificate');
    return initial;
  });

  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState(false);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSelectMissingDocsReasons = () => {
    const missing: string[] = [];
    if (!hasLogbook) missing.push('Missing or unverified Vehicle Logbook (Proof of Ownership)');
    if (!hasInsurance) missing.push('Missing or expired Commercial / PSV Insurance Certificate');
    setSelectedReasons((prev) => Array.from(new Set([...prev, ...missing])));
  };

  const handleConfirmReject = () => {
    const finalReasons = selectedReasons.length > 0
      ? selectedReasons
      : ['Quality, compliance, or roadworthiness adjustments required'];
    setIsRejecting(true);
    setTimeout(() => {
      onReject(finalReasons, customFeedback);
      setIsRejecting(false);
      onClose();
    }, 300);
  };

  const previewWhatsAppUrl = useMemo(() => {
    return getHostRejectionWhatsAppUrl({
      hostName,
      hostPhone,
      vehicle,
      reasons: selectedReasons.length > 0 ? selectedReasons : ['Compliance standards review required'],
      customFeedback,
    });
  }, [hostName, hostPhone, vehicle, selectedReasons, customFeedback]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xs font-display overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition z-10"
          title="Close Inspector"
        >
          <X className="h-4 w-4" />
        </button>

        {/* HEADER */}
        <div className="shrink-0 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Admin Inspection Station
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Plate: <strong className="text-white">{vehicle.plateNumber || 'Pending'}</strong>
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-white mt-1">
                {vehicle.make} {vehicle.model} ({vehicle.year || 2024})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fleet Host: <strong className="text-slate-200">{hostName}</strong> ({hostPhone || '0712345678'}) · {hostEmail || 'host@mtravel.co.ke'}
              </p>
            </div>

            {/* QUICK STATS PILL */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 px-4 text-xs font-mono">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Rate / Day</p>
                <p className="font-bold text-amber-400">KES {Number(vehicle.pricePerDay || 15000).toLocaleString()}</p>
              </div>
              <div className="h-6 w-px bg-slate-800 mx-1" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Documents</p>
                <p className={`font-bold ${vehicleDocs.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {vehicleDocs.length} Attached
                </p>
              </div>
            </div>
          </div>

          {/* INSPECTION TABS */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('PHOTOS')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PHOTOS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>1. Vehicle Photos ({vehicleImages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'DOCUMENTS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>2. Documents Inspection ({vehicleDocs.length})</span>
              {!hasLogbook && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Missing Logbook" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REJECT_REASONS')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'REJECT_REASONS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>3. Rejection Reasons ({selectedReasons.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WHATSAPP_PREVIEW')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'WHATSAPP_PREVIEW'
                  ? 'bg-[#25D366] text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>4. WhatsApp Message Preview</span>
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE TAB CONTENT AREA ── */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 pr-1 space-y-4">
          {/* ── TAB 1: VEHICLE PHOTOS DETAILED INSPECTION ── */}
          {activeTab === 'PHOTOS' && (
            <div className="space-y-4 pt-2">
              {/* MAIN PHOTO DISPLAY */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-[260px] sm:h-[340px] max-h-[45vh]">
              <img
                src={vehicleImages[selectedPhotoIndex] || vehicleImages[0]}
                alt="Selected Vehicle Perspective"
                className={`w-full h-full object-contain transition-transform duration-200 ${isPhotoZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
              />

              {/* PERSPECTIVE BADGE */}
              <div className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-xs px-3 py-1 text-[11px] font-mono font-bold text-amber-400 border border-white/10">
                {selectedPhotoIndex === 0 ? 'Front View' : selectedPhotoIndex === 1 ? 'Back / Rear View' : `Photo #${selectedPhotoIndex + 1}`}
              </div>

              {/* ZOOM CONTROLS */}
              <button
                type="button"
                onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                className="absolute top-3 right-3 rounded-xl bg-black/70 hover:bg-black/90 p-2 text-white/80 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              >
                <ZoomIn className="h-4 w-4 text-amber-400" />
                <span>{isPhotoZoomed ? 'Reset Zoom' : 'Zoom 125%'}</span>
              </button>

              {/* NEXT / PREV BUTTONS */}
              {vehicleImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(prev => prev === 0 ? vehicleImages.length - 1 : prev - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 p-2 text-white transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(prev => prev === vehicleImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 p-2 text-white transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAIL REEL */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {vehicleImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setSelectedPhotoIndex(idx); setIsPhotoZoomed(false); }}
                  className={`relative h-18 w-28 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    selectedPhotoIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono text-center text-white py-0.5 truncate">
                    {idx === 0 ? 'Front' : idx === 1 ? 'Rear' : `Extra ${idx - 1}`}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
              <span>💡 Tip: Click on the image to toggle high-resolution zoom to inspect license plates and exterior condition.</span>
              <button
                type="button"
                onClick={() => setActiveTab('DOCUMENTS')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <span>Proceed to Documents ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: COMPLIANCE DOCUMENTS INSPECTION ── */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-4 pt-4">
            {/* MISSING DOCUMENTS ALERT BANNER IF APPLICABLE */}
            {(!hasLogbook || !hasInsurance) && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Missing Critical Documentation Detected:
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectMissingDocsReasons}
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1 transition"
                  >
                    Auto-Add to Rejection Reasons
                  </button>
                </div>
                <div className="grid gap-1 pl-5 text-rose-200 text-[11px] list-disc">
                  {!hasLogbook && <p>• <strong>Vehicle Logbook</strong> (Proof of Title) was NOT provided during registration.</p>}
                  {!hasInsurance && <p>• <strong>Commercial Insurance Certificate</strong> was NOT provided during registration.</p>}
                </div>
              </div>
            )}

            {/* DOCUMENTS GRID */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* 1. LOGBOOK CARD */}
              {(() => {
                const logbookDoc = vehicleDocs.find(d => d.type === 'LOGBOOK');
                return (
                  <div className={`rounded-2xl border p-4 transition ${logbookDoc ? 'border-emerald-500/40 bg-[#0e1c18]' : 'border-slate-800 bg-slate-950'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-xl p-2.5 ${logbookDoc ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">1. Vehicle Logbook</h4>
                          <p className="text-xs text-slate-400">Proof of Ownership / Registration</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${logbookDoc ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                        {logbookDoc ? 'Attached' : 'Missing'}
                      </span>
                    </div>

                    {logbookDoc ? (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="truncate max-w-[180px]">{logbookDoc.fileName} ({logbookDoc.fileSize})</span>
                        <button
                          type="button"
                          onClick={() => setPreviewingDoc(logbookDoc)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 text-xs flex items-center gap-1 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-500">
                        No logbook attached. Approval should be withheld until host uploads verified proof of ownership.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 2. INSURANCE CARD */}
              {(() => {
                const insDoc = vehicleDocs.find(d => d.type === 'INSURANCE');
                return (
                  <div className={`rounded-2xl border p-4 transition ${insDoc ? 'border-emerald-500/40 bg-[#0e1c18]' : 'border-slate-800 bg-slate-950'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-xl p-2.5 ${insDoc ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">2. Commercial Insurance</h4>
                          <p className="text-xs text-slate-400">Comprehensive Chauffeur/Hire Cover</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${insDoc ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}`}>
                        {insDoc ? 'Attached' : 'Unattached'}
                      </span>
                    </div>

                    {insDoc ? (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="truncate max-w-[180px]">{insDoc.fileName} ({insDoc.fileSize})</span>
                        <button
                          type="button"
                          onClick={() => setPreviewingDoc(insDoc)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 text-xs flex items-center gap-1 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-500">
                        No commercial insurance certificate attached. Ensure valid policy coverage before approving.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 3. NTSA INSPECTION CARD */}
              {(() => {
                const ntsaDoc = vehicleDocs.find(d => d.type === 'INSPECTION_CERT');
                return (
                  <div className={`rounded-2xl border p-4 transition ${ntsaDoc ? 'border-emerald-500/40 bg-[#0e1c18]' : 'border-slate-800 bg-slate-950'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-xl p-2.5 ${ntsaDoc ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">3. Roadworthiness Cert</h4>
                          <p className="text-xs text-slate-400">NTSA inspection report / sticker</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ntsaDoc ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                        {ntsaDoc ? 'Attached' : 'Optional'}
                      </span>
                    </div>

                    {ntsaDoc ? (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="truncate max-w-[180px]">{ntsaDoc.fileName} ({ntsaDoc.fileSize})</span>
                        <button
                          type="button"
                          onClick={() => setPreviewingDoc(ntsaDoc)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 text-xs flex items-center gap-1 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-500">
                        NTSA roadworthiness certificate not provided.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 4. OTHER ATTACHED DOCUMENTS */}
              {(() => {
                const otherDocs = vehicleDocs.filter(d => d.type === 'OTHER');
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-slate-800 text-slate-400 p-2.5">
                          <Paperclip className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">4. Extra Supporting Docs</h4>
                          <p className="text-xs text-slate-400">Host ID, service records or permits</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-800 text-slate-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {otherDocs.length} File(s)
                      </span>
                    </div>

                    {otherDocs.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-slate-800 pt-2">
                        {otherDocs.map((d) => (
                          <div key={d.id} className="flex items-center justify-between text-xs font-mono text-slate-300">
                            <span className="truncate max-w-[180px]">{d.fileName}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(d)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 text-[11px] font-bold"
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-500">
                        No additional supporting documents submitted.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── TAB 3: REJECTION REASONS & CUSTOM NOTES ── */}
        {activeTab === 'REJECT_REASONS' && (
          <div className="space-y-4 pt-4">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-rose-300">
                    Select Rejection Audit Items for Host Notice:
                  </h4>
                  <p className="text-xs text-slate-400">
                    Checked items are included automatically in the WhatsApp message sent to {hostName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReasons([])}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 pt-1">
                {MANUAL_REJECTION_REASONS.map((reason) => {
                  const isChecked = selectedReasons.includes(reason);
                  return (
                    <label
                      key={reason}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition ${
                        isChecked
                          ? 'border-rose-500/60 bg-rose-950/40 text-rose-100'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleReason(reason)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span className="leading-snug text-[11px]">{reason}</span>
                    </label>
                  );
                })}
              </div>

              {/* CUSTOM FEEDBACK / INSPECTOR NOTES */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Custom Admin Inspector Notes (Appended directly to the WhatsApp Message):
                </label>
                <textarea
                  rows={3}
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  placeholder="e.g. Please scan and upload your official NTSA logbook. Also ensure the rear photo clearly displays plate number KDA 123A without sun glare..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: LIVE WHATSAPP MESSAGE PREVIEW ── */}
        {activeTab === 'WHATSAPP_PREVIEW' && (
          <div className="space-y-4 pt-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0d141e] p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Live Host WhatsApp Notice Preview
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Recipient: {hostPhone || '+254712345678'}</span>
                  <a
                    href={previewWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded transition"
                  >
                    <span>Test WhatsApp Link</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-slate-200 whitespace-pre-wrap leading-relaxed">
                {`🛡️ *M-TRAVEL LUXURY FLEET — VEHICLE REGISTRATION REVIEW* 🛡️\n` +
                 `*OFFICIAL INSPECTION & ONBOARDING FEEDBACK*\n\n` +
                 `Dear *${hostName}*,\n\n` +
                 `Thank you for registering your *${vehicle.make} ${vehicle.model} (${vehicle.year || 2024})* on M-TRAVEL.\n\n` +
                 `Our Quality Assurance and Fleet Operations team has reviewed your submitted photos, specifications, and compliance documentation. At this time, the vehicle *COULD NOT BE APPROVED* for live marketplace booking due to the following item(s):\n\n` +
                 `📋 *Required Adjustments:*\n` +
                 (selectedReasons.length > 0 ? selectedReasons.map(r => `• ⚠️ *${r}*`).join('\n') : '• ⚠️ Quality and roadworthiness standards revision required') +
                 (customFeedback ? `\n\n📝 *Quality Inspector Notes:*\n${customFeedback}` : '') +
                 `\n\n🔧 *How to Re-Submit:*\n` +
                 `1. Log in to your Fleet Host Dashboard: https://m-travel.co.ke/dashboard/owner?tab=add\n` +
                 `2. Upload clear scanned copies of your vehicle logbook and commercial insurance.\n` +
                 `3. Verify exterior front & rear photos with readable registration plates.\n\n` +
                 `M-TRAVEL Fleet Quality Assurance · Partner Desk: host@mtravel.co.ke`}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* ── MODAL ACTIONS BAR ── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Close Inspector
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* REJECT & SEND WHATSAPP NOTICE */}
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={isRejecting}
              className="rounded-xl border border-rose-500/40 bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isRejecting ? 'Sending Notice…' : `Reject & Send WhatsApp Notice (${selectedReasons.length} reason${selectedReasons.length === 1 ? '' : 's'})`}</span>
            </button>

            {/* APPROVE LIVE BUTTON */}
            <button
              type="button"
              onClick={onApprove}
              className="btn-primary !py-2.5 !px-5 text-xs font-bold shadow-md text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Approve Live &amp; Send WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT FULL-SCREEN INSPECTION LIGHTBOX ── */}
      {previewingDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-white">{previewingDoc.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{previewingDoc.fileName} • {previewingDoc.fileSize || 'Attached File'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-slate-950 p-2 flex items-center justify-center border border-slate-800">
              {previewingDoc.fileUrl.startsWith('data:image/') || previewingDoc.fileUrl.includes('unsplash') || previewingDoc.fileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={previewingDoc.fileUrl} alt={previewingDoc.name} className="max-h-[65vh] w-auto rounded-lg object-contain" />
              ) : (
                <div className="p-10 text-center space-y-4">
                  <FileText className="h-16 w-16 text-amber-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-white text-base">PDF Document Verified</h4>
                    <p className="text-xs text-slate-400 mt-1">Full compliance document available for inspection.</p>
                  </div>
                  <a
                    href={previewingDoc.fileUrl}
                    download={previewingDoc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 text-xs font-bold text-white !py-2.5 !px-5 shadow-sm"
                  >
                    <Download className="h-4 w-4" /> Open / Download PDF
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Close Document Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
