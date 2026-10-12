import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Play, CheckCheck, Video } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Skeleton, StatusPill, EmptyState, Tabs } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUS_META = {
  scheduled: { label: 'Scheduled', color: '#6366F1' },
  'in-progress': { label: 'In progress', color: '#D97706' },
  completed: { label: 'Completed', color: '#059669' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

export default function Sessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      const res = await api.get(`/sessions?${params}`);
      setData(res.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = data.filter((s) => {
    if (tab === 'upcoming') return s.status === 'scheduled';
    if (tab === 'in-progress') return s.status === 'in-progress';
    if (tab === 'completed') return s.status === 'completed';
    if (tab === 'cancelled') return s.status === 'cancelled';
    return true;
  });

  const counts = {
    all: data.length,
    upcoming: data.filter((s) => s.status === 'scheduled').length,
    'in-progress': data.filter((s) => s.status === 'in-progress').length,
    completed: data.filter((s) => s.status === 'completed').length,
  };

  return (
    <Page
      title="Sessions"
      subtitle="Scheduled and past learning sessions."
      actions={
        <Link to="/requests" className="text-sm font-semibold text-lime hover:underline">
          Find help â†’
        </Link>
      }
    >
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: `All (${counts.all})` },
          { value: 'upcoming', label: `Upcoming (${counts.upcoming})` },
          { value: 'in-progress', label: `In progress (${counts['in-progress']})` },
          { value: 'completed', label: `Completed (${counts.completed})` },
        ]}
      />

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-5 text-rose-300">{error}</Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`No ${tab === 'all' ? '' : tab} sessions`}
            description="Sessions appear here once a helper accepts your request and schedules a time."
            action={<Button size="sm" onClick={() => navigate('/requests')}>Browse requests</Button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const other = s.seeker?._id === user?._id ? s.helper : s.seeker;
              const st = STATUS_META[s.status] || STATUS_META.scheduled;
              return (
                <Link key={s._id} to={`/sessions/${s._id}`} className="block">
                  <Card hover className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Avatar src={other?.avatar} name={other?.name} size={38} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{s.title}</p>
                          <p className="truncate text-xs text-ivory/50">
                            with {other?.name} Â· {s.skill?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{formatDate(s.scheduledAt)}</p>
                      <StatusPill label={st.label} color={st.color} className="mt-1" />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {s.status === 'in-progress' && s.format === 'online' ? (
                        <Button size="sm" variant="secondary" icon={Video} onClick={(e) => { e.preventDefault(); navigate(`/sessions/${s._id}/video`); }}>
                          Join
                        </Button>
                      ) : null}
                      {s.status === 'scheduled' ? (
                        <Button size="sm" icon={Play} onClick={(e) => { e.preventDefault(); navigate(`/sessions/${s._id}`); }}>
                          View
                        </Button>
                      ) : null}
                      {s.status === 'completed' ? (
                        <Button size="sm" variant="secondary" icon={CheckCheck} onClick={(e) => { e.preventDefault(); navigate(`/sessions/${s._id}`); }}>
                          Review
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

function formatDate(iso) {
  if (!iso) return 'â€”';
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}