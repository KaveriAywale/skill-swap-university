import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, LifeBuoy, MapPin } from 'lucide-react';
import Page from '../components/Page';
import { Button, Card, Field, Input, Select, Textarea } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DAYS } from '../lib/utils';

export default function CreateRequest() {
  const { skills, categories, user } = useAuth();
  const { showToast, showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    skill: '',
    urgency: 'medium',
    format: 'either',
    meetingArea: '',
  });
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState({ day: 'Mon', from: '16:00', to: '18:00' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Auto-set category when skill selected.
  const onSkill = (id) => {
    const skill = skills.find((s) => s._id === id);
    setForm((f) => ({ ...f, skill: id, category: skill?.category || f.category }));
  };

  const addSlot = () =>
    setSlots((prev) => {
      if (prev.some((s) => s.day === slot.day && s.from === slot.from && s.to === slot.to)) return prev;
      return [...prev, slot];
    });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.title.trim().length < 4) next.title = 'Give your request a clear title';
    if (form.description.trim().length < 10) next.description = 'Describe what you need help with (min 10 chars)';
    if (!form.skill) next.skill = 'Pick a skill';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const res = await api.post('/requests', { ...form, preferredSlots: slots });
      setCreated(res.data.data.request);
      showToast('Request published — matching has started!');
    } catch (err) {
      showError(extractError(err, 'Could not create request'));
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <Page>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md text-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-lime/15 text-lime"
          >
            <CheckCircle2 size={40} />
          </motion.span>
          <h2 className="mt-6 font-display text-3xl font-bold">You&apos;re all set!</h2>
          <p className="mt-3 text-ivory/60">
            Your request is live. {created.matchCount || 0} potential helpers are being notified. Head to your request to review matches and start a conversation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate(`/requests/${created._id}`)} icon={LifeBuoy}>
              View matches
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          </div>
        </motion.div>
      </Page>
    );
  }

  const categorySkills = form.category ? skills.filter((s) => s.category === form.category) : skills;

  return (
    <Page
      title="Request help"
      subtitle="Tell your campus what you need. Matching runs automatically as soon as you publish."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-4 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <Field label="Title" required error={errors.title}>
              <Input value={form.title} onChange={set('title')} placeholder="e.g. Help me debug a React hooks issue" maxLength={140} />
            </Field>

            <Field label="Description" required error={errors.description}>
              <Textarea rows={4} value={form.description} onChange={set('description')} placeholder="What are you stuck on? What would a great session look like?" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={form.category}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, category: e.target.value, skill: '' }));
                  }}
                  options={categories.map((c) => ({ value: c.key, label: c.name }))}
                  placeholder="Select category"
                />
              </Field>
              <Field label="Required skill" required error={errors.skill}>
                <Select value={form.skill} onChange={(e) => onSkill(e.target.value)} options={categorySkills.map((s) => ({ value: s._id, label: s.name }))} placeholder="Select skill" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Urgency">
                <Select value={form.urgency} onChange={set('urgency')} options={[
                  { value: 'low', label: 'Low — whenever' },
                  { value: 'medium', label: 'Medium — this week' },
                  { value: 'high', label: 'High — soon' },
                  { value: 'exam-soon', label: 'Exam soon!' },
                ]} />
              </Field>
              <Field label="Session format">
                <Select value={form.format} onChange={set('format')} options={[
                  { value: 'either', label: 'Either' },
                  { value: 'in-person', label: 'In person' },
                  { value: 'online', label: 'Online video' },
                ]} />
              </Field>
            </div>

            <Field label="Campus meeting area (optional)" hint="An agreed spot like 'Main Library, first floor'.">
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                <Input value={form.meetingArea} onChange={set('meetingArea')} className="pl-9" placeholder="e.g. Main Library" />
              </div>
            </Field>
          </Card>

          {/* Preferred slots */}
          <Card className="p-6">
            <h2 className="font-display font-semibold">Preferred time slots</h2>
            <p className="mt-1 text-sm text-ivory/50">Helpers who match these slots rank higher.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Field label="Day">
                <Select value={slot.day} onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))} options={DAYS} />
              </Field>
              <Field label="From">
                <Input type="time" value={slot.from} onChange={(e) => setSlot((s) => ({ ...s, from: e.target.value }))} />
              </Field>
              <Field label="To">
                <Input type="time" value={slot.to} onChange={(e) => setSlot((s) => ({ ...s, to: e.target.value }))} />
              </Field>
              <Button type="button" variant="secondary" onClick={addSlot}>+ Add</Button>
            </div>
            {slots.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {slots.map((s, i) => (
                  <button key={i} type="button" onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))} className="chip border-lime/40 text-lime">
                    {s.day} {s.from}–{s.to} ×
                  </button>
                ))}
              </div>
            ) : null}
          </Card>

          <Button type="submit" size="lg" loading={saving} className="w-full">
            Publish request
          </Button>
        </form>

        <aside className="space-y-4">
          <Card className="p-5 text-sm">
            <p className="font-display font-semibold">How matching works</p>
            <ul className="mt-3 space-y-2 text-ivory/60">
              <li>• Your request is matched against active skill offers.</li>
              <li>• Scoring weighs <span className="text-lime">skill fit 40</span>, <span className="text-lime">availability 25</span>, <span className="text-lime">distance 20</span>, <span className="text-lime">trust 15</span>.</li>
              <li>• Helpers you match with are notified in real time.</li>
              <li>• Matching works even without location permission.</li>
            </ul>
          </Card>
          {!user?.locationEnabled ? (
            <Card className="border-accent-amber/30 bg-accent-amber/5 p-5 text-sm">
              <p className="font-medium text-accent-amber">Tip</p>
              <p className="mt-1 text-ivory/55">Enable your campus location in <Link to="/settings" className="text-lime hover:underline">Settings</Link> to surface helpers who are nearby.</p>
            </Card>
          ) : null}
        </aside>
      </div>
    </Page>
  );
}