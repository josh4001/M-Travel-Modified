import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare, Building2, User } from 'lucide-react';

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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <span className="mb-4 inline-block rounded-full border border-marigold/30 bg-marigold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-marigold">
          Get in touch with M-TRAVEL
        </span>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          We'd love to hear from you.
        </h1>
        <p className="mt-4 max-w-2xl text-bone/70">
          Questions about a vehicle booking, safari package, listing your vehicle, or corporate partnership — reach out to our team directly.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1.2fr]">
        <div className="space-y-4">
          <div className="glass-card-3d p-6 rounded-2xl border border-white/15 space-y-4">
            <h3 className="font-display font-bold text-bone text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-marigold" /> Official Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Mail className="h-4 w-4 shrink-0 text-marigold" />
                <div>
                  <span className="block text-bone/50 text-[10px]">Email Address</span>
                  <a href="mailto:safari@jambo.africa" className="font-semibold text-bone hover:text-marigold transition text-sm">
                    safari@jambo.africa
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <User className="h-4 w-4 shrink-0 text-teal" />
                <div>
                  <span className="block text-bone/50 text-[10px]">Contact Person & Direct Line</span>
                  <a href="tel:0722374535" className="font-semibold text-bone hover:text-teal transition text-sm">
                    Amos — 0722 374 535
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Phone className="h-4 w-4 shrink-0 text-marigold" />
                <div>
                  <span className="block text-bone/50 text-[10px]">Office Telephone Line</span>
                  <a href="tel:0207855558" className="font-semibold text-bone hover:text-marigold transition text-sm">
                    020 7855558
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <span className="block text-bone/50 text-[10px]">WhatsApp Support Line</span>
                  <a
                    href="https://wa.me/254791888840"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-400 hover:underline transition text-sm"
                  >
                    0791 888840 (WhatsApp)
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <MapPin className="h-4 w-4 shrink-0 text-coral" />
                <div>
                  <span className="block text-bone/50 text-[10px]">Head Office</span>
                  <span className="font-semibold text-bone text-xs">Nairobi, Kenya — East Africa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="glass-card-3d space-y-4 p-8 rounded-2xl border border-white/15">
          {sent && (
            <p className="rounded-xl bg-teal/15 border border-teal/30 px-4 py-3 text-sm text-teal font-semibold">
              ✓ Thanks — Amos and the M-TRAVEL team have received your message and will get back to you shortly!
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">Your Name</label>
            <input required placeholder="Juma Mwangi" className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">Your Email Address</label>
            <input type="email" required placeholder="you@example.com" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-bone/80">Your Message</label>
            <textarea required rows={4} placeholder="How can we help you plan your travel or list your vehicle?" className="input-field resize-none" value={form.message} onChange={(e) => update('message', e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full text-xs !py-3 font-semibold shadow-glow">
            Send Message to M-TRAVEL
          </button>
        </form>
      </div>
    </div>
  );
}
