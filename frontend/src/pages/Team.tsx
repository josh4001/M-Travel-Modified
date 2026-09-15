import { motion } from 'framer-motion';
import { Linkedin, Twitter } from 'lucide-react';

// Placeholder team roster — swap in real bios/photos before shipping.
const team = [
  { name: 'Amara Otieno', role: 'Founder & CEO', initials: 'AO' },
  { name: 'Brian Kamau', role: 'Head of Engineering', initials: 'BK' },
  { name: 'Faith Wambui', role: 'Head of Product & Design', initials: 'FW' },
  { name: 'David Njoroge', role: 'Head of Operations', initials: 'DN' },
  { name: 'Grace Achieng', role: 'Trust & Safety Lead', initials: 'GA' },
  { name: 'Samuel Kiptoo', role: 'Partnerships Lead', initials: 'SK' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Team() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <span className="mb-4 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
          Our team
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          The people behind M-TRAVEL.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 font-medium leading-relaxed">
          A small, Nairobi-based team building the travel infrastructure Kenya's roads deserve.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member, i) => (
          <motion.div
            key={member.name}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} transition={{ delay: i * 0.06 }}
            className="card-luxe bg-white border border-slate-200 p-6 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 font-display text-lg font-bold text-white shadow-sm">
              {member.initials}
            </div>
            <h3 className="mt-4 font-display font-bold text-slate-900 text-lg">{member.name}</h3>
            <p className="mt-1 text-sm text-slate-600 font-medium">{member.role}</p>
            <div className="mt-3 flex justify-center gap-3 text-slate-400">
              <Linkedin className="h-4 w-4 transition hover:text-amber-600 cursor-pointer" />
              <Twitter className="h-4 w-4 transition hover:text-amber-600 cursor-pointer" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
