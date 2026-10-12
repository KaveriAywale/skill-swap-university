import { motion } from 'framer-motion';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

const SPOTS = [
  { x: 24, y: 26, label: 'Main Library', nodes: 3 },
  { x: 58, y: 20, label: 'CS Lab', nodes: 4 },
  { x: 76, y: 44, label: 'Design Studio', nodes: 2 },
  { x: 40, y: 58, label: 'Canteen', nodes: 3 },
  { x: 16, y: 72, label: 'Sports Complex', nodes: 2 },
  { x: 82, y: 74, label: 'Academic Block', nodes: 3 },
  { x: 58, y: 82, label: 'Hostel', nodes: 5 },
];

export default function CampusMap({ students = [], height = 220 }) {
  const [active, setActive] = useState(null);
  const byLabel = {};
  students.forEach((s) => {
    const key = s.locationLabel || 'Campus';
    byLabel[key] = (byLabel[key] || 0) + 1;
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#2A2140" />
            <stop offset="100%" stopColor="#17131F" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#mapGlow)" />
        <path d="M0 62 Q 30 46 50 60 T 100 54" stroke="#372D54" strokeWidth="1.4" fill="none" strokeDasharray="2 2" />
        <path d="M20 100 Q 26 60 44 0" stroke="#372D54" strokeWidth="1.2" fill="none" strokeDasharray="2 2" />
        <path d="M66 100 Q 60 50 78 0" stroke="#372D54" strokeWidth="1.2" fill="none" strokeDasharray="2 2" />
        <rect x="46" y="36" width="12" height="9" rx="1.5" fill="#2A2140" stroke="#7C5CFF" strokeOpacity="0.5" />
        <text x="52" y="43" textAnchor="middle" fill="#A78BFA" fontSize="2.4" dominantBaseline="middle">LIB</text>
      </svg>

      {SPOTS.map((spot, i) => {
        const count = byLabel[spot.label] ?? spot.nodes;
        return (
          <button
            key={spot.label}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-1 rounded-full border border-lime/40 bg-midnight-800/95 px-2 py-1 text-[11px] font-semibold text-ivory shadow-card"
            >
              <MapPin size={12} className="text-lime" />
              {spot.label}
              <span className="rounded-full bg-lime px-1 text-[9px] font-bold text-midnight-950">{count}</span>
            </motion.span>
          </button>
        );
      })}

      {active !== null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-2 right-2 rounded-lg border border-white/10 bg-midnight-900/90 px-3 py-2 text-xs"
        >
          <span className="font-semibold text-lime">{SPOTS[active].label}</span>
          <span className="text-ivory/60">
            {' '}· {byLabel[SPOTS[active].label] ?? SPOTS[active].nodes} students nearby right now
          </span>
        </motion.div>
      )}
    </div>
  );
}