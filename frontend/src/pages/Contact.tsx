import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare, Building2, User, CheckCircle2 } from 'lucide-react';
import {
  PeekingExplorerIllustration,
  PalmTreeCartoon,
  SavannahGrassTuft
} from '@/components/ui/CartoonSafariIllustrations';

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
    <div className="min-h-screen bg-[#060302] text-slate-100 relative overflow-hidden font-display">
      {/* ATMOSPHERIC GLOWING BROWN AMBIENT RADIANCE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-amber-900/20 via-[#22140b]/35 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-amber-800/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 -left-40 w-96 h-96 bg-[#22140b]/25 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 relative overflow-hidden z-10">
        {/* Decorative Tropical Palm Tree in Background in System Orange */}
        <div className="absolute top-6 right-2 md:right-8 opacity-15 md:opacity-25 pointer-events-none -z-10">
          <PalmTreeCartoon size={160} />
        </div>

        {/* HEADER SECTION WITH ORANGE CARTOON SAFARI EXPLORER FITTED SAFELY BESIDE STATEMENT */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative">
          <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1c1008]/95 via-[#100804]/95 to-black/95 p-6 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="mb-2 inline-block rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                  Get in touch with M-TRAVEL
                </span>
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl text-white">
                  We'd love to hear from you.
                </h1>
                <p className="mt-3 text-amber-100/70 text-sm md:text-base leading-relaxed">
                  Questions about a vehicle booking, safari package, listing your vehicle, or corporate partnership — reach out to our team directly.
                </p>
              </div>

              {/* Cartoon Explorer in M-Travel Orange — perfectly fitted with ZERO text overlap */}
              <div className="shrink-0 flex flex-col items-center pt-2 md:pt-0">
                <PeekingExplorerIllustration bubbleText="Jambo! We're here to help!" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1.2fr] relative">
          {/* Subtle Savannah Grass Accent */}
          <div className="absolute -bottom-6 left-0 opacity-20 pointer-events-none -z-10">
            <SavannahGrassTuft size={110} />
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-amber-900/40 bg-[#120a05]/90 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-400" /> Official Contact Information
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3">
                  <Mail className="h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <span className="block text-amber-300/60 font-semibold text-xs">Email Address</span>
                    <a href="mailto:safari@jambo.africa" className="font-bold text-white hover:text-amber-400 transition text-sm">
                      safari@jambo.africa
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3">
                  <User className="h-4 w-4 shrink-0 text-teal-400" />
                  <div>
                    <span className="block text-amber-300/60 font-semibold text-xs">Contact Person & Direct Line</span>
                    <a href="tel:0722374535" className="font-bold text-white hover:text-teal-400 transition text-sm">
                      Amos — 0722 374 535
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3">
                  <Phone className="h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <span className="block text-amber-300/60 font-semibold text-xs">Office Telephone Line</span>
                    <a href="tel:0207855558" className="font-bold text-white hover:text-amber-400 transition text-sm">
                      020 7855558
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3">
                  <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <span className="block text-amber-300/60 font-semibold text-xs">WhatsApp Support Line</span>
                    <a
                      href="https://wa.me/254791888840"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition text-sm"
                    >
                      0791 888840 (WhatsApp)
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    <span className="block text-amber-300/60 font-semibold text-xs">Head Office</span>
                    <span className="font-bold text-white text-sm">Nairobi, Kenya — East Africa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-8 rounded-2xl border border-amber-900/40 bg-[#120a05]/90 backdrop-blur-md shadow-xl">
            {sent && (
              <p className="rounded-xl bg-teal-950/70 border border-teal-500/50 px-4 py-3 text-sm text-teal-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                <span>Thanks — Amos and the M-TRAVEL team have received your message and will get back to you shortly!</span>
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200/80">Your Name</label>
              <input required placeholder="Juma Mwangi" className="input-field bg-black/60 border-amber-900/50 text-white placeholder:text-amber-100/30 focus:border-amber-400 shadow-inner" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200/80">Your Email Address</label>
              <input type="email" required placeholder="you@example.com" className="input-field bg-black/60 border-amber-900/50 text-white placeholder:text-amber-100/30 focus:border-amber-400 shadow-inner" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-200/80">Your Message</label>
              <textarea required rows={4} placeholder="How can we help you plan your travel or list your vehicle?" className="input-field bg-black/60 border-amber-900/50 text-white placeholder:text-amber-100/30 focus:border-amber-400 shadow-inner resize-none" value={form.message} onChange={(e) => update('message', e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full text-sm !py-3.5 font-bold shadow-md shadow-amber-500/20">
              Send Message to M-TRAVEL
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
