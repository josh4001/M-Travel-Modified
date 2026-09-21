import React, { useState, useEffect } from 'react';
import { Mail, X, CheckCircle2, AlertCircle, Key, ShieldCheck } from 'lucide-react';
import {
  getOutboundGatewayConfig,
  saveOutboundGatewayConfig,
} from '@/lib/communicationService';

interface EmailGatewaySettingsModalProps {
  onClose: () => void;
}

export const EmailGatewaySettingsModal: React.FC<EmailGatewaySettingsModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState(getOutboundGatewayConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setConfig(getOutboundGatewayConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveOutboundGatewayConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const hasApiKey = Boolean(config.resendApiKey?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 shadow-2xl border border-amber-500/30 overflow-hidden text-slate-100 font-display">
        {/* HEADER */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Email Gateway (Gmail Delivery)</h2>
              <p className="text-xs text-slate-400 font-mono">Deliver vehicle approval emails directly to hosts' Gmail inboxes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* STATUS BANNER */}
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
            hasApiKey
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            {hasApiKey ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm text-white">
                {hasApiKey ? 'Live Resend Gateway Active' : 'Gateway in Standby / Direct Gmail Mode'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {hasApiKey
                  ? 'Your Resend API key is configured. Vehicle approval emails will be delivered automatically in the background to hosts\' registered Gmail inboxes.'
                  : 'To enable automatic background delivery directly into hosts\' real Gmail inboxes, provide a free Resend API key below.'}
              </p>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Key className="h-4 w-4" /> API Configuration
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Resend API Key (Optional for Automatic Background Gmail Delivery)
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxx"
                value={config.resendApiKey || ''}
                onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Free 3,000 emails/mo from</span>
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
                >
                  resend.com
                </a>
                <span>· Takes 1 min, no credit card required.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sender Address (From)</label>
              <input
                type="text"
                placeholder="M-TRAVEL Concierge <onboarding@resend.dev>"
                value={config.customSender || ''}
                onChange={(e) => setConfig({ ...config, customSender: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Saved successfully!
                </span>
              ) : <div />}
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition"
              >
                Save Gateway Settings
              </button>
            </div>
          </form>

          {/* AUTOMATED DISPATCH INFO */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Automated Background Delivery Active
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When an administrator approves a host's vehicle, the system immediately and automatically sends the official accreditation letter to the host's registered Gmail address without requiring any manual action.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>M-TRAVEL Executive Email Delivery Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
