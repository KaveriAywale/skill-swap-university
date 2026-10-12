import { forwardRef, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Sparkles,
  Code2,
  BrainCircuit,
  Sigma,
  Palette,
  Cpu,
  Bot,
  Languages,
  Guitar,
  Atom,
  Hexagon,
  Braces,
  FileCode2,
  Coffee,
  Binary,
  Leaf,
  GitBranch,
  Network,
  BarChart3,
  Table2,
  Database,
  Grid2x2,
  Boxes,
  TrendingUp,
  PenTool,
  Frame,
  Clapperboard,
  Image,
  Wrench,
  Router,
  MonitorCog,
  Terminal,
  CircuitBoard,
  Radio,
  MessageCircle,
  PenLine,
  Mic,
  Camera,
  Crown,
  ChefHat,
  Pencil,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { initials } from '../lib/utils';

/* ------------------------------ Icon map ------------------------------ */

const ICONS = {
  Code2, BrainCircuit, Sigma, Palette, Cpu, Bot, Languages, Guitar,
  Atom, Hexagon, Braces, FileCode2, Coffee, Binary, Leaf, GitBranch,
  Network, BarChart3, Table2, Database, Grid2x2, Boxes, TrendingUp,
  PenTool, Frame, Clapperboard, Image, Wrench, Router, MonitorCog,
  Terminal, CircuitBoard, Radio, MessageCircle, PenLine, Mic, Camera,
  Crown, ChefHat, Pencil, Smartphone, Sparkles,
};

export function SkillIcon({ name = 'Sparkles', size = 18, className = '' }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon size={size} className={className} />;
}

/* ------------------------------ Button ------------------------------ */

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0';
  const variants = {
    primary:
      'bg-lime text-midnight-950 hover:bg-lime-bright shadow-glow hover:shadow-[0_0_0_1px_rgba(37,99,235,0.45),0_18px_40px_-12px_rgba(37,99,235,0.6)] disabled:hover:bg-lime disabled:hover:shadow-glow',
    secondary:
      'border border-white/15 bg-white/5 text-ivory hover:bg-white/10 hover:border-lime/40',
    ghost: 'text-ivory/80 hover:bg-white/10 hover:text-ivory',
    danger:
      'border border-rose/40 bg-rose/10 text-rose-300 hover:bg-rose/20',
    lavender:
      'bg-lavender text-midnight-950 hover:bg-lavender-soft shadow-glow hover:shadow-[0_0_0_1px_rgba(79,70,229,0.45),0_18px_40px_-12px_rgba(79,70,229,0.6)] disabled:hover:bg-lavender',
  };
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
});

/* ------------------------------ Inputs ------------------------------ */

export function Field({ label, hint, error, children, required }) {
  return (
    <div>
      <label className="label-field">
        {label}
        {required ? <span className="text-lime"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ivory/40">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`input-field ${error ? '!border-rose/50' : ''}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ error, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input-field resize-none ${error ? '!border-rose/50' : ''}`}
      {...props}
    />
  );
});

export function Select({ options, placeholder = 'Select…', error, className = '', ...props }) {
  return (
    <select className={`input-field appearance-none ${error ? '!border-rose/50' : ''} ${className}`} {...props}>
      <option value="">{placeholder}</option>
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={value} value={value} className="bg-midnight-900">
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  const id = useId();
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={`relative h-6 w-11 rounded-full border transition ${
          checked ? 'border-lime/60 bg-lime/90' : 'border-white/15 bg-midnight-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-midnight-800 shadow-soft transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
      {label ? <span className="text-sm text-ivory/80">{label}</span> : null}
    </button>
  );
}

/* ------------------------------ Card ------------------------------ */

export function Card({ hover = false, className = '', children, ...props }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------ Chip / Pill ------------------------------ */

export function Chip({ children, color, className = '' }) {
  return (
    <span
      className={`chip ${className}`}
      style={color ? { borderColor: `${color}44`, color, background: `${color}14` } : undefined}
    >
      {children}
    </span>
  );
}

export function StatusPill({ label, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: `${color}55`, color, background: `${color}16` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ------------------------------ Avatar ------------------------------ */

// Animated, illustrated student avatars (no real human photos). A deterministic
// cartoon character is generated from the student's name so the same student
// always gets the same character, with a gentle motion applied for life.
const AVATAR_STYLES = ['adventurer', 'open-peeps', 'big-smile', 'lorelei', 'notionists', 'personas'];
const AVATAR_BG = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'c8f7c5'];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function animatedAvatarUrl(name) {
  const seed = encodeURIComponent((name || 'Skill Swap Student').trim());
  const h = hashString(seed);
  const style = AVATAR_STYLES[h % AVATAR_STYLES.length];
  const backgroundColor = AVATAR_BG[h % AVATAR_BG.length];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${backgroundColor}&radius=50`;
}

export function Avatar({ src, name = '', size = 40, className = '', animated = true }) {
  const [failed, setFailed] = useState(false);
  const url = src || animatedAvatarUrl(name);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full border border-white/15 bg-midnight-700 object-cover ${
          animated ? 'animate-bob motion-reduce:animate-none' : ''
        } ${className}`}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender/40 to-accent-violet/40 font-semibold text-ivory ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------ Modal ------------------------------ */

export function Modal({ open, onClose, title, children, wide = false }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-end justify-center bg-midnight-950/80 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 32, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`card w-full max-h-[88vh] overflow-y-auto p-6 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-ivory/60 transition hover:bg-white/10 hover:text-ivory"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------ Feedback ------------------------------ */

export function Skeleton({ className = 'h-24' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-ivory/50">
      <Loader2 className="animate-spin text-lime" size={26} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lavender">
        <Icon size={22} />
      </span>
      <div>
        <h4 className="font-display font-semibold">{title}</h4>
        {description ? <p className="mt-1 max-w-sm text-sm text-ivory/50">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose/25 bg-rose/5 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose/15 text-rose-300">
        <X size={20} />
      </span>
      <p className="max-w-sm text-sm text-rose-200">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------ Progress ring ------------------------------ */

export function ProgressRing({ value, size = 56, stroke = 6, color = '#2563EB', track = 'rgba(15,23,42,0.08)', label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-ivory">{label ?? `${Math.round(value * 100)}%`}</span>
    </div>
  );
}

/* ------------------------------ Tabs ------------------------------ */

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => {
        const value = typeof tab === 'string' ? tab : tab.value;
        const label = typeof tab === 'string' ? tab : tab.label;
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              isActive ? 'bg-lime text-midnight-950' : 'text-ivory/70 hover:text-ivory'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { Check };