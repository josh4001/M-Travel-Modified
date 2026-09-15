import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, ShieldCheck, Crown } from 'lucide-react';
import { MpesaLogo } from '@/components/ui/MpesaLogo';

export function Footer() {
  return (
    <footer className="border-t border-mtravel-gold/30 px-6 py-14 bg-gradient-to-b from-[#5C0632] via-[#3B0320] to-[#1F0211] text-bone font-display">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-4">
        {/* BRAND & MPESA SEAL */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="M-TRAVEL" className="h-14 w-auto object-contain" />
          </Link>
          <p className="text-xs text-bone/70 leading-relaxed">
            Your Partner for Luxurious self drive & Cab Services, safari tours, bus tickets & holiday homes across Kenya and East Africa.
          </p>

          {/* OFFICIAL MPESA ACCEPTANCE SEAL */}
          <div className="pt-2">
            <MpesaLogo variant="card" />
          </div>
        </div>

        {/* CONTACT INFO */}
        <div>
          <p className="text-xs uppercase tracking-widest text-mtravel-lightGold font-mono font-bold flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-mtravel-gold" /> Contact & Reservations
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-bone/70">
            <a href="mailto:safari@jambo.africa" className="hover:text-mtravel-lightGold flex items-center gap-1.5 transition">
              <Mail className="h-3.5 w-3.5 text-mtravel-gold" /> safari@jambo.africa
            </a>
            <a href="tel:0722374535" className="hover:text-teal flex items-center gap-1.5 transition">
              <Phone className="h-3.5 w-3.5 text-teal" /> Amos: 0722 374 535
            </a>
            <span className="text-bone/50 text-[11px] font-mono">Landline Office: 020 7855558</span>
            <a
              href="https://wa.me/254791888840"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 text-emerald-400 flex items-center gap-1.5 font-semibold transition"
            >
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Desk: 0791 888840
            </a>
          </div>
        </div>

        {/* QUICK NAVIGATION LINKS */}
        <div>
          <p className="text-xs uppercase tracking-widest text-mtravel-lightGold font-mono font-bold flex items-center gap-1">
            <Crown className="h-3.5 w-3.5 text-mtravel-gold" /> M-TRAVEL Experience
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-bone/70">
            <Link to="/search" className="hover:text-mtravel-lightGold transition">Car Hire & Safaris</Link>
            <Link to="/services" className="hover:text-mtravel-lightGold transition">Intercity Buses & Tours</Link>
            <Link to="/contact" className="hover:text-mtravel-lightGold transition">Concierge Desk</Link>
          </div>
        </div>

        {/* ROLES & PAYMENT GUARANTEE */}
        <div>
          <p className="text-xs uppercase tracking-widest text-mtravel-lightGold font-mono font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Platform Security
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-bone/70">
            <Link to="/register" className="hover:text-mtravel-lightGold transition">Create Tourist Account</Link>
            <Link to="/register" className="hover:text-mtravel-lightGold transition">Register Vehicle Owner</Link>
            <Link to="/login" className="hover:text-mtravel-lightGold transition">Admin Portal Access</Link>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pt-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Encrypted M-PESA STK Push
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 flex flex-wrap items-center justify-between text-xs text-bone/40">
        <p>© {new Date().getFullYear()} M-TRAVEL. All rights reserved.</p>
        <p className="font-mono text-[11px] text-mtravel-lightGold flex items-center gap-1">
          <span>Powered by Safaricom M-PESA Express & Supabase DB</span>
        </p>
      </div>
    </footer>
  );
}

