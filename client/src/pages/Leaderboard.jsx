import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Flame } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Card, Skeleton, Tabs, EmptyState } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const [scope, setScope] = useState('all-time');
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextScope = scope) => {
    setLoading(true);
    setError('');
    try {
      const [lb, mine, myBadges] = await Promise.all([
        api.get(`/karma/leaderboard?scope=${nextScope}&limit=50`),
        api.get(`/karma/me?limit=1`),
        api.get('/karma/badges'),
      ]);
      setRows(lb.data.data);
      setMe({ balance: mine.data.data.balance, transactions: mine.data.meta.total });
      setBadges(myBadges.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const myRank = rows.findIndex((r) => (r.userId || r.user?._id || r._id)?.toString() === user?._id);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <Page
      title="Leaderboard"
      subtitle="Top karma earners across campus. Teaching and helping peers earns karma."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            active={scope}
            onChange={setScope}
            tabs={[
              { value: 'all-time', label: 'All-time' },
              { value: 'weekly', label: 'This week' },
            ]}
          />

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : error ? (
            <Card className="p-5 text-rose-300">{error}</Card>
          ) : rows.length === 0 ? (
            <EmptyState icon={Trophy} title="No karma yet" description="Complete sessions to start earning and appear here." />
          ) : (
            <>
              {/* Podium */}
              <div className="grid grid-cols-3 items-end gap-3">
                {[1, 0, 2].map((idx, order) => {
                  const person = podium[idx];
                  if (!person) return <div key={order} />;
                  const rank = idx + 1;
                  const heights = ['h-32', 'h-28', 'h-24'];
                  const colors = ['#D97706', '#C0C7D4', '#D08B5B'];
                  const color = colors[idx] || '#6366F1';
                  return (
                    <motion.div key={order} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: order * 0.08 }}>
                      <Link to={`/profile/${person.userId || person._id}`} className="block text-center">
                        <div className="mb-2 flex justify-center">
                          <div className="relative">
                            <Avatar src={person.avatar} name={person.name} size={rank === 1 ? 60 : 52} />
                            {rank === 1 ? <Crown size={20} className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400" fill="currentColor" /> : null}
                          </div>
                        </div>
                        <p className="truncate text-sm font-semibold">{person.name}</p>
                        <p className="text-xs text-ivory/50">{person.karma} karma</p>
                        <div className={`mt-2 flex ${heights[idx]} items-center justify-center rounded-t-xl border border-white/10`} style={{ background: `linear-gradient(180deg, ${color}33, transparent)` }}>
                          <span className="font-display text-2xl font-bold" style={{ color }}>{rank}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Rest */}
              <Card className="divide-y divide-white/5">
                {rest.map((person, i) => {
                  const isMe = (person.userId || person._id)?.toString() === user?._id;
                  return (
                    <Link key={person.userId || person._id || i} to={`/profile/${person.userId || person._id}`} className={`flex items-center gap-3 p-3.5 transition hover:bg-white/5 ${isMe ? 'bg-lime/5' : ''}`}>
                      <span className="w-6 text-center font-display font-bold text-ivory/40">{person.rank || i + 4}</span>
                      <Avatar src={person.avatar} name={person.name} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {person.name} {isMe ? <span className="text-lime">(you)</span> : null}
                        </p>
                        <p className="truncate text-xs text-ivory/45">{person.department} · Year {person.year}</p>
                      </div>
                      <span className="flex items-center gap-1 font-semibold text-lime">
                        <Flame size={14} /> {person.karma}
                      </span>
                    </Link>
                  );
                })}
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="bg-gradient-to-br from-lavender/15 to-transparent p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/15 text-lime">
                <Trophy size={24} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-ivory/50">Your karma</p>
                <p className="font-display text-3xl font-bold">{me?.balance ?? user?.karma ?? 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-ivory/60">
              <span>{myRank >= 0 ? `Rank #${myRank + 1}` : 'Not ranked yet'}</span>
              <span>{me?.transactions ?? 0} transactions</span>
            </div>
            <Link to="/insights" className="mt-4 block text-sm font-semibold text-lime hover:underline">View your insights →</Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Badges</h2>
              <span className="text-xs text-ivory/45">{earnedBadges.length}/{badges.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {(loading ? Array.from({ length: 4 }) : badges.slice(0, 6)).map((b, i) => (
                b ? (
                  <div key={b.key || i} className={`rounded-xl border p-3 ${b.earned ? 'border-lime/30 bg-lime/5' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${b.earned ? 'text-ivory' : 'text-ivory/60'}`}>{b.name}</span>
                      {b.earned ? <Medal size={15} className="text-lime" /> : <span className="text-xs text-ivory/40">{Math.round((b.progress || 0) * 100)}%</span>}
                    </div>
                    <p className="mt-1 text-xs text-ivory/45">{b.description}</p>
                    {!b.earned && b.threshold ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-lavender" style={{ width: `${Math.min(100, (b.current / b.threshold) * 100)}%` }} />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Skeleton key={i} className="h-16" />
                )
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}