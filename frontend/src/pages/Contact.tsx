import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare, Building2, User, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 relative z-10">
        {/* HEADER SECTION - EXECUTIVE LUXURY */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative">
          <div className="relative rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-10 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="mb-3 inline-block rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-800 shadow-2xs">
                  Get in touch with M-TRAVEL
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-slate-950">
                  We'd love to hear from you.
                </h1>
                <p className="mt-3 text-slate-600 text-sm md:text-base leading-relaxed">
                  Questions about a vehicle booking, safari package, listing your vehicle, or corporate partnership — reach out to our team directly.
                </p>
              </div>

              {/* Executive Concierge Availability Badge */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center space-y-2 min-w-[200px]">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Desk Live &amp; Online</span>
                  </div>
                  <p className="text-xs font-bold text-slate-950">Average Response Time</p>
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Under 15 minutes</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1.2fr] relative">
          <div className="space-y-4">
            <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
              <h3 className="font-bold text-slate-950 text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-800" /> Official Contact Information
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold text-[11px]">Email Address</span>
                    <a href="mailto:safari@jambo.africa" className="font-bold text-slate-950 hover:text-slate-600 transition text-sm">
                      safari@jambo.africa
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold text-[11px]">Contact Person &amp; Direct Line</span>
                    <a href="tel:0722374535" className="font-bold text-slate-950 hover:text-teal-600 transition text-sm">
                      Amos — 0722 374 535
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold text-[11px]">Office Telephone Line</span>
                    <a href="tel:0207855558" className="font-bold text-slate-950 hover:text-slate-600 transition text-sm">
                      020 7855558
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold text-[11px]">WhatsApp Support Line</span>
                    <a
                      href="https://wa.me/254791888840"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition text-sm"
                    >
                      0791 888840 (WhatsApp)
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold text-[11px]">Head Office</span>
                    <span className="font-bold text-slate-950 text-sm">Nairobi, Kenya — East Africa</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Certified PSV &amp; Tourism Licensed Agency</span>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {sent && (
              <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Thanks — Amos and the M-TRAVEL team have received your message and will get back to you shortly!</span>
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Your Name</label>
              <input required placeholder="Juma Mwangi" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950 transition-all text-sm shadow-xs" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Your Email Address</label>
              <input type="email" required placeholder="you@example.com" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950 transition-all text-sm shadow-xs" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Your Message</label>
              <textarea required rows={4} placeholder="How can we help you plan your travel or list your vehicle?" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950 transition-all text-sm shadow-xs resize-none" value={form.message} onChange={(e) => update('message', e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full text-sm !py-3.5 font-bold shadow-md hover:shadow-xl cursor-pointer">
              Send Message to M-TRAVEL
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
