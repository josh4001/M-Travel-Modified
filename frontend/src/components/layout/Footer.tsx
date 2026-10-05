import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, ShieldCheck, Crown, Compass } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-slate-900 px-6 py-16 bg-black text-slate-300 font-sans overflow-hidden">
      {/* Subtle crisp highlight rim at the top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-4 relative z-10">
        {/* BRAND & EXPEDITION SEAL */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="M-TRAVEL" className="h-11 w-auto object-contain brightness-110 drop-shadow-sm" />
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your partner for luxurious 4x4 safari cruiser hire, executive chauffeurs, intercity VIP bus express & beachfront holiday villas across Kenya.
          </p>

          {/* SIGNATURE CONCIERGE BADGE */}
          <div className="pt-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs text-slate-300 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-white font-semibold text-[11px] uppercase tracking-wider">
                <Crown className="h-3.5 w-3.5 text-slate-300" /> Signature Concierge
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Licensed luxury fleet & bespoke safari expeditions across East Africa.
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT INFO */}
        <div>
          <p className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-300" /> Concierge & Bookings
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400">
            <a href="mailto:safari@jambo.africa" className="hover:text-white flex items-center gap-1.5 transition">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> safari@jambo.africa
            </a>
            <a href="tel:0722374535" className="hover:text-white flex items-center gap-1.5 transition">
              <Phone className="h-3.5 w-3.5 text-teal-400" /> Amos: 0722 374 535
            </a>
            <span className="text-slate-500 text-[11px] font-mono">Office Desk: 020 7855558</span>
            <a
              href="https://wa.me/254791888840"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-300 text-emerald-400 flex items-center gap-1.5 font-semibold transition"
            >
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Desk: 0791 888840
            </a>
          </div>
        </div>

        {/* QUICK NAVIGATION LINKS */}
        <div>
          <p className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-slate-300" /> M-TRAVEL Experience
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400">
            <Link to="/catalogue" className="hover:text-white transition">4x4 Safaris & Car Hire</Link>
            <Link to="/catalogue?category=buses" className="hover:text-white transition">Intercity Luxury Buses</Link>
            <Link to="/holidays-and-tours" className="hover:text-white transition">Holidays, Safaris & Villas</Link>
            <Link to="/services" className="hover:text-white transition">All Travel Services</Link>
            <Link to="/contact" className="hover:text-white transition">24/7 Concierge Desk</Link>
          </div>
        </div>

        {/* ROLES & TRUST GUARANTEE */}
        <div>
          <p className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Trust & Compliance
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400">
            <Link to="/register" className="hover:text-white transition">Create Traveler Account</Link>
            <Link to="/register" className="hover:text-white transition">List Your Vehicle or Fleet</Link>
            <Link to="/login" className="hover:text-white transition">Partner Dashboard Access</Link>
            <div className="pt-2 flex flex-col gap-1">
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Certified PSV & Safari Insured
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                KTB & PSV Insured Operator Network
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-900 pt-6 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4 relative z-10">
        <p>© {new Date().getFullYear()} M-TRAVEL East Africa Ltd. All rights reserved.</p>
        <p className="text-slate-400 flex items-center gap-1.5 font-medium">
          <Compass className="h-3.5 w-3.5 text-slate-300" />
          <span>Kenya's Signature Luxury Safari & Mobility Network</span>
        </p>
      </div>
    </footer>
  );
}

