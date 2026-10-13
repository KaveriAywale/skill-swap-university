import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Video, ShieldCheck, Sparkles } from 'lucide-react';
import { LogoMark } from './Brand';

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Smart matching', text: 'Ranked by skill, availability and closeness — with visible reasons.', chip: 'bg-lime/15 text-lime' },
  { icon: Video, title: 'Learn together', text: 'Chat, schedule and meet online or at a campus spot.', chip: 'bg-accent-cyan/15 text-accent-cyan' },
  { icon: Flame, title: 'Earn karma', text: 'Help peers, unlock badges and climb the leaderboard.', chip: 'bg-accent-amber/15 text-accent-amber' },
  { icon: ShieldCheck, title: 'Privacy first', text: 'Campus-only, with fuzzy locations — never exact GPS.', chip: 'bg-lavender/15 text-lavender' },
];

export default function AuthShell({ title, subtitle, children, footer, side }) {
  return (
    <div className="flex min-h-screen bg-midnight-950">
      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent-violet/15 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[260px] w-[260px] rounded-full bg-lime/10 blur-[110px]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md"
        >
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-lg font-bold">
              Skill Swap
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">University</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ivory/55">{subtitle}</p> : null}

          <div className="card mt-8 p-6 sm:p-8">{children}</div>
          {footer ? <div className="mt-5 text-center text-sm text-ivory/55">{footer}</div> : null}
        </motion.div>
      </div>

      <div className="relative hidden w-[44%] overflow-hidden border-l border-white/10 bg-midnight-900 lg:block">
        {side ? (
          <img
            src={side}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            aria-hidden="true"
          />
        ) : (
          <>
            <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent-violet/25 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-10 left-0 h-[320px] w-[320px] rounded-full bg-lime/15 blur-[120px]" />
            <div className="pointer-events-none absolute left-1/2 top-1/3 h-[240px] w-[240px] -translate-x-1/2 rounded-full bg-lavender/15 blur-[110px]" />
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-midnight-900/40 to-midnight-900" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-base font-bold text-ivory/90">Skill Swap University</span>
          </div>

          <div>
            <p className="max-w-sm font-display text-3xl font-bold leading-snug">
              Your campus. Your skills.{' '}
              <span className="text-gradient">Your community.</span>
            </p>
            <p className="mt-3 max-w-sm text-sm text-ivory/55">
              Every student knows something. Every student needs something. We match them.
            </p>

            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, title: t, text, chip }, i) => (
                <motion.li
                  key={t}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ivory">{t}</span>
                    <span className="block text-xs text-ivory/50">{text}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-ivory/35">
            No cash. No credits. Just peer learning done right.
          </p>
        </div>
      </div>
    </div>
  );
}