import React, { useState, useEffect } from 'react';
import { Mail, X, CheckCircle2, AlertCircle, Key, ShieldCheck, Send, Loader2 } from 'lucide-react';
import {
  getOutboundGatewayConfig,
  saveOutboundGatewayConfig,
  dispatchLiveEmail,
} from '@/lib/communicationService';

interface EmailGatewaySettingsModalProps {
  onClose: () => void;
}

export const EmailGatewaySettingsModal: React.FC<EmailGatewaySettingsModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState(getOutboundGatewayConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState(config.smtpUser || 'jamalkarisa96@gmail.com');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const loaded = getOutboundGatewayConfig();
    setConfig(loaded);
    setTestEmailTarget(loaded.smtpUser || 'jamalkarisa96@gmail.com');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveOutboundGatewayConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await dispatchLiveEmail({
        to: testEmailTarget.trim(),
        subject: 'M-TRAVEL Gateway Live Test Email',
        text: 'This is a live gateway verification email dispatched from M-TRAVEL Tours Concierge.',
        html: `<div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #f59e0b; margin: 0 0 10px 0;">M-TRAVEL Live Gateway Active</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Your outbound email gateway is operational and successfully delivering real messages to recipients.
          </p>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; border-top: 1px solid #334155; padding-top: 12px;">
            Delivered via: ${config.smtpUser ? 'Google Gmail SMTP' : 'Resend API'}
          </div>
        </div>`,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `Test email delivered successfully to ${testEmailTarget}! (Provider: ${res.provider || 'gmail_smtp'})`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.message || res.reason || 'Failed to dispatch test email.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error occurred while contacting dispatch gateway.',
      });
    } finally {
      setTestSending(false);
    }
  };

  const isSmtpConfigured = Boolean(config.smtpUser && config.smtpPass);
  const isResendConfigured = Boolean(config.resendApiKey?.trim());
  const isGatewayActive = isSmtpConfigured || isResendConfigured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 shadow-2xl border border-amber-500/30 overflow-hidden text-slate-100 font-sans">
        {/* HEADER */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Email Gateway & OTP Dispatch</h2>
              <p className="text-xs text-slate-400 font-mono">Real-time email delivery for vehicle approvals & password OTPs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* STATUS BANNER */}
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
            isGatewayActive
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            {isGatewayActive ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm text-white">
                {isSmtpConfigured
                  ? `Live Google SMTP Gateway Connected (${config.smtpUser})`
                  : isResendConfigured
                  ? 'Live Resend Gateway Connected'
                  : 'Gateway in Standby'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isSmtpConfigured
                  ? 'Outbound email dispatch is active with your Google App Password. Password reset OTPs and vehicle accreditation approvals are delivered in real time to any recipient email.'
                  : 'Configure your Gmail SMTP credentials or Resend API key below to send real emails to users.'}
              </p>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Key className="h-4 w-4" /> Google Gmail SMTP (Free 500 emails/day)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Gmail Account Email
                </label>
                <input
                  type="email"
                  placeholder="jamalkarisa96@gmail.com"
                  value={config.smtpUser || ''}
                  onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Google App Password (16 chars)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={config.smtpPass || ''}
                  onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sender Display Name & Address (From)
              </label>
              <input
                type="text"
                placeholder="M-TRAVEL Concierge <jamalkarisa96@gmail.com>"
                value={config.customSender || ''}
                onChange={(e) => setConfig({ ...config, customSender: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Optional: Resend API Key (Backup Provider)
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxx"
                value={config.resendApiKey || ''}
                onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Gateway settings saved!
                </span>
              ) : <div />}
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* TEST DISPATCH SECTION */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Send className="h-4 w-4 text-amber-400" /> Send Live Test Email
            </h3>
            <p className="text-xs text-slate-400">
              Verify your SMTP connection immediately by sending a test message to any email address:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testSending || !testEmailTarget}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {testSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Test Dispatch</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
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
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
