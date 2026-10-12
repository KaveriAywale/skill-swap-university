import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Sparkles,
  GraduationCap,
  CalendarClock,
  HeartHandshake,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LocateFixed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { extractError } from '../lib/api';
import { Button, Card, Field, Input, Select, Textarea, Toggle, Chip, SkillIcon } from '../components/ui';
import { CATEGORY_META, DAYS } from '../lib/utils';

const STEPS = [
  { label: 'Profile', icon: GraduationCap },
  { label: 'Teach', icon: Sparkles },
  { label: 'Learn', icon: GraduationCap },
  { label: 'Availability', icon: CalendarClock },
  { label: 'Preferences', icon: HeartHandshake },
];

export default function Onboarding() {
  const { user, refresh, skills } = useAuth();
  const { showToast, showError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ headline: '', bio: '', department: user?.department, year: user?.year });
  const [teach, setTeach] = useState([]);
  const [learn, setLearn] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [slot, setSlot] = useState({ day: 'Mon', from: '16:00', to: '18:00' });
  const [prefs, setPrefs] = useState({ preferredMode: 'chat', emailNotifications: true, discoverable: true });
  const [location, setLocation] = useState({ enabled: false, coords: null, label: 'Central Library' });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const groupedByCategory = useMemo(() => {
    const map = {};
    skills.forEach((s) => {
      map[s.category] = map[s.category] || [];
      map[s.category].push(s);
    });
    return Object.entries(map);
  }, [skills]);

  const toggle = (list, setList, id) =>
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addSlot = () => {
    setAvailability((prev) => {
      if (prev.some((s) => s.day === slot.day && s.from === slot.from && s.to === slot.to)) return prev;
      return [...prev, slot];
    });
  };

  const enableLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          enabled: true,
          coords: { lng: pos.coords.longitude, lat: pos.coords.latitude },
          label: profile.headline ? 'My campus location' : location.label,
        });
        setLocating(false);
      },
      () => {
        showError('Location permission denied â€” we matched anyway using your skills and availability.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const saveProfile = async (payload) => {
    if (payload.bio !== undefined || payload.headline !== undefined) {
      await api.patch('/auth/profile', { bio: payload.bio, headline: payload.headline, department: payload.department, year: payload.year });
    }
    if (payload.location) {
      const { lng, lat, label } = payload.location;
      if (lng && lat) await api.post('/auth/location', { lng, lat, locationLabel: label });
      else await api.patch('/auth/privacy', { locationEnabled: false });
    }
    await api.patch('/auth/availability', { availability });
    await api.patch('/auth/skills', { skillsWanted: learn });

    for (const skillId of teach) {
      const skill = skills.find((s) => s._id === skillId);
      if (!skill) continue;
      await api.post('/offers', {
        skill: skillId,
        title: `${skill.name} peer mentoring`,
        description: `I can help peers learn ${skill.name} â€” theory, practice and real projects.`,
        level: 'Intermediate',
        format: 'both',
        availability,
      });
    }

    await api.patch('/auth/privacy', {
      discoverable: prefs.discoverable,
      emailNotifications: prefs.emailNotifications,
      preferredMode: prefs.preferredMode,
    });

    await api.post('/auth/onboarding/complete');
  };

  const finish = async () => {
    setSaving(true);
    try {
      await saveProfile({
        bio: profile.bio,
        headline: profile.headline,
        department: profile.department,
        year: profile.year,
        location: location.enabled
          ? { ...location.coords, label: location.label }
          : null,
      });
      await refresh();
      showToast('Profile complete â€” welcome to the campus!');
      navigate('/dashboard');
    } catch (err) {
      showError(extractError(err, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return teach.length > 0;
    if (step === 2) return true;
    if (step === 3) return availability.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-midnight-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="chip border-lime/30 bg-lime/10 text-lime">
            <Sparkles size={13} /> Let&apos;s personalise your campus
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Welcome, {user?.name?.split(' ')[0]}!</h1>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
                  i === step
                    ? 'border-lime/50 bg-lime/15 text-lime'
                    : i < step
                    ? 'border-lime/40 bg-lime/10 text-ivory'
                    : 'border-white/10 bg-white/5 text-ivory/45'
                }`}
              >
                {i < step ? <Check size={14} /> : <s.icon size={14} />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 ? <span className="h-px w-6 bg-white/15" /> : null}
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 ? (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Tell peers about you</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Department">
                      <Select options={['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Design', 'Management', 'Other'].map((d) => ({ value: d, label: d }))} value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} />
                    </Field>
                    <Field label="Year">
                      <Select options={[1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }))} value={String(profile.year)} onChange={(e) => setProfile((p) => ({ ...p, year: Number(e.target.value) }))} />
                    </Field>
                  </div>
                  <Field label="Headline" hint="A short line shown on your card.">
                    <Input value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} placeholder="e.g. Frontend developer who loves React" />
                  </Field>
                  <Field label="Short bio">
                    <Textarea rows={3} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="What are you studying? What do you enjoy teaching and learning?" />
                  </Field>
                  <Field label="Campus location (optional)">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-lime" />
                        {location.enabled ? (
                          <span>
                            Location enabled{' '}
                            <span className="text-ivory/45">
                              Â· {location.label} <span className="font-mono text-xs">({location.coords.lng.toFixed(4)}, {location.coords.lat.toFixed(4)})</span>
                            </span>
                          </span>
                        ) : (
                          <span className="text-ivory/60">Not enabled yet â€” you can teach from anywhere else.</span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!location.enabled ? (
                          <Button type="button" size="sm" variant="secondary" loading={locating} onClick={enableLocation} icon={LocateFixed}>
                            Enable location
                          </Button>
                        ) : null}
                        <Input value={location.label} onChange={(e) => setLocation((l) => ({ ...l, label: e.target.value }))} className="!w-52" placeholder="Meeting area label (e.g. Library)" />
                      </div>
                      <p className="mt-2 text-[11px] text-ivory/40">
                        Only fuzzy labels are ever shown publicly â€” never your exact coordinates.
                      </p>
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold">What can you teach?</h2>
                    <p className="mt-1 text-sm text-ivory/55">Pick at least one skill peers might ask you to help with.</p>
                  </div>
                  <SkillPicker grouped={groupedByCategory} selected={teach} onToggle={(id) => toggle(teach, setTeach, id)} />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold">What do you want to learn?</h2>
                    <p className="mt-1 text-sm text-ivory/55">The more you ask, the more helpers we can surface for you.</p>
                  </div>
                  <SkillPicker grouped={groupedByCategory} selected={learn} onToggle={(id) => toggle(learn, setLearn, id)} />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold">When are you free?</h2>
                    <p className="mt-1 text-sm text-ivory/55">Set weekly slots for mentoring sessions.</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Day">
                      <Select value={slot.day} onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))} options={DAYS} />
                    </Field>
                    <Field label="From">
                      <Input type="time" value={slot.from} onChange={(e) => setSlot((s) => ({ ...s, from: e.target.value }))} />
                    </Field>
                    <Field label="To">
                      <Input type="time" value={slot.to} onChange={(e) => setSlot((s) => ({ ...s, to: e.target.value }))} />
                    </Field>
                    <Button type="button" variant="secondary" size="sm" onClick={addSlot}>+ Add slot</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availability.length === 0 ? (
                      <p className="text-sm text-ivory/40">No slots yet. Add your first one above.</p>
                    ) : (
                      availability.map((a, i) => (
                        <Chip key={`${a.day}-${i}`} color="#2563EB">
                          {a.day} {a.from}â€“{a.to}
                          <button onClick={() => setAvailability((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1 text-ivory/50 hover:text-rose-300" aria-label="Remove slot">
                            Ã—
                          </button>
                        </Chip>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <h2 className="font-display text-xl font-semibold">Communication preferences</h2>
                  <Field label="Preferred session mode">
                    <Select
                      value={prefs.preferredMode}
                      onChange={(e) => setPrefs((p) => ({ ...p, preferredMode: e.target.value }))}
                      options={[
                        { value: 'chat', label: 'Chat first, then decide' },
                        { value: 'video', label: 'Online video sessions' },
                        { value: 'in-person', label: 'Meet on campus' },
                      ]}
                    />
                  </Field>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                      <div>
                        <p className="text-sm font-medium">Discoverable in search</p>
                        <p className="text-xs text-ivory/45">Let other students find and message you.</p>
                      </div>
                      <Toggle checked={prefs.discoverable} onChange={(v) => setPrefs((p) => ({ ...p, discoverable: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                      <div>
                        <p className="text-sm font-medium">Email notifications</p>
                        <p className="text-xs text-ivory/45">Get notified about matches and sessions by email.</p>
                      </div>
                      <Toggle checked={prefs.emailNotifications} onChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-lime/25 bg-lime/10 p-4 text-sm text-lime">
                    <CheckCircle2 size={16} className="mr-2 inline" />
                    You&apos;re moments away â€” finish to publish {teach.length} skill {teach.length === 1 ? 'offer' : 'offers'} and land on your dashboard.
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
            <Button variant="ghost" onClick={back} disabled={step === 0} icon={ArrowLeft}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canNext()} icon={ArrowRight}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} loading={saving}>
                Complete profile
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SkillPicker({ grouped, selected, onToggle }) {
  return (
    <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
      {grouped
        .filter(([cat]) => CATEGORY_META[cat])
        .map(([cat, items]) => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                <SkillIcon name={meta.icon} size={13} /> {meta.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => {
                  const active = selected.includes(s._id);
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => onToggle(s._id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-lime/60 bg-lime/15 text-lime'
                          : 'border-white/10 bg-white/5 text-ivory/70 hover:border-white/25'
                      }`}
                    >
                      <SkillIcon name={s.icon} size={14} />
                      {s.name}
                      {active ? <Check size={14} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}