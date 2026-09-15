import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, ShieldCheck, Crown } from 'lucide-react';
import { MpesaLogo } from '@/components/ui/MpesaLogo';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 px-6 py-16 bg-slate-950 text-slate-300 font-display">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-4">
        {/* BRAND & MPESA SEAL */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="M-TRAVEL" className="h-12 w-auto object-contain brightness-110" />
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your partner for luxurious 4x4 safari cruiser hire, executive chauffeurs, intercity VIP bus express & beachfront holiday villas across Kenya.
          </p>

          {/* OFFICIAL MPESA ACCEPTANCE SEAL */}
          <div className="pt-2">
            <MpesaLogo variant="card" />
          </div>
        </div>

        {/* CONTACT INFO */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-amber-400" /> Concierge & Bookings
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400">
            <a href="mailto:safari@jambo.africa" className="hover:text-amber-400 flex items-center gap-1.5 transition">
              <Mail className="h-3.5 w-3.5 text-amber-400" /> safari@jambo.africa
            </a>
            <a href="tel:0722374535" className="hover:text-amber-400 flex items-center gap-1.5 transition">
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
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" /> M-TRAVEL Experience
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400">
            <Link to="/catalogue" className="hover:text-white transition">4x4 Safaris & Car Hire</Link>
            <Link to="/catalogue?category=buses" className="hover:text-white transition">Intercity Luxury Buses</Link>
            <Link to="/catalogue?category=homes" className="hover:text-white transition">Holiday Villas & Stays</Link>
            <Link to="/services" className="hover:text-white transition">All Travel Services</Link>
            <Link to="/contact" className="hover:text-white transition">24/7 Concierge Desk</Link>
          </div>
        </div>

        {/* ROLES & PAYMENT GUARANTEE */}
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Trust & Compliance
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400">
            <Link to="/register" className="hover:text-white transition">Create Traveler Account</Link>
            <Link to="/register" className="hover:text-white transition">List Your Vehicle or Fleet</Link>
            <Link to="/login" className="hover:text-white transition">Partner Dashboard Access</Link>
            <div className="pt-2 flex flex-col gap-1">
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Instant M-PESA STK Push
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                KTB & PSV Insured Operator Network
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} M-TRAVEL East Africa Ltd. All rights reserved.</p>
        <p className="font-mono text-[11px] text-amber-400/90 flex items-center gap-1">
          <span>Powered by Safaricom M-PESA Express</span>
        </p>
      </div>
    </footer>
  );
}

