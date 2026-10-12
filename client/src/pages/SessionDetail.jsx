import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Clock, Play, CheckCheck, Star, X, Video, MapPin } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Chip, Skeleton, StatusPill, Field, Textarea, ErrorState } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_META = {
  scheduled: { label: 'Scheduled', color: '#6366F1' },
  'in-progress': { label: 'In progress', color: '#D97706' },
  completed: { label: 'Completed', color: '#059669' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [review, setReview] = useState({ rating: 5, comment: '', open: false });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/sessions/${id}`);
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
  }, [id]);

  const act = async (action, successMsg, transform = () => {}) => {
    setBusy(action);
    try {
      const res = await api.post(`/sessions/${id}/${action}`);
      transform(res.data?.data);
      showToast(successMsg);
      await load();
    } catch (e) {
      showError(extractError(e));
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Page><div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div></Page>;
  if (error) return <Page><ErrorState message={error} onRetry={load} /></Page>;

  const { session, isSeeker, isHelper } = data;
  const other = isSeeker ? session.helper : session.seeker;
  const st = STATUS_META[session.status] || STATUS_META.scheduled;

  const submitReview = async () => {
    setBusy('review');
    try {
      await api.post(`/sessions/${id}/review`, { rating: review.rating, comment: review.comment });
      showToast('Review submitted — thank you!');
      setReview({ rating: 5, comment: '', open: false });
      await load();
    } catch (e) {
      showError(extractError(e));
    } finally {
      setBusy('');
    }
  };

  const doCancel = async () => {
    setCancelBusy(true);
    try {
      await api.post(`/sessions/${id}/cancel`, { reason: cancelReason });
      showToast('Session cancelled');
      setCancelOpen(false);
      await load();
    } catch (e) {
      showError(extractError(e));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <Link to="/sessions" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ivory/60 hover:text-ivory">← Back to sessions</Link>

        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">{session.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill label={st.label} color={st.color} />
                <Chip color="#6366F1">{session.skill?.name}</Chip>
                <Chip color="#D97706" className="capitalize">{session.format}</Chip>
              </div>
            </div>
            <div className="text-right text-sm text-ivory/60">
              <p className="flex items-center justify-end gap-1.5"><CalendarDays size={14} /> {formatDate(session.scheduledAt)}</p>
              <p className="mt-1 flex items-center justify-end gap-1.5"><Clock size={14} /> {session.durationMins} min</p>
              {session.meetingArea ? (
                <p className="mt-1 flex items-center justify-end gap-1.5"><MapPin size={14} /> {session.meetingArea}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Avatar src={other?.avatar} name={other?.name} size={46} />
            <div>
              <p className="font-semibold">
                {other?.name}
                <span className="ml-2 text-sm font-normal text-ivory/50">{isSeeker ? '· Teaching you' : isHelper ? '· Learning from you' : ''}</span>
              </p>
              <p className="text-xs text-ivory/45">{other?.department} · Year {other?.year} · {other?.karma} karma</p>
            </div>
            <div className="ml-auto">
              <Link to={`/profile/${other?.id || other?._id}`} className="text-xs font-semibold text-lime hover:underline">Profile</Link>
            </div>
          </div>

          {session.roomId ? (
            <p className="mt-4 text-xs text-ivory/45">Room code: <code className="rounded bg-white/10 px-1.5 py-0.5">{session.roomId}</code></p>
          ) : null}

          {/* Action bar */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {session.status === 'scheduled' && (
              <>
                <Button size="sm" onClick={() => act('start', 'Session started — have a great lesson!')} icon={Play} loading={busy === 'start'}>
                  Start now
                </Button>
                <Button size="sm" variant="danger" icon={X} onClick={() => setCancelOpen(true)}>Cancel</Button>
              </>
            )}
            {session.status === 'in-progress' && (
              <>
                {session.format === 'online' ? (
                  <Button size="sm" icon={Video} onClick={() => navigate(`/sessions/${session._id}/video`)}>Join video call</Button>
                ) : (
                  <Button size="sm" icon={MapPin} disabled variant="secondary">Meeting at {session.meetingArea || 'campus'}</Button>
                )}
                <Button size="sm" variant="secondary" icon={CheckCheck} onClick={() => act('complete', 'Confirmed. Waiting for your partner to confirm too.')} loading={busy === 'complete'}>
                  Mark complete
                </Button>
              </>
            )}
            {session.status === 'completed' && !data.myReview && (
              <Button size="sm" icon={Star} onClick={() => setReview((r) => ({ ...r, open: true }))}>
                Leave a review
              </Button>
            )}
            {session.status === 'completed' && data.myReview && (
              <Chip color="#059669">You reviewed this session</Chip>
            )}
            {session.status === 'cancelled' && (
              <p className="text-sm text-ivory/50">
                Cancelled {session.cancelledBy?.toString() === user?._id ? 'by you' : 'by your partner'}
                {session.cancelReason ? <span> — {session.cancelReason}</span> : null}
              </p>
            )}
          </div>

          {data.bothConfirmed && session.status === 'completed' ? (
            <p className="mt-4 rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-lime">
              Both participants confirmed. Karma was awarded for this session.
            </p>
          ) : null}
          {session.status === 'completed' && !data.bothConfirmed ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-ivory/60">
              Completion confirmed by one side — the other participant still needs to confirm.
            </p>
          ) : null}
        </Card>

        {/* Review modal */}
        {review.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setReview((r) => ({ ...r, open: false }))}>
            <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-xl font-bold">Rate your session</h2>
              <p className="mt-1 text-sm text-ivory/55">Feedback helps {other?.name} build trust in the community.</p>
              <div className="mt-4 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReview((r) => ({ ...r, rating: n }))} aria-label={`${n} stars`} className={`p-1 transition ${n <= review.rating ? 'text-amber-400' : 'text-ivory/25'}`}>
                    <Star size={28} fill="currentColor" />
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <Field label="Comment (optional)">
                  <Textarea rows={3} value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} placeholder="What went well?" maxLength={600} />
                </Field>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setReview((r) => ({ ...r, open: false }))}>Cancel</Button>
                <Button loading={busy === 'review'} onClick={submitReview}>Submit review</Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Cancel modal */}
        {cancelOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCancelOpen(false)}>
            <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-xl font-bold">Cancel this session?</h2>
              <p className="mt-1 text-sm text-ivory/55">The other participant will be notified.</p>
              <div className="mt-4">
                <Field label="Reason (optional)">
                  <Textarea rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Briefly explain…" maxLength={300} />
                </Field>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep session</Button>
                <Button variant="danger" loading={cancelBusy} onClick={doCancel}>Cancel session</Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </Page>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}