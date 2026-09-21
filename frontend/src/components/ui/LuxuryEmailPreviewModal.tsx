import React, { useState } from 'react';
import { Mail, X, CheckCircle2, ShieldCheck, Printer, Copy, Check } from 'lucide-react';
import { type DispatchedEmail } from '@/lib/communicationService';

interface LuxuryEmailPreviewModalProps {
  email: DispatchedEmail;
  onClose: () => void;
}

export const LuxuryEmailPreviewModal: React.FC<LuxuryEmailPreviewModalProps> = ({
  email,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(email.htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  const handleCopyText = () => {
    // Extract readable text from html
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = email.htmlContent;
    const readableText = tempDiv.textContent || tempDiv.innerText || '';
    navigator.clipboard.writeText(readableText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isResendDelivered = email.deliveryStatus === 'DELIVERED_RESEND';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 shadow-2xl border border-amber-500/30 overflow-hidden my-6 text-slate-100 font-display flex flex-col max-h-[92vh]">
        {/* TOP BAR / EMAIL CLIENT HEADER */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  M-TRAVEL Executive Accreditation Dispatch
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${
                  isResendDelivered
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {isResendDelivered ? 'Delivered via Resend' : 'Dispatched to Outbox & Gmail'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Recipient: <strong className="text-amber-300 font-semibold">{email.recipientEmail}</strong> ({email.recipientName}) · {new Date(email.sentAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print official accreditation certificate"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Printer className="h-4 w-4" />
            </button>

            <button
              onClick={handleCopyText}
              title="Copy email text"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* EMAIL METADATA STRIP */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subject:</span>
            <span className="text-white font-bold">{email.subject}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
            <span>From: <strong>concierge@mtravel.co.ke (M-TRAVEL Executive Desk)</strong></span>
            <span>·</span>
            <span>To: <strong className="text-slate-200">{email.recipientEmail}</strong></span>
            <span>·</span>
            <span>Security: <strong>TLS Encrypted &amp; SPF/DKIM Verified</strong></span>
          </div>
        </div>

        {/* EMAIL HTML PREVIEW IFRAME */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-[660px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800/80">
            <iframe
              srcDoc={email.htmlContent}
              title={email.subject}
              className="w-full h-[540px] border-0 rounded-2xl"
              sandbox="allow-same-origin allow-popups"
            />
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Official Billion-Dollar Executive Accreditation Seal · Dispatched to Registered Gmail</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
