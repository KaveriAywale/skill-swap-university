import { Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck, Clock, Users, MessageSquare, Zap } from 'lucide-react';
import { Card, Chip, Avatar, SkillIcon, StatusPill, Button } from './ui';
import { CATEGORY_META, REQUEST_STATUS, timeAgo } from '../lib/utils';

export function AvailabilityDots({ availability = [], size = 16 }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <span className="inline-flex items-center gap-1" title={availability.map((a) => `${a.day} ${a.from}-${a.to}`).join(', ') || 'No availability set'}>
      {days.map((d) => {
        const on = availability.some((a) => a.day === d);
        return (
          <span
            key={d}
            style={{ width: size, height: size }}
            className={`inline-block rounded-full ${on ? 'bg-lime shadow-glow' : 'bg-white/10'}`}
          />
        );
      })}
    </span>
  );
}

export function SkillCard({ skill, offerCount = 0, children }) {
  const meta = CATEGORY_META[skill?.category] || { name: skill?.category };
  const color = meta.color || '#A78BFA';
  return (
    <Card hover className="group flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl border"
          style={{ background: `${color}18`, borderColor: `${color}44`, color }}
        >
          <SkillIcon name={skill?.icon} size={20} />
        </span>
        {offerCount > 0 ? (
          <Chip color={color}>
            <Users size={12} /> {offerCount} helpers
          </Chip>
        ) : null}
      </div>
      <div>
        <h3 className="font-display font-semibold leading-tight">{skill?.name}</h3>
        <p className="mt-0.5 text-xs text-ivory/50">{meta.name}</p>
      </div>
      {children}
      <div className="mt-auto pt-1">
        <Link
          to={`/discover?skill=${skill?._id}`}
          className="text-xs font-semibold text-lime opacity-0 transition group-hover:opacity-100"
        >
          Meet helpers →
        </Link>
      </div>
    </Card>
  );
}

export function StudentCard({ student }) {
  const distance = student.distance?.label;
  const avg = student.avgRating || 0;
  const verified = (student.verifiedSkills || []).length;

  return (
    <Card hover className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${student.id}`}>
          <Avatar src={student.avatar} name={student.name} size={52} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${student.id}`} className="block truncate font-display font-semibold hover:text-lime">
            {student.name}
          </Link>
          <p className="truncate text-xs text-ivory/50">
            {student.department} · Yr {student.year}
          </p>
          {student.headline ? <p className="mt-0.5 truncate text-xs text-ivory/65">{student.headline}</p> : null}
        </div>
        {student.isDemo ? <span className="chip border-accent-amber/30 bg-accent-amber/10 text-accent-amber">demo</span> : null}
      </div>

      {student.offers?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {student.offers.slice(0, 3).map((o) => (
            <span key={o.id} className="chip !text-[11px]">
              <SkillIcon name={(o.skill || {}).icon} size={12} /> {o.skill?.name}
              {o.verified ? <BadgeCheck size={12} className="text-lime" /> : null}
            </span>
          ))}
          {student.offers.length > 3 ? <span className="chip">+{student.offers.length - 3}</span> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ivory/55">
        <span className="flex items-center gap-1">
          <Star size={13} className="text-accent-amber" /> {avg ? avg.toFixed(1) : '—'}
        </span>
        <span className="flex items-center gap-1">
          <Users size={13} /> {student.stats?.completedSessions || 0} sessions
        </span>
        {verified > 0 ? (
          <span className="flex items-center gap-1 text-lime">
            <BadgeCheck size={13} /> {verified} verified
          </span>
        ) : null}
        {distance ? (
          <span className="flex items-center gap-1 text-lavender">
            <MapPin size={13} /> {distance}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <AvailabilityDots availability={student.availability || []} />
        <Link to={`/profile/${student.id}`} className="text-xs font-semibold text-lime">
          View →
        </Link>
      </div>
    </Card>
  );
}

export function RequestCard({ request, compact = false }) {
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.open;
  const meta = CATEGORY_META[request.category] || {};
  const color = meta.color || '#A78BFA';

  return (
    <Link to={`/requests/${request._id}`} className="block">
      <Card hover className="group flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `${color}18`, color }}
          >
            <SkillIcon name={request.skill?.icon} size={17} />
          </span>
          <StatusPill label={status.label} color={status.color} />
        </div>
        <div>
          <h3 className="line-clamp-2 font-display font-semibold leading-tight group-hover:text-lime">
            {request.title}
          </h3>
          {!compact ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-ivory/55">{request.description}</p>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ivory/50">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {timeAgo(request.createdAt)}
          </span>
          {request.urgency ? (
            <span className="uppercase tracking-wider text-[10px]">{request.urgency}</span>
          ) : null}
          {request.format ? (
            <span className="flex items-center gap-1 capitalize">
              <Zap size={12} /> {request.format}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          <Avatar src={request.seeker?.avatar} name={request.seeker?.name} size={26} />
          <span className="truncate text-xs text-ivory/70">{request.seeker?.name}</span>
        </div>
      </Card>
    </Link>
  );
}

export function MatchCard({ match, onMessage, onAccept, busy }) {
  const helper = match.helper || {};
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${helper.id || helper._id}`}>
          <Avatar src={helper.avatar} name={helper.name} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${helper.id || helper._id}`} className="block truncate font-semibold hover:text-lime">
            {helper.name}
          </Link>
          <p className="text-xs text-ivory/50">
            {helper.department} · Yr {helper.year}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ivory/60">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-accent-amber" />
              {helper.avgRating ? helper.avgRating.toFixed(1) : 'new'}
            </span>
            <span>{helper.completedSessions ?? helper.stats?.completedSessions ?? 0} sessions</span>
            {match.distanceLabel ? (
              <span className="flex items-center gap-1 text-lavender">
                <MapPin size={12} /> {match.distanceLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-lime">{match.score}</p>
          <p className="text-[10px] uppercase tracking-wider text-ivory/40">match</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {match.reasons?.map((reason) => (
          <span key={reason} className="chip !text-[11px] text-lavender">
            {reason}
          </span>
        ))}
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime to-accent-cyan"
          style={{ width: `${Math.min(100, match.score)}%` }}
        />
      </div>

      <div className="flex gap-2">
        {onAccept ? (
          <Button size="sm" loading={busy} onClick={onAccept} icon={MessageSquare}>
            {match.canInvite === false ? 'Accept & schedule' : 'Accept request'}
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" icon={MessageSquare} onClick={() => onMessage?.(helper.id || helper._id)}>
          Message
        </Button>
      </div>
    </Card>
  );
}