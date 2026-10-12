import { Link } from 'react-router-dom';

export function LogoMark({ size = 34 }) {
  return (
    <span
      className="flex items-center justify-center rounded-xl bg-lime font-display font-extrabold text-midnight-950 shadow-glow"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      SS
    </span>
  );
}

export default function Brand({ to = '/', sub = '' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-lg font-bold leading-tight tracking-tight">
        Skill Swap
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">
          University{sub ? ` · ${sub}` : ''}
        </span>
      </span>
    </Link>
  );
}