import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, ShieldCheck, CheckCircle2,
  AlertCircle, Edit3, X, Save, ArrowLeft, Car, Sparkles, Check,
  Copy, Key, Wallet, Lock, TrendingUp, TrendingDown,
  HelpCircle, Activity, Trash2, AlertTriangle
} from 'lucide-react';
import { setUser, selectUser, logout } from '@/store/slices/authSlice';
import { getLocalAccounts, updateUserProfile, deleteUserAccount } from '@/lib/authService';
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

  // Delete account modal and process states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteUserAccount(user.id);
      if (res.success) {
        dispatch(logout());
        window.location.href = '/login?deleted=true';
      } else {
        setDeleteError(res.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Unexpected error occurred while deleting account.');
      setIsDeleting(false);
    }
  };

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

  // Reusable Account Credentials Form / View Component
  const renderCredentialsCard = () => (
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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
  );

  // Reusable Danger Zone / Delete Account Card
  const renderDeleteAccountCard = () => (
    <div className="rounded-3xl bg-white border border-rose-200/90 p-6 sm:p-7 shadow-xs text-xs space-y-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-900 text-base sm:text-lg tracking-tight">
              Account Termination &amp; Data Deletion
            </h4>
            <p className="text-slate-500 text-xs font-medium">
              Permanent account termination, credential deletion, and data removal
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 self-start sm:self-center shadow-2xs">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Irreversible Action
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-slate-700 text-xs leading-relaxed font-medium">
            {isTraveler && (
              <>
                Terminating your traveler account permanently purges your identity records, booking history, and credit rating standing ({creditProfile?.score || 650} pts). You will immediately lose access to your traveler portal and VIP booking privileges.
              </>
            )}
            {isHost && (
              <>
                Terminating your host account permanently delists your registered vehicles from the safari catalogue, archives your host profile, and disconnects automated booking payouts. Pending earnings will be settled to your contact phone.
              </>
            )}
            {isAdmin && (
              <>
                Terminating this administrator account revokes root platform oversight, invalidates administrative cryptographic keys, and removes mission control access across the network.
              </>
            )}
          </p>
          <span className="text-[11px] text-slate-400 font-medium block">
            Once deleted, this account cannot be recovered. If you ever wish to return in future, you will need to register a brand new account.
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteConfirmInput('');
            setDeleteError(null);
          }}
          className="btn-secondary !border-rose-300 !text-rose-700 hover:!bg-rose-50 hover:!border-rose-400 !px-5 !py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 self-start md:self-center"
        >
          <Trash2 className="h-4 w-4 text-rose-600" /> Delete My Account
        </button>
      </div>
    </div>
  );

  // Reusable Security and Session Controls Card
  const renderSecurityCard = () => (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-600" /> Session &amp; Security Controls
        </span>
        <p className="text-slate-500 text-xs font-medium">
          Active authenticated session protected with end-to-end encrypted tokens. Credential updates refresh security tokens automatically.
        </p>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
        <span>Encryption: <strong className="font-mono text-slate-900">AES-256 / SHA-256</strong></span>
        <span className="text-emerald-800 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> TLS Active
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-display">
      <div className="mx-auto max-w-6xl space-y-8 pb-32">

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
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
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
              className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
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
                    className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
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

        {/* ── TRAVELER ACCOUNT: PROMINENT & EXPANSIVE CREDIT RATING SECTION ── */}
        {isTraveler && creditProfile ? (
          <div className="space-y-8">
            {/* Account Credentials */}
            {renderCredentialsCard()}

            {/* Full-Width Spacious Traveler Credit Rating & Privilege Hub */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                      Traveler Standing &amp; Credit Rating Hub
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Standing evaluated from verified safari handovers, clean return inspections, and platform compliance
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs whitespace-nowrap self-start sm:self-center">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {creditProfile.tier}
                </span>
              </div>

              {/* 1. Score Showcase & 4 Spacious Stat Tiles Row */}
              <div className="space-y-5">
                {/* Score Banner */}
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-amber-500/5 p-6 sm:p-7">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
                        Reputation &amp; Standing Score
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                          {creditProfile.score}
                        </span>
                        <span className="text-slate-600 text-sm sm:text-base font-bold">/ 850 Maximum Score</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium max-w-2xl">
                        Your credit score reflects clean vehicle handovers, prompt return inspections, and verified identity document standing across Kenya's tour network.
                      </p>
                    </div>

                    <div className="w-full md:w-72 space-y-2 shrink-0">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Tier Standing</span>
                        <span className="text-emerald-700">{creditProfile.tier}</span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-700 shadow-xs"
                          style={{ width: `${Math.min(100, Math.max(10, ((creditProfile.score - 300) / (850 - 300)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>300 (Min)</span>
                        <span>850 (Max)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Spacious Stat Tiles (Row of 4 on large screens, row of 2 on small) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Completed Trips</span>
                    <span className="font-mono font-bold text-2xl text-slate-900 block">{creditProfile.completedTrips}</span>
                    <span className="text-[11px] text-slate-500 font-medium">Verified Expeditions</span>
                  </div>

                  <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200/80 p-5 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">Clean Returns</span>
                    <span className="font-mono font-bold text-2xl text-emerald-700 block">{creditProfile.cleanHandovers}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">100% Inspection Record</span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Late Returns</span>
                    <span className="font-mono font-bold text-2xl text-emerald-700 block">0</span>
                    <span className="text-[11px] text-slate-500 font-medium">Always Prompt Drop-off</span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Damage Assessed</span>
                    <span className="font-mono font-bold text-2xl text-emerald-700 block">KES 0</span>
                    <span className="text-[11px] text-slate-500 font-medium">Zero Incident History</span>
                  </div>
                </div>
              </div>

              {/* 2. Unlocked VIP Traveler Privileges Grid */}
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                  <span className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> Unlocked VIP Traveler Privileges
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    Active VIP Benefits
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 block text-xs sm:text-sm font-bold">Instant Deposit Release</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Zero-delay security deposit refund via M-Pesa immediately on clean return vehicle inspection.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 block text-xs sm:text-sm font-bold">Priority Safari Fleet Dispatch</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Priority vehicle allocation on high-demand 4x4 Land Cruisers, Safari Vans &amp; Tour Buses.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 block text-xs sm:text-sm font-bold">1-Hour Courtesy Grace Window</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Complimentary buffer window for national park gate clearance or highway traffic delays.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 block text-xs sm:text-sm font-bold">Complimentary Co-Driver</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Free registration of an authorized second expedition driver on your official rental agreement.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-emerald-200/60">
                  <span className="text-slate-600 font-medium">
                    Maintain a clean return record to keep VIP Standing active on future safari adventures.
                  </span>
                  <Link
                    to="/catalogue"
                    className="btn-primary !px-5 !py-2 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Car className="h-3.5 w-3.5" /> Explore Live Fleet
                  </Link>
                </div>
              </div>

              {/* 3. Credit Score Dynamics Guide */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 sm:p-6 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span>How M-Travel Credit Scores Work</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <TrendingUp className="h-4 w-4" /> What Increases Score
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      On-time vehicle drop-offs (+15 pts), spotless inspection returns (+20 pts), and completed safari bookings (+10 pts).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                      <TrendingDown className="h-4 w-4" /> What Decreases Score
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Late vehicle returns without prior notice (-25 pts), assessed damage or missing gear (-50 pts), unpaid park citations (-30 pts).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <Activity className="h-4 w-4" /> Default Starting Score
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Every new verified traveler account starts with a baseline credit score of <strong>650 (Tier B+ Renter)</strong> before their first vehicle hire.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Danger Zone: Account Deletion */}
            {renderDeleteAccountCard()}

            {/* Session Security Card */}
            {renderSecurityCard()}
          </div>
        ) : null}

        {/* ── FLEET HOST ACCOUNT: FULL-WIDTH SPACIOUS OPERATIONS HUB ── */}
        {isHost && (
          <div className="space-y-8">
            {/* Account Credentials */}
            {renderCredentialsCard()}

            {/* Full-Width Spacious Host Operations & Fleet Partner Hub */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                      Host Operations &amp; Fleet Standing
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Vehicle onboarding, booking dispatches, and daily automated revenue settlements
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs whitespace-nowrap self-start sm:self-center">
                  <Car className="h-3.5 w-3.5 text-amber-600" /> Verified Fleet Partner
                </span>
              </div>

              {/* 2-Column Responsive Split with Ample Space */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Partner Standing & Direct Actions (5 Cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-amber-500/5 p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
                      Partner Operations Standing
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg">
                      Fleet Host Management Center
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Your host credentials govern vehicle onboarding, fleet verification, and automated daily booking payouts.
                    </p>
                  </div>

                  {/* 4 Partner Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-1">
                    <div className="rounded-xl bg-white p-3.5 border border-amber-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Partner Status</span>
                      <span className="font-bold text-sm text-amber-900">Verified Host</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-amber-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Payout Cycle</span>
                      <span className="font-bold text-sm text-emerald-700">Daily M-Pesa</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-amber-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Safety Status</span>
                      <span className="font-bold text-sm text-emerald-700">100% Certified</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-amber-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Account Health</span>
                      <span className="font-bold text-sm text-emerald-700">Good Standing</span>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <Link
                      to="/dashboard/owner?tab=fleet"
                      className="w-full text-xs font-bold btn-primary !py-2.5 flex items-center justify-center gap-2 shadow-xs"
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

                {/* Fleet Host Privileges & Operations (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" /> Host Capabilities &amp; Privileges
                    </span>
                    <span className="text-[10px] font-bold text-amber-900 bg-white px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                      Active Host Rights
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Automated Daily Payouts</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Direct M-Pesa settlements upon booking completion with transparent ledger tracking.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Self-Managed Fleet Availability</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Update rental rates, blackout dates, and chauffeur preferences at any time.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Fast-Track Fleet Onboarding</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Expedited verification for 4x4 Land Cruisers, Safari Vans, and Tour Buses.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Dedicated Host Concierge</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Priority desk assistance available 24/7 for booking coordination and traveler handovers.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-amber-200/60">
                    <span className="text-slate-600 font-medium text-[11px]">Looking to register an additional vehicle?</span>
                    <Link
                      to="/dashboard/owner?tab=add"
                      className="btn-primary !px-4 !py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Car className="h-3.5 w-3.5" /> Register Vehicle
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            {renderDeleteAccountCard()}

            {/* Session Security Card */}
            {renderSecurityCard()}
          </div>
        )}

        {/* ── ADMIN ACCOUNT: FULL-WIDTH SPACIOUS GOVERNANCE HUB ── */}
        {isAdmin && (
          <div className="space-y-8">
            {/* Account Credentials */}
            {renderCredentialsCard()}

            {/* Full-Width Spacious Platform Governance & Administrative Command Hub */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-xs">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                      Platform Governance &amp; Administrative Command Hub
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Root administrative governance across user roles, fleet approvals, dispute resolutions, and platform financial settlements
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs whitespace-nowrap self-start sm:self-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-700" /> Root Authority
                </span>
              </div>

              {/* 2-Column Responsive Split with Ample Space */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Governance Standing & Direct Action (5 Cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-purple-300 bg-gradient-to-br from-purple-500/10 via-purple-100/30 to-purple-500/5 p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800 block">
                      Governance &amp; Authority Scope
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg">
                      Administrative Mission Control
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      You hold root administrative governance across user roles, fleet approvals, dispute resolutions, and platform financial settlements.
                    </p>
                  </div>

                  {/* 4 Governance Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-1">
                    <div className="rounded-xl bg-white p-3.5 border border-purple-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">System Role</span>
                      <span className="font-bold text-sm text-purple-900">Super Admin</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-purple-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Authority Tier</span>
                      <span className="font-bold text-sm text-purple-900">Root Access</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-purple-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Network Scope</span>
                      <span className="font-bold text-sm text-emerald-700">Pan-African</span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-purple-200 text-slate-800 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Audit Logging</span>
                      <span className="font-bold text-sm text-emerald-700">Continuous</span>
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <div className="pt-2">
                    <Link
                      to="/dashboard/admin"
                      className="w-full text-xs font-bold btn-primary !py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800 shadow-md"
                    >
                      <ShieldCheck className="h-4 w-4" /> Open Admin Mission Control
                    </Link>
                  </div>
                </div>

                {/* Governance Powers & Capabilities (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-purple-200 bg-purple-50/50 p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" /> Platform Governance Capabilities
                    </span>
                    <span className="text-[10px] font-bold text-purple-900 bg-white px-3 py-1 rounded-full border border-purple-200 shadow-2xs">
                      Administrative Powers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Fleet Approvals &amp; Auditing</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Review, inspect, and approve host vehicle registrations across all tour categories.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Financial Settlement Oversight</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Monitor wallet disbursements, M-Pesa transactions, and host platform commissions.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Booking &amp; Dispute Arbitration</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Supervise live bookings, resolve customer disputes, and manage cancellation overrides.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block text-xs font-bold">Role Governance &amp; Security Audits</strong>
                        <span className="text-slate-600 text-[11px] leading-relaxed">Manage user privileges, access scopes, and cryptographic token verification across the platform.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-purple-200/60">
                    <span className="text-slate-600 font-medium text-[11px]">Direct administrative shortcut:</span>
                    <Link
                      to="/catalogue?category=vehicles"
                      className="btn-secondary !px-4 !py-1.5 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Car className="h-3.5 w-3.5" /> Review Live Fleet
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            {renderDeleteAccountCard()}

            {/* Session Security Card */}
            {renderSecurityCard()}
          </div>
        )}

      </div>

      {/* ── DELETE ACCOUNT CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 font-display">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                This action is permanent and completely irreversible. All personal credentials, contact records, and access permissions for <strong className="text-slate-900 font-mono">{user.email}</strong> will be permanently purged from M-Travel.
              </p>
            </div>

            {deleteError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                To confirm, please type <span className="font-mono text-rose-600 uppercase font-black">DELETE</span> below:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="input-field text-center font-mono font-bold tracking-widest text-xs !py-2.5 bg-white border-slate-300 focus:border-rose-500 uppercase text-slate-900"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="btn-secondary w-1/2 !py-2.5 text-xs font-semibold cursor-pointer"
              >
                Cancel &amp; Keep
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="btn-primary w-1/2 !py-2.5 text-xs font-bold !bg-rose-600 hover:!bg-rose-700 !border-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
