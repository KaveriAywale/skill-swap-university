import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, UploadCloud, Trash2, Sparkles } from 'lucide-react';
import Page from '../components/Page';
import { Button, Card, Field, Input, Select, Textarea, Toggle } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DAYS, LEVELS } from '../lib/utils';

export default function CreateOffer() {
  const { skills } = useAuth();
  const { showToast, showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    skill: '',
    description: '',
    level: 'Intermediate',
    format: 'both',
  });
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState({ day: 'Mon', from: '16:00', to: '18:00' });
  const [evidence, setEvidence] = useState(null);
  const [evidenceMeta, setEvidenceMeta] = useState({ url: '', name: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addSlot = () =>
    setSlots((prev) =>
      prev.some((s) => s.day === slot.day && s.from === slot.from && s.to === slot.to)
        ? prev
        : [...prev, slot]
    );

  const uploadEvidence = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/offers/evidence', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setEvidence(file);
    setEvidenceMeta(res.data.data);
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Give your offer a short title';
    if (form.description.trim().length < 10) next.description = 'Describe what you can help with';
    if (!form.skill) next.skill = 'Pick a skill';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const res = await api.post('/offers', {
        ...form,
        availability: slots,
        evidenceUrl: evidenceMeta.url,
        evidenceName: evidenceMeta.name,
      });
      showToast('Skill offer published!');
      setCreatedId(res.data.data._id);
    } catch (err) {
      showError(extractError(err, 'Could not publish offer'));
    } finally {
      setSaving(false);
    }
  };

  if (createdId) {
    return (
      <Page>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-lime/15 text-lime"
          >
            <CheckCircle2 size={40} />
          </motion.span>
          <h2 className="mt-6 font-display text-3xl font-bold">Offer is live!</h2>
          <p className="mt-3 text-ivory/60">
            Peers needing this skill can now find you. Want extra credibility? Complete the AI-assisted skill check for this skill.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate('/verification')} icon={Sparkles}>Verify skill</Button>
            <Button variant="secondary" onClick={() => navigate('/offers')}>My offers</Button>
          </div>
        </motion.div>
      </Page>
    );
  }

  const selectedSkill = skills.find((s) => s._id === form.skill);

  return (
    <Page
      title="Offer a skill"
      subtitle="Publish what you can teach. Peers who need it will find and message you."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-4 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Skill" required error={errors.skill}>
                <Select value={form.skill} onChange={(e) => {
                  setForm((f) => ({ ...f, skill: e.target.value, title: f.title || skills.find((s) => s._id === e.target.value)?.name }));
                }} options={skills.map((s) => ({ value: s._id, label: s.name }))} placeholder="Pick a skill" />
              </Field>
              <Field label="Experience level">
                <Select value={form.level} onChange={set('level')} options={LEVELS} />
              </Field>
            </div>

            <Field label="Offer title" required error={errors.title}>
              <Input value={form.title} onChange={set('title')} placeholder={selectedSkill ? `${selectedSkill.name} peer mentoring` : 'e.g. React mentoring'} maxLength={120} />
            </Field>

            <Field label="Description" required error={errors.description}>
              <Textarea rows={4} value={form.description} onChange={set('description')} placeholder="What can you help with? Topics, level, style, outcomes…" />
            </Field>

            <Field label="Session format">
              <Select value={form.format} onChange={set('format')} options={[
                { value: 'both', label: 'Both online & in person' },
                { value: 'online', label: 'Online video' },
                { value: 'in-person', label: 'In person' },
              ]} />
            </Field>
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold">Weekly availability</h2>
            <p className="mt-1 text-sm text-ivory/50">These slots help the matcher rank you higher for compatible requests.</p>
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
            ) : (
              <p className="mt-3 text-sm text-ivory/40">No slots yet — you can still publish and update later.</p>
            )}
          </Card>

          {/* Evidence */}
          <Card className="p-6">
            <h2 className="font-display font-semibold">Supporting evidence (optional)</h2>
            <p className="mt-1 text-sm text-ivory/50">Portfolio, certificate or sample work. Only you control what&apos;s shared. Max 5MB.</p>
            <div className="mt-4">
              {evidence ? (
                <div className="flex items-center justify-between rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm">
                  <span className="flex items-center gap-2 truncate text-lime">
                    <UploadCloud size={16} /> {evidence.name}
                  </span>
                  <button type="button" onClick={() => { setEvidence(null); setEvidenceMeta({ url: '', name: '' }); }} aria-label="Remove evidence" className="text-ivory/50 hover:text-rose-300">
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 py-8 text-center transition hover:border-lime/40">
                  <UploadCloud size={26} className="text-ivory/40" />
                  <span className="text-sm text-ivory/60">Click to upload evidence</span>
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadEvidence(e.target.files[0])} accept="image/*,.pdf,.txt,.zip" />
                </label>
              )}
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" loading={saving}>
            Publish offer
          </Button>
        </form>

        <aside className="space-y-4">
          <Card className="p-5 text-sm">
            <p className="font-display font-semibold">Boost your offer</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2 text-ivory/60">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-lime" />
                Verified offers appear with a badge and get ranked higher in matches.
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Toggle checked={false} onChange={() => navigate('/verification')} />
                <span className="text-ivory/70">Run the skill check</span>
              </label>
            </div>
          </Card>
          <Card className="p-5 text-sm text-ivory/60">
            <p className="font-display font-semibold text-ivory">Good with…</p>
            <ul className="mt-3 space-y-2">
              <li>• Real, specific descriptions attract more requests.</li>
              <li>• Keep your week updated; availability drives match score.</li>
              <li>• Evidence can make first-time students trust you faster.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </Page>
  );
}