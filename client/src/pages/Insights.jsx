import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, GraduationCap, Star, Flame, Target, XCircle } from 'lucide-react';
import Page from '../components/Page';
import { Button, Card, Chip, Skeleton, Tabs, EmptyState } from '../components/ui';
import api, { extractError } from '../lib/api';
import { timeAgo } from '../lib/utils';

export default function Insights() {
  const [range, setRange] = useState('90d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/users/me/insights?range=${range}`);
        if (active) setData(res.data.data);
      } catch (e) {
        if (active) setError(extractError(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [range]);

  if (loading) {
    return (
      <Page title="Your insights">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="mt-6 h-72" />
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Your insights">
        <Card className="flex items-center justify-between p-5">
          <p className="text-sm text-rose-300">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => setRange((r) => r)}>Retry</Button>
        </Card>
      </Page>
    );
  }

  const { totals, karmaSeries, topSkills, reviews } = data;
  const chartData = karmaSeries.map((k) => ({ ...k, label: k.date.slice(5) }));

  return (
    <Page
      title="Your insights"
      subtitle="See how your mentoring is going and where to grow."
      actions={
        <Tabs
          active={range}
          onChange={setRange}
          tabs={[
            { value: '30d', label: '30d' },
            { value: '90d', label: '90d' },
            { value: '180d', label: '6mo' },
            { value: 'all', label: 'All' },
          ]}
        />
      }
    >
      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile icon={GraduationCap} label="Sessions taught" value={totals.taught} accent="#4F46E5" />
        <StatTile icon={TrendingUp} label="Sessions learned" value={totals.learned} accent="#0EA5E9" />
        <StatTile icon={Target} label="Success rate" value={`${totals.successRate}%`} accent="#2563EB" />
        <StatTile icon={Flame} label="Karma earned" value={totals.karmaEarned} accent="#D97706" />
        <StatTile icon={Star} label="Active offers" value={totals.activeOffers} accent="#059669" />
        <StatTile icon={XCircle} label="Cancelled" value={totals.cancelled} accent="#E11D48" />
      </div>

      {/* Karma over time */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Karma earned</h2>
          <Chip color="#2563EB">last {range === 'all' ? 'year' : range}</Chip>
        </div>
        {chartData.length ? (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="karmaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(15,23,42,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(15,23,42,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 30px -12px rgba(15,23,42,0.3)' }}
                  labelStyle={{ color: 'rgba(15,23,42,0.6)' }}
                />
                <Area type="monotone" dataKey="points" stroke="#2563EB" strokeWidth={2} fill="url(#karmaFill)" name="Karma" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No karma activity yet" description="Complete a session to see your karma trend here." />
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top skills */}
        <Card className="p-6">
          <h2 className="section-title">Skills you teach most</h2>
          {topSkills.length ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkills} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'rgba(15,23,42,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 30px -12px rgba(15,23,42,0.3)' }}
                    cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                  />
                  <Bar dataKey="count" name="Sessions" radius={[0, 8, 8, 0]} fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No teaching history yet" description="Sessions you lead will be summarized here." />
          )}
        </Card>

        {/* Reviews */}
        <Card className="p-6">
          <h2 className="section-title">Recent reviews</h2>
          {reviews.length ? (
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.author?.name}</span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </span>
                  </div>
                  {r.comment ? <p className="mt-1 text-sm text-ivory/60">{r.comment}</p> : null}
                  <p className="mt-1 text-xs text-ivory/35">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" description="Reviews from completed sessions appear here." />
          )}
        </Card>
      </div>

      <div className="mt-6 text-center">
        <Link to="/leaderboard" className="text-sm font-semibold text-lime hover:underline">
          See how you compare on the leaderboard →
        </Link>
      </div>
    </Page>
  );
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${accent}1A`, color: accent }}>
        <Icon size={22} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-ivory/50">{label}</p>
      </div>
    </Card>
  );
}