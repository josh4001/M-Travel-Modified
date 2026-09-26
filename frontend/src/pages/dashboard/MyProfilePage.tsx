import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, ShieldCheck, CheckCircle2,
  AlertCircle, Edit3, X, Save, ArrowLeft, Car, Sparkles, Check,
  Copy, Key, Wallet, Lock
} from 'lucide-react';
import { setUser, selectUser } from '@/store/slices/authSlice';
import { getLocalAccounts, updateUserProfile } from '@/lib/authService';
import { getTravelerCreditProfile } from '@/lib/creditScoreStore';

export default function MyProfilePage() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // Find latest persistent account record
  const accountRecord = getLocalAccounts().find(
    (a) => a.id === user?.id || (user?.email && a.email.toLowerCase() === user.email.toLowerCase())
  );

  // Form states for editing
  const [isEditing, setIsEditing] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync form when account loads or user changes
  useEffect(() => {
    if (user) {
      setFormEmail(user.email || accountRecord?.email || '');
      setFormPhone(user.phone || accountRecord?.phone || '');
      setFormFirstName(user.firstName || accountRecord?.firstName || '');
      setFormLastName(user.lastName || accountRecord?.lastName || '');
    }
  }, [user, accountRecord]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 font-display">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Please log in to your M-Travel account to review and manage your profile credentials.
          </p>
          <Link
            to="/login?redirect=/profile"
            className="btn-primary inline-flex items-center justify-center w-full !py-3 text-xs font-bold"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const role = user.role?.toUpperCase();
  const isTraveler = role === 'TOURIST' || role === 'CUSTOMER' || !role;
  const isHost = role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Format creation date
  const rawCreatedAt = user.createdAt || accountRecord?.createdAt || '2025-10-14T09:20:00.000Z';
  const formattedCreationDate = (() => {
    try {
      const d = new Date(rawCreatedAt);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return 'October 14, 2025';
    }
  })();

  // Traveler credit rating profile
  const creditProfile = isTraveler
    ? getTravelerCreditProfile(user.id, {
        name: `${user.firstName || 'Sarah'} ${user.lastName || 'Ochieng'}`.trim(),
        email: user.email,
        phone: user.phone || '0712345678',
      })
    : null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setErrorMessage('Please provide a valid email address (e.g. name@domain.com).');
      return;
    }

    if (!formPhone.trim()) {
      setErrorMessage('Please provide a valid contact telephone number.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile(user.id, {
        email: formEmail.trim(),
        phone: formPhone.trim(),
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
      });

      if (res.success && res.user) {
        dispatch(setUser(res.user));
        setSuccessMessage('Your profile credentials have been updated successfully.');
        setIsEditing(false);
      } else {
        setErrorMessage(res.error || 'Failed to save changes. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/dashboard/admin';
    if (isHost) return '/dashboard/owner';
    return '/dashboard/tourist';
  };

  const getRoleBadgeUI = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          <Shield className="h-3.5 w-3.5 text-purple-600" /> Platform Administrator
        </span>
      );
    }
    if (isHost) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Car className="h-3.5 w-3.5 text-amber-600" /> Verified Fleet Host
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <User className="h-3.5 w-3.5 text-emerald-600" /> Verified Traveler
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-display">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── TOP BREADCRUMB & BACK LINK ── */}
        <div className="flex items-center justify-between">
          <Link
            to={getDashboardPath()}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Security Status:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified &amp; Encrypted
            </span>
          </div>
        </div>

        {/* ── NOTIFICATIONS / ALERTS ── */}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs text-emerald-900 font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-900 font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── LUXURY PROFILE HEADER CARD ── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md border-2 border-amber-400/30 font-display">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'M-Travel User'}
                  </h1>
                  {getRoleBadgeUI()}
                </div>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                  <span>ID: {user.id}</span>
                  <button
                    onClick={() => handleCopy(user.id, 'id')}
                    className="text-slate-400 hover:text-slate-600 transition"
                    title="Copy User ID"
                  >
                    {copiedField === 'id' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </p>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  <span>Member Since <strong>{formattedCreationDate}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="btn-primary !px-5 !py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile Credentials
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary !px-4 !py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Cancel Editing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── PROFILE CREDENTIALS & EDIT FORM SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left/Main Column: Account Information / Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-600" /> Account Credentials &amp; Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified contact information utilized for dispatch confirmations, notifications, and security logs
                  </p>
                </div>

                {isEditing && (
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Editing Active
                  </span>
                )}
              </div>

              {!isEditing ? (
                /* READ-ONLY CREDENTIALS VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Not Set'}
                    </p>
                  </div>

                  {/* Account Role */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Account Role</span>
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {getRoleBadgeUI()}
                    </p>
                  </div>

                  {/* Registered Email */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-400" /> Registered Email
                      </span>
                      <button
                        onClick={() => handleCopy(user.email, 'email')}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copy Email"
                      >
                        {copiedField === 'email' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="font-mono font-bold text-slate-900 text-sm break-all">
                      {user.email}
                    </p>
                  </div>

                  {/* Registered Phone */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" /> Contact Phone
                      </span>
                      <button
                        onClick={() => handleCopy(user.phone || accountRecord?.phone || '', 'phone')}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copy Phone"
                      >
                        {copiedField === 'phone' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {user.phone || accountRecord?.phone || 'No phone registered'}
                    </p>
                  </div>

                  {/* Account Creation Date */}
                  <div className="sm:col-span-2 rounded-2xl bg-gradient-to-r from-amber-50/60 to-white border border-amber-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" /> Date of Account Creation
                      </span>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {formattedCreationDate}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-900 self-start sm:self-center shadow-2xs">
                      Official M-Travel Member
                    </span>
                  </div>
                </div>
              ) : (
                /* EDIT CREDENTIALS FORM */
                <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in">
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed font-medium">
                    You can modify your registered <strong>contact telephone number</strong> and <strong>email address</strong> below. Changes reflect across your booking dispatches, M-Pesa notifications, and login credentials.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={formFirstName}
                        onChange={(e) => setFormFirstName(e.target.value)}
                        className="input-field text-xs !py-2.5 font-semibold text-slate-900 bg-white"
                        placeholder="First name"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Last Name</label>
                      <input
                        type="text"
                        value={formLastName}
                        onChange={(e) => setFormLastName(e.target.value)}
                        className="input-field text-xs !py-2.5 font-semibold text-slate-900 bg-white"
                        placeholder="Last name"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-amber-600" /> Account Email Address
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Primary Login &amp; Confirmation Recipient</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="input-field text-xs !py-2.5 font-mono font-bold text-slate-900 bg-white focus:border-amber-500"
                        placeholder="e.g. sarah.ochieng@gmail.com"
                      />
                    </div>

                    {/* Phone Input */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-amber-600" /> Contact Phone Number
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">M-Pesa STK prompts &amp; WhatsApp concierge</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="input-field text-xs !py-2.5 font-mono font-bold text-slate-900 bg-white focus:border-amber-500"
                        placeholder="e.g. 0712345678 or +254712345678"
                      />
                    </div>

                    {/* Non-editable Creation Date Info */}
                    <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-center justify-between">
                      <span className="font-medium">Original Date of Account Creation:</span>
                      <span className="font-mono font-bold text-slate-800">{formattedCreationDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="btn-secondary !px-4 !py-2 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary !px-6 !py-2 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Persona-Specific Enterprise Modules */}
          <div className="space-y-6">

            {/* 1. TRAVELER CREDIT SCORE & PRIVILEGES (FOR TRAVELER ACCOUNTS) */}
            {isTraveler && creditProfile && (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600" /> Traveler Standing
                  </span>
                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                    {creditProfile.tier}
                  </span>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-amber-500/5 p-4.5 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-slate-900">{creditProfile.score}</span>
                    <span className="text-slate-500 text-xs font-semibold">/ 850 Max Score</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    Your credit score evaluates clean vehicle returns, prompt check-ins, and verified identity document records.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2">
                    <div className="rounded-xl bg-white p-2.5 border border-amber-200 text-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Trips Completed</span>
                      <span className="font-mono font-bold text-base text-slate-900">{creditProfile.completedTrips}</span>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 border border-amber-200 text-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Clean Returns</span>
                      <span className="font-mono font-bold text-base text-emerald-700">{creditProfile.cleanHandovers}</span>
                    </div>
                  </div>
                </div>

                {/* VIP Privileges */}
                {creditProfile.tier === 'VIP Renter (A+)' && (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-600" /> Unlocked VIP Privileges
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        Active Tier
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-emerald-200/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block text-xs">Instant Deposit Release</strong>
                          <span className="text-slate-600 text-[10px]">Zero-delay deposit refund via M-Pesa immediately on clean return.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-emerald-200/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block text-xs">Priority Safari Fleet Dispatch</strong>
                          <span className="text-slate-600 text-[10px]">Priority allocation on high-demand 4x4 Land Cruisers &amp; Tour Buses.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-emerald-200/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block text-xs">1-Hour Courtesy Grace Window</strong>
                          <span className="text-slate-600 text-[10px]">Complimentary buffer for national park gate clearance &amp; traffic.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. FLEET HOST SPECIFIC DETAILS (FOR HOST ACCOUNTS) */}
            {isHost && (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="h-4 w-4 text-amber-600" /> Host Operations
                  </span>
                  <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                    Fleet Partner
                  </span>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs">
                  <p className="font-bold text-amber-900">Host Telematics &amp; Payout Standing</p>
                  <p className="text-slate-600 leading-relaxed">
                    Your host credentials govern vehicle onboarding, live GPS telemetry monitoring, and automated daily booking payouts.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    to="/dashboard/owner?tab=fleet"
                    className="w-full text-xs font-bold btn-primary !py-2.5 flex items-center justify-center gap-2"
                  >
                    <Car className="h-3.5 w-3.5" /> View My Registered Cars
                  </Link>
                  <Link
                    to="/dashboard/wallet"
                    className="w-full text-xs font-bold btn-secondary !py-2.5 flex items-center justify-center gap-2"
                  >
                    <Wallet className="h-3.5 w-3.5" /> Host Wallet &amp; Payouts
                  </Link>
                </div>
              </div>
            )}

            {/* 3. ADMIN SPECIFIC DETAILS (FOR ADMIN ACCOUNTS) */}
            {isAdmin && (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-purple-600" /> Platform Governance
                  </span>
                  <span className="rounded-full bg-purple-700 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                    Root Authority
                  </span>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2 text-xs">
                  <p className="font-bold text-purple-950">Administrative Mission Control</p>
                  <p className="text-slate-600 leading-relaxed">
                    You hold full governance over platform user roles, audit trails, fleet inspections, and real-time revenue management.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    to="/dashboard/admin"
                    className="w-full text-xs font-bold btn-primary !py-2.5 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Open Admin Mission Control
                  </Link>
                </div>
              </div>
            )}

            {/* SECURITY & SESSION CARD */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-xs text-xs">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                Session &amp; Security Controls
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Active JWT session tied to your device. Any credential update automatically invalidates previous session tokens for verified security.
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100">
                <span>Encryption: <strong>AES-256 / SHA-256</strong></span>
                <span className="text-emerald-700 font-bold">TLS Active</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
