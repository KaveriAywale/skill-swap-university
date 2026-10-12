import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, PencilLine, Trash2, Video, MessageSquare } from 'lucide-react';
import Page from '../components/Page';
import { MatchCard } from '../components/cards';
import { Button, Card, Chip, Modal, Skeleton, EmptyState, ErrorState, StatusPill, Field, Input, Select, Avatar } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { REQUEST_STATUS, CATEGORY_META, URGENCY_META, timeAgo } from '../lib/utils';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [schedule, setSchedule] = useState({ date: '', time: '17:00', format: 'either', durationMins: 60 });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/requests/${id}`);
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

  const isSeeker = data?.request.seeker?._id === user?._id;

  const startChat = async (helperId) => {
    try {
      const res = await api.post('/conversations', { userId: helperId });
      navigate(`/messages/${res.data.data._id}`);
    } catch (e) {
      showError(extractError(e));
    }
  };

  const accept = async () => {
    setBusy(true);
    try {
      const when = new Date(`${schedule.date}T${schedule.time}`);
      const res = await api.post(`/sessions/${id}/accept`, {
        scheduledAt: when.toISOString(),
        format: schedule.format === 'either' ? 'online' : schedule.format,
        durationMins: schedule.durationMins,
      });
      showToast('Request accepted — session scheduled!');
      navigate(`/sessions/${res.data.data.session._id}`);
    } catch (e) {
      showError(extractError(e));
      setBusy(false);
    }
  };

  const cancelRequest = async () => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      showToast('Request cancelled');
      navigate('/requests');
    } catch (e) {
      showError(extractError(e));
    }
  };

  if (loading) return <RequestDetailSkeleton />;
  if (error) return <Page><ErrorState message={error} onRetry={load} /></Page>;

  const { request, matches } = data;
  const meta = CATEGORY_META[request.category] || {};
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.open;
  const urgency = URGENCY_META[request.urgency] || URGENCY_META.medium;

  return (
    <Page
      title={request.title}
      actions={
        isSeeker && ['open', 'matched'].includes(request.status) ? (
          <>
            <Button variant="secondary" size="sm" icon={PencilLine} onClick={() => navigate(`/requests/new?edit=${request._id}`)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" icon={Trash2} onClick={cancelRequest}>
              Cancel
            </Button>
          </>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request details */}
        <Card className="space-y-4 p-6 lg:col-span-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={status.label} color={status.color} />
            <Chip color={urgency.color}>Urgency: {urgency.label.toLowerCase()}</Chip>
            <Chip color={meta.color}>{meta.name}</Chip>
          </div>
          <div>
            <p className="text-xs text-ivory/45">Skill requested</p>
            <p className="flex items-center gap-2 font-semibold">
              {request.skill?.name || '—'}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-ivory/70">{request.description}</p>
          <div className="space-y-1.5 border-t border-white/10 pt-4 text-sm text-ivory/60">
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-lavender" /> {timeAgo(request.createdAt)}
            </p>
            <p className="flex items-center gap-2 capitalize">
              <Video size={14} className="text-lavender" /> Preferred: {request.format}
            </p>
            {request.meetingArea ? (
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-lavender" /> {request.meetingArea}
              </p>
            ) : null}
          </div>
          {request.seeker ? (
            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <Avatar src={request.seeker.avatar} name={request.seeker.name} size={40} />
              <div>
                <p className="text-sm font-semibold">{request.seeker.name}{isSeeker ? ' (you)' : ''}</p>
                <p className="text-xs text-ivory/45">{request.seeker.department} · Yr {request.seeker.year}</p>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              Recommended helpers <span className="text-lavender">({matches.length})</span>
            </h2>
            <span className="chip border-lime/30 text-lime">● auto-matched</span>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No helpers found yet"
              description="Nobody is currently offering this skill. You can edit the request, or wait — new helpers are added as peers publish offers."
              action={
                isSeeker ? (
                  <Button size="sm" onClick={() => navigate(`/requests/new?edit=${request._id}`)}>Tweak request</Button>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((m) => (
                <MatchCard
                  key={m.helper._id || m.helper.id}
                  match={m}
                  onMessage={startChat}
                  onAccept={!isSeeker ? () => setAcceptOpen(true) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept scheduling modal */}
      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Schedule the session">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <Input type="date" value={schedule.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))} />
            </Field>
            <Field label="Time">
              <Input type="time" value={schedule.time} onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format">
              <Select value={schedule.format} onChange={(e) => setSchedule((s) => ({ ...s, format: e.target.value }))} options={[
                { value: 'online', label: 'Online video' },
                { value: 'in-person', label: 'In person' },
              ]} />
            </Field>
            <Field label="Duration">
              <Select value={String(schedule.durationMins)} onChange={(e) => setSchedule((s) => ({ ...s, durationMins: Number(e.target.value) }))} options={[30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} min` }))} />
            </Field>
          </div>
          {request.meetingArea ? (
            <p className="flex items-center gap-2 text-sm text-ivory/60">
              <MapPin size={14} className="text-lime" /> Meeting area: {request.meetingArea}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAcceptOpen(false)}>Cancel</Button>
            <Button loading={busy} disabled={!schedule.date} onClick={accept} icon={MessageSquare}>
              Accept & schedule
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

function RequestDetailSkeleton() {
  return (
    <Page>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72" />
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-10 max-w-md" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </div>
      </div>
    </Page>
  );
}