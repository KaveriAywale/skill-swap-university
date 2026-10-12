import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Gift,
  Sparkles,
  ShieldCheck,
  Flame,
  MessageCircle,
  Search,
  CalendarClock,
  Video,
  ArrowRight,
  MapPin,
  BadgeCheck,
} from 'lucide-react';
import Brand from '../components/Brand';
import { Button, Avatar } from '../components/ui';
import { CATEGORY_META } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: 'easeOut' },
};

const HERO_PREVIEW = [
  { name: 'Aarav', skill: 'React', emoji: 'âš›ï¸', hint: 'Available Thu 6 PM', place: '1F / 380m', color: '#4F46E5' },
  { name: 'Sana', skill: 'Arduino', emoji: 'ðŸ¤–', hint: 'Online Â· ready now', place: 'CS Lab / 90m', color: '#E11D48' },
  { name: 'Priya', skill: 'MongoDB', emoji: 'ðŸƒ', hint: 'Online Â· ready now', place: 'Library / 210m', color: '#0891B2' },
];

const STEPS = [
  { icon: Search, title: 'Ask for help', text: 'Post a request for a skill you need â€” from exam prep to Python debugging.' },
  { icon: CalendarClock, title: 'Match smartly', text: 'Our engine ranks peers by skill, availability and closeness, then shows you why.' },
  { icon: MessageCircle, title: 'Chat & schedule', text: 'Talk, agree on a time and meet online or at a campus spot.' },
  { icon: Video, title: 'Learn together', text: 'Hold the session â€” live video for online, your chosen meeting area in person.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-midnight-950">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-midnight-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm text-ivory/70 md:flex">
            <a href="#how" className="transition hover:text-ivory">How it works</a>
            <a href="#skills" className="transition hover:text-ivory">Skills</a>
            <a href="#karma" className="transition hover:text-ivory">Karma</a>
            <a href="#trust" className="transition hover:text-ivory">Trust & safety</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Join campus</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent-violet/20 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-[320px] w-[320px] rounded-full bg-lime/10 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[280px] w-[280px] rounded-full bg-lavender/10 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="chip border-lime/30 bg-lime/10 text-lime">
              <Sparkles size={13} /> Peer-to-peer learning Â· Your campus
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Every student knows something.{' '}
              <span className="text-gradient">Every student needs something.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ivory/65">
              Skill Swap University connects students on campus who can teach each other â€” no
              credits, no cash, just peer learning done right.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" icon={Compass}>Find a Skill</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary" icon={Gift}>Share Your Skills</Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-ivory/40">
              Built for students, by students. Every account can seek <em>and</em> share.
            </p>
          </motion.div>

          {/* Interactive discovery preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="card relative overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">Campus discovery</p>
                <span className="chip border-lavender/30 text-lavender">
                  <MapPin size={12} /> Central Library
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <div
                  className="relative h-40 bg-[radial-gradient(circle_at_30%_40%,rgba(124,92,255,0.22),transparent_55%),radial-gradient(circle_at_75%_60%,rgba(37,99,235,0.20),transparent_50%),#EAF1FF]"
                >
                  {HERO_PREVIEW.slice(0, 3).map((p, i) => (
                    <motion.span
                      key={p.name}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.25 }}
                      className="absolute flex h-3 w-3 rounded-full shadow-glow"
                      style={{ left: `${22 + i * 24}%`, top: `${34 + (i % 2) * 26}%`, background: p.color }}
                    />
                  ))}
                  <span className="absolute left-[46%] top-[58%] flex h-3 w-3 rounded-full bg-lime shadow-glow" />
                  <span className="absolute bottom-2 left-2 chip !text-[10px]">â— live Â· 3 helpers near you</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {HERO_PREVIEW.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.2 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <Avatar name={p.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {p.name} can teach <span className="text-lime">{p.skill}</span>
                      </p>
                      <p className="text-xs text-ivory/45">{p.hint}</p>
                    </div>
                    <span className="chip !text-[10px] text-lavender">{p.place}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-ivory/45">Match reason</p>
                <p className="text-xs font-semibold text-lime">âœ“ Matches skill Â· âœ“ Nearby</p>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 rotate-6 rounded-xl bg-lime px-3 py-1.5 font-display text-xs font-bold text-midnight-950 shadow-glow">
              No cash. Ever.
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How matching works</h2>
          <p className="mt-3 text-ivory/60">
            A transparent scoring system weighs skill fit, availability and distance â€” so you
            understand exactly why a helper was recommended.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="card relative p-6"
            >
              <span className="absolute right-4 top-3 font-display text-4xl font-extrabold text-white/5">0{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime/15 text-lime">
                <s.icon size={20} />
              </span>
              <h3 className="mt-4 font-display font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ivory/55">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="border-y border-white/5 bg-midnight-900/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Explore what peers teach</h2>
              <p className="mt-2 text-ivory/60">Eight categories, dozens of skills. If someone needs it, someone teaches it.</p>
            </div>
            <Link to="/register" className="text-sm font-semibold text-lime">
              Start exploring <ArrowRight size={14} className="inline" />
            </Link>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(CATEGORY_META).map(([key, cat], i) => (
              <motion.div
                key={key}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="card flex items-center gap-3 p-4"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${cat.color}18`, color: cat.color }}
                >
                  <span className="text-xl">{['ðŸ’»', 'ðŸ§ ', 'ðŸ“', 'ðŸŽ¨', 'ðŸ–¥ï¸', 'ðŸ¤–', 'ðŸ—£ï¸', 'ðŸŽ¸'][i]}</span>
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{cat.name}</p>
                  <p className="text-xs text-ivory/45">{key}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Karma */}
      <section id="karma" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <span className="chip border-lime/30 bg-lime/10 text-lime">
              <Flame size={13} /> Karma rewards
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              The more you help, the more you glow.
            </h2>
            <p className="mt-3 max-w-lg text-ivory/60">
              Complete confirmed sessions to earn karma, unlock tiered badges and climb weekly and
              all-time campus leaderboards.
            </p>
            <div className="mt-6 space-y-3">
              {[
                ['+10 karma', 'for teaching a completed session'],
                ['+5 karma', 'for completing a learning session'],
                ['Bonus karma', 'for reviews, first sessions and passing skill checks'],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center gap-3 text-sm">
                  <span className="chip border-lime/40 bg-lime/10 font-bold text-lime">{a}</span>
                  <span className="text-ivory/55">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="card relative overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">This week</p>
              <span className="chip border-lavender/30 text-lavender">Leaderboard</span>
            </div>
            {[
              ['Aarav S.', 48, true],
              ['Priya P.', 31, false],
              ['Rahul V.', 24, false],
              ['You', 12, false],
            ].map(([name, karma, gold], i) => (
              <div key={name} className="mt-4 flex items-center gap-3">
                <span className={`w-6 text-sm font-bold ${gold ? 'text-lime' : 'text-ivory/40'}`}>#{i + 1}</span>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-lavender/50 to-accent-violet/50" />
                <div className="flex-1">
                  <div className="h-2.5 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${gold ? 'bg-gradient-to-r from-lime to-accent-cyan' : 'bg-lavender/70'}`}
                      style={{ width: `${karma + 20}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold">{karma}</span>
              </div>
            ))}
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-lime/25 bg-lime/10 px-3 py-2 text-xs text-lime">
              <BadgeCheck size={14} /> Badges: First Steps â†’ Helpful Hand â†’ Campus Legend
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-y border-white/5 bg-midnight-900/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="chip border-lavender/30 text-lavender">
              <ShieldCheck size={13} /> Trust & safety
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">Safety built into the flow</h2>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              ['College email sign-up', 'Accounts are tied to an approved student email or identifier.'],
              ['Rated, reviewed, verified', 'Helper history, peer reviews and assessment-based skill checks stay visible.'],
              ['Privacy-aware locations', 'We never expose exact GPS positions â€” only approximate campus labels.'],
            ].map(([t, d]) => (
              <motion.div key={t} {...fadeUp} className="card p-6">
                <h3 className="font-display font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-ivory/55">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-24 sm:px-6">
        <motion.div {...fadeUp} className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-lime/25 bg-midnight-800 p-10 text-center shadow-glow sm:p-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-lime/15 blur-[90px]" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your campus is ready.
            <span className="text-gradient"> Are you?</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-ivory/60">
            Join the peer learning community â€” find help tonight, teach someone tomorrow.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg">Create your student profile</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">I already have an account</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Brand />
          <p className="text-sm text-ivory/45">Your Campus. Your Skills. Your Community.</p>
          <div className="flex gap-4 text-sm text-ivory/50">
            <a href="#how" className="hover:text-ivory">How it works</a>
            <a href="#trust" className="hover:text-ivory">Trust & safety</a>
            <a href="#karma" className="hover:text-ivory">Karma</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-ivory/30">
          Â© {new Date().getFullYear()} Skill Swap University Â· An MCA academic prototype
        </p>
      </footer>
    </div>
  );
}