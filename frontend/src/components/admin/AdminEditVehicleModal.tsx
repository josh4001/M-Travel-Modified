import React, { useState } from 'react';
import {
  X, DollarSign, FileText, CheckCircle2, AlertTriangle,
  Upload, Eye, Sparkles, ShieldCheck,
  Car, MessageSquare, RefreshCw, FileCheck
} from 'lucide-react';
import type { StoredVehicle, VehicleDocument } from '@/lib/bookingStore';
import {
  ensureVehicleComplianceDocs,
  updateStoredVehicle,
  saveVehicleDocuments,
  isBusVehicle
} from '@/lib/bookingStore';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import { logAuditEvent } from '@/lib/rentalLifecycleStore';

interface AdminEditVehicleModalProps {
  vehicle: StoredVehicle;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  adminName: string;
  adminRole: string;
  onSave: (updatedVehicle: StoredVehicle) => void;
  onClose: () => void;
}

export const AdminEditVehicleModal: React.FC<AdminEditVehicleModalProps> = ({
  vehicle,
  hostName,
  hostPhone,
  hostEmail,
  adminName,
  adminRole,
  onSave,
  onClose,
}) => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'PRICING' | 'DOCUMENTS' | 'SPECS' | 'AUDIT'>('PRICING');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [pricePerDay, setPricePerDay] = useState<number>(vehicle.pricePerDay || 15000);
  const [pricePerKm, setPricePerKm] = useState<number | undefined>((vehicle as any).pricePerKm);
  const [make, setMake] = useState<string>(vehicle.make || '');
  const [model, setModel] = useState<string>(vehicle.model || '');
  const [year, setYear] = useState<number>(vehicle.year || 2024);
  const [type, setType] = useState<string>(vehicle.type || 'SUV');
  const [plateNumber, setPlateNumber] = useState<string>(vehicle.plateNumber || '');
  const [seats, setSeats] = useState<number>(vehicle.seats || 7);
  const [fuelType, setFuelType] = useState<string>(vehicle.fuelType || 'DIESEL');
  const [transmission, setTransmission] = useState<string>(vehicle.transmission || 'AUTOMATIC');
  const [address, setAddress] = useState<string>(vehicle.address || 'Nairobi Central');
  const [hasInsurance, setHasInsurance] = useState<boolean>(vehicle.hasInsurance !== false);
  const [isSelfDriveAvailable, setIsSelfDriveAvailable] = useState<boolean>(vehicle.isSelfDriveAvailable !== false);
  const [isWithDriverAvailable, setIsWithDriverAvailable] = useState<boolean>(vehicle.isWithDriverAvailable !== false);
  const [driverName, setDriverName] = useState<string>(vehicle.driverName || '');
  const [driverPhone, setDriverPhone] = useState<string>(vehicle.driverPhone || '');

  // Documents State
  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    return ensureVehicleComplianceDocs(vehicle.id, vehicle);
  });

  // Audit / Host Request Reason
  const [modificationReason, setModificationReason] = useState<string>('');
  const [notifyHostViaWhatsApp, setNotifyHostViaWhatsApp] = useState<boolean>(true);

  // Common quick adjustment presets for daily rate
  const adjustPrice = (delta: number) => {
    setPricePerDay(prev => Math.max(1000, prev + delta));
  };

  const handleDocumentStatusChange = (docId: string, status: 'VERIFIED' | 'PENDING' | 'REJECTED') => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
  };

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please upload a compressed document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setDocuments(prev => prev.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            fileUrl: result,
            fileName: file.name,
            fileSize: sizeFormatted,
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
            isRealUpload: true,
          };
        }
        return d;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewDocument = () => {
    const docName = prompt('Enter the name of the new compliance document (e.g. Speed Governor Certificate, PSV Badge):');
    if (!docName || !docName.trim()) return;

    const newDoc: VehicleDocument = {
      id: `doc-custom-${Date.now()}`,
      name: docName.trim(),
      type: 'OTHER',
      fileUrl: '/vehicles/permit-sample.svg',
      fileName: `${docName.trim().toLowerCase().replace(/\s+/g, '-')}.pdf`,
      fileSize: '180 KB',
      uploadedAt: new Date().toISOString(),
      status: 'VERIFIED',
      isRealUpload: false,
    };

    setDocuments(prev => [...prev, newDoc]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const cleanPlate = plateNumber.trim().toUpperCase();
      const updatedFields: Partial<StoredVehicle> = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        type,
        plateNumber: cleanPlate || undefined,
        pricePerDay: Number(pricePerDay),
        seats: Number(seats),
        fuelType,
        transmission,
        address: address.trim(),
        hasInsurance,
        isSelfDriveAvailable,
        isWithDriverAvailable,
        driverName: isWithDriverAvailable ? driverName.trim() : undefined,
        driverPhone: isWithDriverAvailable ? driverPhone.trim() : undefined,
        documents,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update local reactive store & persistent vault
      const updated = updateStoredVehicle(vehicle.id, updatedFields);
      if (!updated) {
        throw new Error('Vehicle record could not be found in local store.');
      }
      saveVehicleDocuments(vehicle.id, documents);

      // 2. Sync to Supabase in the background
      try {
        await supabase.from('vehicles').update({
          make: updatedFields.make,
          model: updatedFields.model,
          year: updatedFields.year,
          type: updatedFields.type?.toUpperCase(),
          seats: updatedFields.seats,
          fuel_type: updatedFields.fuelType?.toUpperCase(),
          transmission: updatedFields.transmission?.toUpperCase(),
          price_per_day: updatedFields.pricePerDay,
          price_per_km: pricePerKm || null,
          plate_number: cleanPlate || null,
          has_insurance: hasInsurance,
          is_self_drive_available: isSelfDriveAvailable,
          is_with_driver_available: isWithDriverAvailable,
          address: updatedFields.address,
          updated_at: new Date().toISOString(),
        }).eq('id', vehicle.id);
      } catch (dbErr) {
        console.warn('Supabase vehicle update non-blocking notice:', dbErr);
      }

      // 3. Log administrative audit trail
      const auditSummary = modificationReason.trim()
        ? `Admin ${adminName} updated ${make} ${model} (${cleanPlate || 'Pending'}): ${modificationReason.trim()} [Daily Rate: KES ${pricePerDay.toLocaleString()}]`
        : `Admin ${adminName} modified vehicle specifications and documentation for ${make} ${model} (${cleanPlate || 'Pending'}) [Daily Rate: KES ${pricePerDay.toLocaleString()}]`;

      logAuditEvent(
        'VEHICLE_MODIFIED_BY_ADMIN',
        'Vehicle',
        vehicle.id,
        auditSummary,
        adminName,
        adminRole
      );

      // 4. Notify Host via WhatsApp if requested
      if (notifyHostViaWhatsApp && hostPhone) {
        const cleanHostPhone = hostPhone.replace(/[^0-9]/g, '');
        const targetNumber = cleanHostPhone.startsWith('0')
          ? `254${cleanHostPhone.slice(1)}`
          : cleanHostPhone.startsWith('254')
          ? cleanHostPhone
          : `254${cleanHostPhone}`;

        const waText = encodeURIComponent(
          `*M-TRAVEL FLEET MANAGEMENT NOTICE*\n\n` +
          `Dear ${hostName},\n\n` +
          `This is an official confirmation from M-TRAVEL Administration that your vehicle *${make} ${model} (${cleanPlate || 'Registered'})* details have been updated in the platform system:\n\n` +
          `• *Daily Hiring Rate:* KES ${pricePerDay.toLocaleString()} / day\n` +
          `• *Seating Capacity:* ${seats} Passengers\n` +
          `• *Service Modes:* ${isSelfDriveAvailable ? 'Self-Drive' : ''} ${isWithDriverAvailable ? '• Chauffeur Available' : ''}\n` +
          `• *Compliance Documents:* ${documents.length} Records Verified\n` +
          `${modificationReason.trim() ? `• *Admin Note:* ${modificationReason.trim()}\n` : ''}\n` +
          `Your vehicle is active in the live fleet catalogue. For any further adjustments, feel free to reach out.\n\n` +
          `Best regards,\n*M-TRAVEL Operations & Fleet Desk*`
        );

        window.open(`https://wa.me/${targetNumber}?text=${waText}`, '_blank');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onSave(updated);
      }, 700);
    } catch (err: any) {
      console.error('Failed to update vehicle:', err);
      setErrorMessage(err.message || 'An error occurred while updating the vehicle.');
      setIsSaving(false);
    }
  };

  const isBus = isBusVehicle(vehicle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 md:p-6 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto text-slate-900 font-sans">
        {/* GOLD LUXURY TOP ACCENT */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shrink-0" />

        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 border border-purple-200 px-3 py-0.5 text-xs font-bold text-purple-900 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-700" /> Admin Fleet Override
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {vehicle.id.slice(0, 8)}...</span>
              {isBus && (
                <span className="rounded-full bg-teal/10 border border-teal/20 px-2.5 py-0.5 text-[11px] font-bold text-teal">
                  Tour Bus / Coach
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-950">
              Modify Vehicle &amp; Documentation
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Registered to Host: <strong className="text-slate-900">{hostName}</strong>
              {hostPhone && <span className="ml-2 font-mono">({hostPhone})</span>}
              {hostEmail && <span className="ml-2 text-slate-500">• {hostEmail}</span>}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          {[
            { id: 'PRICING' as const, label: 'Pricing & Hiring Rates', icon: DollarSign },
            { id: 'DOCUMENTS' as const, label: `Compliance Docs (${documents.length})`, icon: FileText },
            { id: 'SPECS' as const, label: 'Specifications & Plate', icon: Car },
            { id: 'AUDIT' as const, label: 'Admin Audit & Host Notice', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Vehicle information and compliance documents saved successfully! Refreshing view...</span>
            </div>
          )}

          {/* ── TAB 1: PRICING & HIRING RATES ── */}
          {activeTab === 'PRICING' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Fleet Host Pricing Override</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  Modify the base rate charged to travelers hiring this vehicle. Changes take effect immediately in the traveler marketplace, search results, and booking checkout.
                </p>
              </div>

              {/* DAILY RATE INPUT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Daily Hiring Rate (KES / 24 Hours) *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3 text-sm font-bold text-slate-500 font-mono">KES</span>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={pricePerDay}
                      onChange={e => setPricePerDay(Number(e.target.value) || 0)}
                      className="input-field pl-16 text-lg font-bold font-mono text-slate-900 border-slate-300 focus:border-purple-600"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center shrink-0">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Formatted Preview</span>
                    <span className="text-base font-bold text-purple-950 font-serif">{formatPrice(pricePerDay)}/day</span>
                  </div>
                </div>

                {/* Quick adjustment pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Quick Adjust:</span>
                  {[
                    { label: '- KES 2,000', delta: -2000 },
                    { label: '- KES 1,000', delta: -1000 },
                    { label: '- KES 500', delta: -500 },
                    { label: '+ KES 500', delta: 500 },
                    { label: '+ KES 1,000', delta: 1000 },
                    { label: '+ KES 2,000', delta: 2000 },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => adjustPrice(btn.delta)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Optional Per-Km / Excess Mileage Rate */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Optional Per-Km Rate (KES / km)</label>
                    <span className="text-[11px] text-slate-500">Applicable for extra mileage or inter-county journeys</span>
                  </div>
                  <div className="w-full sm:w-44">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      placeholder="e.g. 80"
                      value={pricePerKm || ''}
                      onChange={e => setPricePerKm(e.target.value ? Number(e.target.value) : undefined)}
                      className="input-field text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SERVICE OFFERINGS & DRIVER OPTIONS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hire Modes &amp; Chauffeur Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={isSelfDriveAvailable}
                      onChange={e => setIsSelfDriveAvailable(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Self-Drive Permitted</span>
                      <span className="text-[11px] text-slate-500">Traveler drives vehicle independently upon verification</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={isWithDriverAvailable}
                      onChange={e => setIsWithDriverAvailable(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Chauffeur Service Available</span>
                      <span className="text-[11px] text-slate-500">Includes certified professional tour driver / chauffeur</span>
                    </div>
                  </label>
                </div>

                {isWithDriverAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designated Driver Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Peter Otieno"
                        value={driverName}
                        onChange={e => setDriverName(e.target.value)}
                        className="input-field text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +254712345678"
                        value={driverPhone}
                        onChange={e => setDriverPhone(e.target.value)}
                        className="input-field text-xs text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: COMPLIANCE DOCUMENTS & VERIFICATION ── */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vehicle Compliance Documents &amp; Permits</h3>
                  <p className="text-xs text-slate-500">Inspect, verify, replace, or upload updated host documentation.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewDocument}
                  className="rounded-xl border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Add Supplementary Document</span>
                </button>
              </div>

              {/* DOCUMENT CARDS LIST */}
              <div className="space-y-3">
                {documents.map((doc, idx) => {
                  const isVerified = doc.status === 'VERIFIED';
                  const isRejected = doc.status === 'REJECTED';

                  return (
                    <div
                      key={doc.id || idx}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            isRejected ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isVerified ? 'bg-emerald-100 text-emerald-800' :
                                isRejected ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {doc.status || 'PENDING'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                              {doc.fileName} {doc.fileSize && `• ${doc.fileSize}`}
                            </p>
                          </div>
                        </div>

                        {/* DOCUMENT ACTIONS */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* VIEW DOCUMENT */}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </a>

                          {/* REPLACE / UPLOAD FILE */}
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Replace File</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => handleFileUpload(doc.id, e)}
                            />
                          </label>

                          {/* STATUS TOGGLE */}
                          <select
                            value={doc.status || 'PENDING'}
                            onChange={(e) => handleDocumentStatusChange(doc.id, e.target.value as any)}
                            className="text-xs font-bold rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-slate-800 focus:border-purple-600"
                          >
                            <option value="VERIFIED">✅ Verified</option>
                            <option value="PENDING">⏳ Pending Review</option>
                            <option value="REJECTED">❌ Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 3: SPECIFICATIONS & REGISTRATION PLATE ── */}
          {activeTab === 'SPECS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Make *</label>
                  <input
                    type="text"
                    value={make}
                    onChange={e => setMake(e.target.value)}
                    className="input-field text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="input-field text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Model Year *</label>
                  <input
                    type="number"
                    min={2000}
                    max={2030}
                    value={year}
                    onChange={e => setYear(Number(e.target.value) || 2024)}
                    className="input-field text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Registration Plate *</label>
                  <input
                    type="text"
                    placeholder="e.g. KDL 452X"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                    className="input-field text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Body Type / Category *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="input-field text-xs text-slate-900"
                  >
                    <option value="SUV">SUV (e.g. Prado, Cruiser)</option>
                    <option value="VAN">Safari Van / Tour Minibus</option>
                    <option value="SEDAN">Luxury Sedan</option>
                    <option value="BUS">Bus / Coach (Large Group)</option>
                    <option value="LUXURY">Ultra-Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Passenger Seats *</label>
                  <input
                    type="number"
                    min={1}
                    max={65}
                    value={seats}
                    onChange={e => setSeats(Number(e.target.value) || 7)}
                    className="input-field text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value)}
                    className="input-field text-xs text-slate-900"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className="input-field text-xs text-slate-900"
                  >
                    <option value="AUTOMATIC">Automatic</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Operating Hub / Address *</label>
                <input
                  type="text"
                  placeholder="e.g. Westlands, Nairobi / Mombasa CBD"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="input-field text-xs text-slate-900"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={e => setHasInsurance(e.target.checked)}
                    className="h-4 w-4 rounded text-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-800">Commercial / Comprehensive Insurance Verified Active</span>
                </label>
              </div>
            </div>
          )}

          {/* ── TAB 4: ADMIN AUDIT & HOST NOTIFICATION NOTE ── */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
                  Modification Traceability &amp; Fleet Host Record
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Document the reason for this vehicle modification (e.g. host pricing adjustment request, document renewal, or administrative plate correction). This reason is logged permanently in the system audit trail.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Modification / Host Request Note *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Adjusted daily hiring rate to KES 14,000 as requested by host via phone. Verified and replaced updated comprehensive insurance certificate."
                  value={modificationReason}
                  onChange={e => setModificationReason(e.target.value)}
                  className="input-field text-xs text-slate-900 leading-relaxed"
                />
              </div>

              {/* Clickable Quick Reason Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Adjusted daily hiring rate per host phone / WhatsApp request',
                    'Replaced expired commercial insurance certificate with renewed cover note',
                    'Updated NTSA annual roadworthiness inspection certificate',
                    'Corrected vehicle registration plate and seating capacity specs',
                    'Enabled chauffeur option and registered designated driver details',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setModificationReason(preset)}
                      className="text-left text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyHostViaWhatsApp}
                    onChange={e => setNotifyHostViaWhatsApp(e.target.checked)}
                    className="h-4 w-4 rounded text-purple-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Dispatch official WhatsApp update notice to Host
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Opens WhatsApp message pre-filled with the updated daily rate, specifications, and confirmation of verified documents upon saving.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Administrator: <strong className="text-slate-800">{adminName}</strong> ({adminRole})
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial btn-primary !py-2.5 !px-5 text-xs font-bold shadow-md bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Save Vehicle &amp; Docs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
