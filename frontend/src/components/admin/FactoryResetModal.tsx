import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, KeyRound, Lock, Eye, EyeOff,
  AlertTriangle, Trash2, CheckCircle2, X, RefreshCw, Sparkles, Building
} from 'lucide-react';
import {
  verifyFactoryResetPassword,
  setFactoryResetPassword,
  performScopedFactoryReset,
  type FactoryResetScope
} from '@/lib/bookingStore';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail?: string;
  adminName?: string;
  adminRole?: string;
  onResetCompleted?: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  adminEmail = 'admin@mtravel.co.ke',
  adminName = 'Admin',
  adminRole = 'ADMIN',
  onResetCompleted,
}) => {
  const isChiefAdmin =
    adminEmail.toLowerCase() === 'safari@jambo.africa' ||
    adminRole.toUpperCase() === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'RESET' | 'PASSWORD_CONFIG'>('RESET');
  const [selectedScope, setSelectedScope] = useState<FactoryResetScope>(
    isChiefAdmin ? 'SYSTEM_ALL' : 'OPERATIONS_DESK'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chief Admin Password Config Tab state
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwChangeMsg, setPwChangeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwChangeLoading, setPwChangeLoading] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Verify Authorization Password
    if (!verifyFactoryResetPassword(passwordInput)) {
      setErrorMsg('Access Denied: Incorrect authorization security password. Please enter the valid password set by Chief Admin.');
      return;
    }

    // Safety constraint: Operations Desk can strictly only reset Operations Desk account
    const enforcedScope: FactoryResetScope = isChiefAdmin ? selectedScope : 'OPERATIONS_DESK';

    setIsSubmitting(true);
    try {
      const res = await performScopedFactoryReset(enforcedScope, adminEmail);
      if (!res.success) {
        setErrorMsg(res.message || 'Factory reset failed.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(res.message);
      setPasswordInput('');

      setTimeout(() => {
        if (onResetCompleted) onResetCompleted();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to execute factory reset.');
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeMsg(null);

    if (!isChiefAdmin) {
      setPwChangeMsg({ type: 'err', text: 'Unauthorized: Only the Chief Admin can configure the reset security password.' });
      return;
    }

    if (!verifyFactoryResetPassword(currentPwInput)) {
      setPwChangeMsg({ type: 'err', text: 'Current password verification failed. Please enter the existing password.' });
      return;
    }

    if (!newPwInput || newPwInput.trim().length < 6) {
      setPwChangeMsg({ type: 'err', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPwInput !== confirmPwInput) {
      setPwChangeMsg({ type: 'err', text: 'New passwords do not match. Please re-enter carefully.' });
      return;
    }

    setPwChangeLoading(true);
    try {
      const ok = setFactoryResetPassword(newPwInput);
      if (ok) {
        setPwChangeMsg({
          type: 'ok',
          text: 'Security authorization password updated successfully! Both Chief Admin and Operations Desk will now use this new password for reset authorization.'
        });
        setCurrentPwInput('');
        setNewPwInput('');
        setConfirmPwInput('');
      } else {
        setPwChangeMsg({ type: 'err', text: 'Failed to update password.' });
      }
    } finally {
      setPwChangeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden my-auto ring-1 ring-slate-950/5">
        
        {/* 1. FIXED MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl shrink-0 bg-slate-950 text-white shadow-xs">
              <ShieldAlert className="h-5 w-5 stroke-[2] text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight">
                  Executive Factory Reset Console
                </h3>
                <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider bg-slate-950 text-white shadow-xs">
                  {isChiefAdmin ? 'Chief Admin' : 'Operations Desk'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Authenticated Operator: <span className="text-slate-900 font-semibold">{adminName}</span> ({adminEmail})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-950 transition cursor-pointer"
            title="Close Console"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. CHIEF ADMIN TABS (FIXED BELOW HEADER) */}
        {isChiefAdmin && (
          <div className="px-5 pt-3 shrink-0 bg-white border-b border-slate-100 pb-2.5">
            <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('RESET'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'RESET'
                    ? 'bg-slate-950 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Authorize Reset</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('PASSWORD_CONFIG'); setPwChangeMsg(null); }}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'PASSWORD_CONFIG'
                    ? 'bg-slate-950 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Configure Reset Password</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: RESET FORM */}
        {activeTab === 'RESET' && (
          <form onSubmit={handleExecuteReset} className="flex flex-col flex-1 min-h-0">
            {/* SCROLLABLE BODY */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3.5">
              {/* NOTICES & ALERTS */}
              {errorMsg && (
                <div className="rounded-xl bg-slate-100 border border-slate-300 p-3 text-xs text-slate-900 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl bg-slate-100 border border-slate-900 p-3 text-xs text-slate-900 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-bold">{successMsg}</span>
                </div>
              )}

              {/* SCOPE SELECTION */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Reset Target &amp; Authority Scope
                </label>

                {isChiefAdmin ? (
                  <div className="space-y-2">
                    {/* OPTION 1: FULL PLATFORM */}
                    <label
                      className={`block rounded-2xl border p-3 cursor-pointer transition ${
                        selectedScope === 'SYSTEM_ALL'
                          ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="reset_scope"
                          checked={selectedScope === 'SYSTEM_ALL'}
                          onChange={() => setSelectedScope('SYSTEM_ALL')}
                          className="mt-0.5 text-slate-950 focus:ring-slate-950 cursor-pointer accent-slate-950"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-950">
                              Both Accounts &amp; Entire System (Full Platform Wipe)
                            </span>
                            <span className="rounded-full bg-slate-950 text-white font-mono text-[9px] font-bold px-2 py-0.5 shrink-0 uppercase tracking-wider">
                              Total Clean Slate
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            Erases all vehicles, buses, tours, bookings, audit trails, and resets wallets across both Operations Desk and Chief Admin accounts for fresh enterprise testing.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* OPTION 2: OPERATIONS DESK ONLY */}
                    <label
                      className={`block rounded-2xl border p-3 cursor-pointer transition ${
                        selectedScope === 'OPERATIONS_DESK'
                          ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="reset_scope"
                          checked={selectedScope === 'OPERATIONS_DESK'}
                          onChange={() => setSelectedScope('OPERATIONS_DESK')}
                          className="mt-0.5 text-slate-950 focus:ring-slate-950 cursor-pointer accent-slate-950"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-950">
                              Operations Desk Account Only (admin@mtravel.co.ke)
                            </span>
                            <span className="rounded-full bg-slate-200 text-slate-800 font-mono text-[9px] font-bold px-2 py-0.5 shrink-0 uppercase tracking-wider">
                              Scoped
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            Resets the Operations Desk wallet balance to zero and purges its transaction ledger. Leaves the Chief Admin account and system fleet intact.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* OPTION 3: CHIEF ADMIN ONLY */}
                    <label
                      className={`block rounded-2xl border p-3 cursor-pointer transition ${
                        selectedScope === 'CHIEF_ADMIN'
                          ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="reset_scope"
                          checked={selectedScope === 'CHIEF_ADMIN'}
                          onChange={() => setSelectedScope('CHIEF_ADMIN')}
                          className="mt-0.5 text-slate-950 focus:ring-slate-950 cursor-pointer accent-slate-950"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-950">
                              Chief Admin Account Only (safari@jambo.africa)
                            </span>
                            <span className="rounded-full bg-slate-200 text-slate-800 font-mono text-[9px] font-bold px-2 py-0.5 shrink-0 uppercase tracking-wider">
                              Scoped
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            Resets the Chief Admin wallet balance to zero and clears its personal transaction ledger. Leaves Operations Desk records and system fleet intact.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  /* OPERATIONS DESK RESTRICTED VIEW */
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-900" />
                      <span className="text-xs font-bold text-slate-950">
                        Operations Desk Admin Account Only (admin@mtravel.co.ke)
                      </span>
                      <span className="rounded-full bg-slate-950 text-white text-[9px] font-mono font-bold px-2 py-0.5 ml-auto uppercase tracking-wider">
                        Locked Authority
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      As Operations Desk Administrator, your factory reset privilege is strictly scoped to resetting your own desk account wallet and operational records. Full platform wipes and Chief Admin resets require Chief Admin authority.
                    </p>
                  </div>
                )}
              </div>

              {/* PASSWORD VERIFICATION FIELD */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Chief Admin Authorization Password <span className="text-slate-950 font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter security password set by Chief Admin..."
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setErrorMsg(null); }}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 focus:border-slate-950 focus:bg-white text-slate-950 placeholder:text-slate-400 pl-10 pr-10 py-2.5 text-xs font-mono transition outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isChiefAdmin
                    ? 'Default initial password is "Admin@2026". You can change this in the "Configure Reset Password" tab.'
                    : 'Enter the authorization password set by the Chief Admin to authorize your account reset.'}
                </p>
              </div>
            </div>

            {/* PINNED STICKY ACTION FOOTER (ALWAYS 100% VISIBLE) */}
            <div className="shrink-0 border-t border-slate-200/90 px-5 py-3.5 bg-slate-50 flex items-center justify-between gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <Lock className="h-3.5 w-3.5 text-slate-950" />
                <span>Irreversible Enterprise Action</span>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer shadow-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !passwordInput}
                  className="rounded-xl bg-slate-950 hover:bg-black disabled:opacity-50 text-white font-bold text-xs px-4 sm:px-5 py-2 transition shadow-md flex items-center gap-2 cursor-pointer border border-slate-900"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 text-white" />
                      <span>
                        {selectedScope === 'SYSTEM_ALL'
                          ? 'Execute Full Factory Reset'
                          : selectedScope === 'OPERATIONS_DESK'
                          ? 'Reset Operations Desk'
                          : 'Reset Chief Admin'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: CHIEF ADMIN PASSWORD CONFIGURATION */}
        {isChiefAdmin && activeTab === 'PASSWORD_CONFIG' && (
          <form onSubmit={handleUpdatePassword} className="flex flex-col flex-1 min-h-0">
            {/* SCROLLABLE BODY */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3.5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-950">
                  <Sparkles className="h-4 w-4 text-slate-950" /> Chief Admin Security Key Management
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Only you as Chief Admin have authorization to set or change the factory reset security password. Whenever you or an Operations Desk administrator attempts a factory reset, this password will be required.
                </p>
              </div>

              {pwChangeMsg && (
                <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${pwChangeMsg.type === 'ok' ? 'bg-slate-100 border border-slate-900 text-slate-950 font-bold' : 'bg-slate-100 border border-slate-300 text-slate-900 font-medium'}`}>
                  {pwChangeMsg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 text-slate-950 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />}
                  <span className="leading-relaxed">{pwChangeMsg.text}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* CURRENT PASSWORD */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Current Authorization Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter existing password (Default: Admin@2026)"
                    value={currentPwInput}
                    onChange={e => setCurrentPwInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 focus:border-slate-950 focus:bg-white text-slate-950 placeholder:text-slate-400 px-3.5 py-2 text-xs font-mono outline-hidden"
                  />
                </div>

                {/* NEW PASSWORD */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      New Factory Reset Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-950 cursor-pointer"
                    >
                      {showNewPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    placeholder="Enter new strong security password (min. 6 characters)..."
                    value={newPwInput}
                    onChange={e => setNewPwInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 focus:border-slate-950 focus:bg-white text-slate-950 placeholder:text-slate-400 px-3.5 py-2 text-xs font-mono outline-hidden"
                  />
                </div>

                {/* CONFIRM NEW PASSWORD */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Security Password
                  </label>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    placeholder="Re-type new security password..."
                    value={confirmPwInput}
                    onChange={e => setConfirmPwInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 focus:border-slate-950 focus:bg-white text-slate-950 placeholder:text-slate-400 px-3.5 py-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* PINNED STICKY ACTION FOOTER (ALWAYS 100% VISIBLE) */}
            <div className="shrink-0 border-t border-slate-200/90 px-5 py-3.5 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('RESET')}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer shadow-xs"
              >
                Back to Reset Console
              </button>
              <button
                type="submit"
                disabled={pwChangeLoading || !currentPwInput || !newPwInput || !confirmPwInput}
                className="rounded-xl bg-slate-950 hover:bg-black disabled:opacity-50 text-white font-bold text-xs px-5 py-2 transition shadow-md flex items-center gap-2 cursor-pointer border border-slate-900"
              >
                {pwChangeLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Saving Key...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-white" />
                    <span>Save New Security Password</span>
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
