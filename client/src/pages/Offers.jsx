import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pause, Play, Archive } from 'lucide-react';
import Page from '../components/Page';
import { Button, Card, Chip, Skeleton, EmptyState, StatusPill, SkillIcon } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { CATEGORY_META } from '../lib/utils';

const STATUS = {
  active: { label: 'Active', color: '#059669' },
  paused: { label: 'Paused', color: '#D97706' },
  withdrawn: { label: 'Withdrawn', color: '#64748B' },
};

export default function Offers() {
  const navigate = useNavigate();
  const { showToast, showError } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/offers?mine=true&limit=100');
      setData(res.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (offer, status) => {
    try {
      await api.patch(`/offers/${offer._id}`, { status });
      showToast(status === 'active' ? 'Offer reactivated' : `Offer ${status}`);
      load();
    } catch (e) {
      showError(extractError(e));
    }
  };

  const withdraw = async (offer) => {
    if (!window.confirm(`Withdraw your "${offer.title}" offer?`)) return;
    try {
      await api.delete(`/offers/${offer._id}`);
      showToast('Offer withdrawn');
      load();
    } catch (e) {
      showError(extractError(e));
    }
  };

  const active = data.filter((o) => o.status === 'active').length;

  return (
    <Page
      title="My skill offers"
      subtitle={`You're currently helping peers with ${active} active ${active === 1 ? 'skill' : 'skills'}.`}
      actions={
        <Button size="sm" icon={Plus} onClick={() => navigate('/offers/new')}>
          Offer a skill
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : error ? (
        <ErrorStateInline message={error} onRetry={load} />
      ) : data.length === 0 ? (
        <EmptyState
          title="You haven't offered any skills yet"
          description="Teaching is how the community grows — publish your first offer."
          action={<Button size="sm" onClick={() => navigate('/offers/new')}>Offer a skill</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((offer) => {
            const meta = CATEGORY_META[offer.skill?.category] || {};
            const color = meta.color || '#6366F1';
            const st = STATUS[offer.status] || STATUS.active;
            return (
              <Card key={offer._id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
                    <SkillIcon name={offer.skill?.icon} size={20} />
                  </span>
                  <StatusPill label={st.label} color={st.color} />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{offer.title}</h3>
                  <p className="text-xs text-ivory/50">{offer.skill?.name} · {offer.level} · {offer.format}</p>
                  {offer.verified ? (
                    <Chip className="mt-2 !text-[11px] text-lime" color="#2563EB">Assessment-verified</Chip>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-sm text-ivory/55">{offer.description}</p>
                <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-3 text-xs text-ivory/50">
                  <span>{offer.sessionCount || 0} sessions</span>
                  <span>{offer.availability?.length || 0} slots</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offer.status === 'active' ? (
                    <Button variant="secondary" size="sm" icon={Pause} onClick={() => setStatus(offer, 'paused')}>Pause</Button>
                  ) : offer.status === 'paused' ? (
                    <Button variant="secondary" size="sm" icon={Play} onClick={() => setStatus(offer, 'active')}>Resume</Button>
                  ) : null}
                  {offer.status !== 'withdrawn' ? (
                    <Button variant="danger" size="sm" icon={Archive} onClick={() => withdraw(offer)}>Withdraw</Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link to="/discover" className="text-sm font-semibold text-lime hover:underline">
          ← Browse students looking for your skills
        </Link>
      </div>
    </Page>
  );
}

function ErrorStateInline({ message, onRetry }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <p className="text-sm text-rose-300">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
    </Card>
  );
}