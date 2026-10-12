import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Page from '../components/Page';
import { RequestCard } from '../components/cards';
import { Button, Skeleton, EmptyState, ErrorState, Tabs } from '../components/ui';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { value: 'open', label: 'Community requests' },
  { value: 'mine', label: 'My requests' },
];

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(tab === 'mine' ? '/requests?mine=true&limit=100' : '/requests?limit=50');
      setData(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const myOpen = data.filter((r) => r.seeker?._id === user?._id && ['open', 'matched', 'accepted', 'in-progress'].includes(r.status));

  return (
    <Page
      title="Help requests"
      subtitle="See what your campus is asking for — or browse your own requests."
      actions={
        <Button size="sm" icon={Plus} onClick={() => navigate('/requests/new')}>
          New request
        </Button>
      }
    >
      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data.length === 0 ? (
        <EmptyState
          title={tab === 'mine' ? 'No requests yet' : 'Nothing open right now'}
          description={
            tab === 'mine'
              ? 'Ask your campus for help — matching starts the moment you publish.'
              : 'Be the first to ask today.'
          }
          action={
            <Button size="sm" onClick={() => navigate('/requests/new')}>
              Create a request
            </Button>
          }
        />
      ) : (
        <>
          {tab === 'mine' && myOpen.length > 0 ? (
            <div className="mb-6">
              <h2 className="section-title mb-3">Active requests</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myOpen.map((r) => (
                  <RequestCard key={r._id} request={r} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <RequestCard key={r._id} request={r} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}