import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LifeBuoy,
  Plus,
  Flame,
  MessageSquare,
  Video,
  Trophy,
  ArrowRight,
  Compass,
} from 'lucide-react';
import Page from '../components/Page';
import CampusMap from '../components/CampusMap';
import { StudentCard, RequestCard } from '../components/cards';
import { Button, Card, Skeleton, EmptyState, Avatar, SkillIcon } from '../components/ui';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { timeAgo, fmtDate, SESSION_STATUS } from '../lib/utils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [helpers, mine, open, sessions, convos, badges] = await Promise.all([
        api.get('/users?limit=6&sort=recent'),
        api.get('/requests?mine=true&limit=6'),
        api.get('/requests?limit=8'),
        api.get('/sessions?limit=5'),
        api.get('/conversations'),
        api.get('/karma/badges'),
      ]);
      setData({
        helpers: helpers.data.data,
        myRequests: mine.data.data,
        communityRequests: open.data.data,
        sessions: sessions.data.data,
        conversations: convos.data.data,
        badges: badges.data.data,
      });
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myOpenRequests = useMemo(() => (data?.myRequests || []).filter((r) => ['open', 'matched', 'accepted', 'in-progress'].includes(r.status)), [data]);
  const upcoming = useMemo(() => (data?.sessions || []).filter((s) => s.status !== 'completed' && s.status !== 'cancelled').slice(0, 3), [data]);
  const karmaBadges = useMemo(() => (data?.badges || []).filter((b) => b.earned), [data]);
  const nextBadge = useMemo(() => (data?.badges || []).filter((b) => !b.earned).sort((a, b) => a.progress - b.progress)[0], [data]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <Page title="Dashboard"><p className="text-rose-300">{error}</p></Page>;

  return (
    <Page>
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {user?.name?.split(' ')[0]} <SkillIcon name="Sparkles" size={18} className="inline text-lime" />
          </h1>
          <p className="mt-1 text-sm text-ivory/55">
            {user?.headline || `Let's find something to learn or share today.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={LifeBuoy} onClick={() => navigate('/requests/new')}>
            Request help
          </Button>
          <Button size="sm" icon={Plus} onClick={() => navigate('/offers/new')}>
            Offer a skill
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left + mid column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Flame} label="Karma" value={user?.karma ?? 0} to="/leaderboard" />
            <StatCard icon={Video} label="Completed sessions" value={user?.stats?.completedSessions ?? 0} to="/sessions" />
            <StatCard icon={Trophy} label="Badges" value={karmaBadges.length} to="/leaderboard" />
            <StatCard icon={MessageSquare} label="Conversations" value={data.conversations?.length ?? 0} to="/messages" />
          </div>

          {/* Recommended matches */}
          <section>
            <SectionHeader title="Recommended helpers" to="/discover" action="Explore all" />
            {data.helpers.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.helpers.slice(0, 3).map((s) => (
                  <StudentCard key={s.id} student={s} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Compass}
                title="No helpers nearby yet"
                description="Publish a request and we'll recommend helpers based on skills and availability."
                action={
                  <Button size="sm" onClick={() => navigate('/requests/new')}>
                    Create a request
                  </Button>
                }
              />
            )}
          </section>

          {/* Active requests */}
          <section>
            <SectionHeader title="Your active requests" to="/requests" action="View all" />
            {myOpenRequests.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {myOpenRequests.slice(0, 4).map((r) => (
                  <RequestCard key={r._id} request={r} compact />
                ))}
              </div>
            ) : (
              <Card className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">No active requests</p>
                  <p className="text-sm text-ivory/50">Stuck on something? Ask your campus for help.</p>
                </div>
                <Link to="/requests/new"><Button size="sm">Ask now</Button></Link>
              </Card>
            )}
          </section>

          {/* Upcoming sessions */}
          <section>
            <SectionHeader title="Upcoming sessions" to="/sessions" action="All sessions" />
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <Link key={s._id} to={`/sessions/${s._id}`} className="block">
                    <Card hover className="flex items-center gap-4 p-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender/15 text-lavender">
                        <Video size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.title}</p>
                        <p className="text-sm text-ivory/50">
                          {s.helper?._id === user?._id ? 'Teaching' : 'Learning'} · {fmtDate(s.scheduledAt)}
                        </p>
                      </div>
                      <StatusDot status={s.status} />
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Video} title="Nothing scheduled yet" description="Accept a request or match with a helper to book your first session." />
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Karma progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">Karma progress</p>
              <Link to="/leaderboard" className="text-xs text-lime">Leaderboard →</Link>
            </div>
            {karmaBadges.length ? (
              <div className="mt-4 flex items-center gap-3">
                {karmaBadges.slice(0, 4).map((b) => (
                  <div key={b.key} title={b.name} className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${b.color}20`, border: `2px solid ${b.color}` }}>
                      <SkillIcon name={b.icon} size={18} />
                    </span>
                    <span className="text-[10px] text-ivory/50">{b.name}</span>
                  </div>
                ))}
                {karmaBadges.length > 4 ? <span className="text-sm font-bold text-lime">+{karmaBadges.length - 4}</span> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">Complete your first session to earn badges.</p>
            )}

            {nextBadge ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Next: {nextBadge.name}</span>
                  <span className="text-lime">{Math.round(nextBadge.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-lime to-accent-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${nextBadge.progress * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="mt-2 text-xs text-ivory/50">{nextBadge.description}</p>
              </div>
            ) : null}
          </Card>

          {/* Campus map */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display font-semibold">Campus pulse</p>
              <span className="chip border-lime/30 text-lime">● live</span>
            </div>
            <CampusMap students={data.helpers} />
            <p className="mt-3 text-xs text-ivory/45">Approximate presence across campus spots — exact locations are never shown.</p>
          </Card>

          {/* Community feed */}
          <Card className="p-5">
            <p className="font-display font-semibold">Community activity</p>
            <div className="mt-3 space-y-3">
              {data.communityRequests.slice(0, 5).map((r) => (
                <Link key={r._id} to={`/requests/${r._id}`} className="flex items-start gap-3 rounded-xl border border-white/5 p-3 transition hover:bg-white/5">
                  <Avatar src={r.seeker?.avatar} name={r.seeker?.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium hover:text-lime">{r.title}</p>
                    <p className="text-xs text-ivory/45">
                      {r.seeker?.name} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  {r.skill?.icon ? <SkillIcon name={r.skill.icon} size={16} className="mt-1 shrink-0 text-lavender" /> : null}
                </Link>
              ))}
            </div>
          </Card>

          {/* Recent conversations */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">Recent messages</p>
              <Link to="/messages" className="text-xs text-lime">Open inbox →</Link>
            </div>
            {data.conversations.length ? (
              <div className="mt-3 space-y-2">
                {data.conversations.slice(0, 4).map((c) => (
                  <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 rounded-xl border border-white/5 p-3 transition hover:bg-white/5">
                    <Avatar src={c.other?.avatar} name={c.other?.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.other?.name} {c.unread ? <span className="ml-1 inline-block h-2 w-2 rounded-full bg-lime" /> : null}</p>
                      <p className="truncate text-xs text-ivory/45">{c.lastMessage}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ivory/35">{timeAgo(c.lastMessageAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">No conversations yet.</p>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to}>
      <Card hover className="p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime">
          <Icon size={18} />
        </span>
        <p className="mt-3 font-display text-2xl font-bold">{value}</p>
        <p className="text-xs text-ivory/50">{label}</p>
      </Card>
    </Link>
  );
}

function SectionHeader({ title, to, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-lime">
        {action} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function StatusDot({ status }) {
  const meta = SESSION_STATUS[status] || SESSION_STATUS.scheduled;
  return (
    <span className="shrink-0" style={{ color: meta.color }}>
      <span className="chip" style={{ borderColor: `${meta.color}44`, color: meta.color, background: `${meta.color}16` }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} /> {meta.label}
      </span>
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <Page>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-9 max-w-xs" />
        <Skeleton className="h-4 max-w-sm" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-56" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </Page>
  );
}