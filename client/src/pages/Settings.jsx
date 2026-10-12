import { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, LogOut, Save, Plus, X } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Chip, Field, Input, Select, Toggle, Skeleton } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DAYS } from '../lib/utils';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Electrical',
  'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Design', 'Management', 'Other',
];

export default function Settings() {
  const { user, skills, refresh, logout } = useAuth();
  const { showToast, showError } = useToast();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({ name: '', headline: '', bio: '', department: 'Other', year: 1, studentId: '' });
  const [privacy, setPrivacy] = useState({ discoverable: true, emailNotifications: true, preferredMode: 'either', locationEnabled: false, locationLabel: '' });
  const [availability, setAvailability] = useState([]);
  const [slot, setSlot] = useState({ day: 'Mon', from: '16:00', to: '18:00' });
  const [wanted, setWanted] = useState([]);
  const [saving, setSaving] = useState('');
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || '',
      headline: user.headline || '',
      bio: user.bio || '',
      department: user.department || 'Other',
      year: user.year || 1,
      studentId: user.studentId || '',
    });
    setPrivacy({
      discoverable: user.commPrefs?.discoverable !== false,
      emailNotifications: user.commPrefs?.emailNotifications !== false,
      preferredMode: user.commPrefs?.preferredMode || 'either',
      locationEnabled: Boolean(user.locationEnabled),
      locationLabel: user.locationLabel || '',
    });
    setAvailability(user.availability || []);
    setWanted((user.skillsWanted || []).map((s) => s._id || s));
    setReady(true);
  }, [user]);

  const saveProfile = async () => {
    setSaving('profile');
    try {
      await api.patch('/auth/profile', profile);
      await refresh();
      showToast('Profile saved');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSaving('');
    }
  };

  const savePrivacy = async (patch) => {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    setSaving('privacy');
    try {
      await api.patch('/auth/privacy', {
        discoverable: next.discoverable,
        emailNotifications: next.emailNotifications,
        preferredMode: next.preferredMode,
        locationEnabled: next.locationEnabled,
        locationLabel: next.locationLabel,
      });
      await refresh();
      showToast('Privacy settings saved');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSaving('');
    }
  };

  const saveAvailability = async () => {
    setSaving('availability');
    try {
      await api.patch('/auth/availability', { availability });
      await refresh();
      showToast('Availability saved');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSaving('');
    }
  };

  const saveWanted = async () => {
    setSaving('skills');
    try {
      await api.patch('/auth/skills', { skillsWanted: wanted });
      await refresh();
      showToast('Learning interests saved');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSaving('');
    }
  };

  const uploadAvatar = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    setSaving('avatar');
    try {
      await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refresh();
      showToast('Profile photo updated');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSaving('');
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return showError('Geolocation is not supported on this device');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post('/auth/location', {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
            locationLabel: privacy.locationLabel || 'Campus',
          });
          await refresh();
          showToast('Campus location saved');
        } catch (e) {
          showError(extractError(e));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        showError('Could not get your location. You can still use Skill Swap without it.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addSlot = () => {
    if (availability.some((s) => s.day === slot.day && s.from === slot.from && s.to === slot.to)) return;
    setAvailability((a) => [...a, slot]);
  };

  const toggleWanted = (id) =>
    setWanted((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  if (!ready) return <Page title="Settings"><Skeleton className="h-96" /></Page>;

  return (
    <Page title="Settings" subtitle="Manage your profile, privacy and preferences.">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile */}
        <Card className="p-6">
          <h2 className="section-title">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name} size={72} />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-lime text-midnight-950 shadow-glow"
                aria-label="Change photo"
              >
                <Camera size={15} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </div>
            <div className="text-sm text-ivory/50">
              <p className="font-semibold text-ivory">{user?.name}</p>
              <p>{user?.email}</p>
              {user?.isDemo ? <Chip className="mt-1" color="#F5B62D">demo account</Chip> : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} maxLength={80} /></Field>
            <Field label="Headline"><Input value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} placeholder="e.g. CS junior, loves React" maxLength={120} /></Field>
            <Field label="Department">
              <Select value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} options={DEPARTMENTS} placeholder="Select department" />
            </Field>
            <Field label="Year">
              <Select value={String(profile.year)} onChange={(e) => setProfile((p) => ({ ...p, year: Number(e.target.value) }))} options={[1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }))} placeholder="Year" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Bio" hint="Tell peers what you're into and how you like to help.">
              <textarea rows={3} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} className="input-field resize-none" maxLength={600} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button loading={saving === 'profile'} onClick={saveProfile} icon={Save}>Save profile</Button>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-6">
          <h2 className="section-title">Privacy & discovery</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Show me in Discover</p>
                <p className="text-xs text-ivory/45">Let peers find you when browsing students.</p>
              </div>
              <Toggle checked={privacy.discoverable} onChange={(v) => savePrivacy({ discoverable: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Email notifications</p>
                <p className="text-xs text-ivory/45">Match and session updates by email.</p>
              </div>
              <Toggle checked={privacy.emailNotifications} onChange={(v) => savePrivacy({ emailNotifications: v })} />
            </div>
            <Field label="Preferred session mode">
              <Select value={privacy.preferredMode} onChange={(e) => savePrivacy({ preferredMode: e.target.value })} options={[
                { value: 'either', label: 'Either' },
                { value: 'online', label: 'Online' },
                { value: 'in-person', label: 'In person' },
              ]} />
            </Field>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-semibold">Share campus location</p>
                <p className="text-xs text-ivory/45">Used only for fuzzy &quot;near you&quot; matching. Never shown exactly.</p>
              </div>
              <Toggle checked={privacy.locationEnabled} onChange={(v) => (v ? detectLocation() : savePrivacy({ locationEnabled: false }))} />
            </div>
            {privacy.locationEnabled ? (
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Location label"><Input value={privacy.locationLabel} onChange={(e) => setPrivacy((p) => ({ ...p, locationLabel: e.target.value }))} placeholder="e.g. North Campus" maxLength={80} /></Field>
                <Button variant="secondary" icon={MapPin} loading={locating} onClick={detectLocation}>Update location</Button>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Availability */}
        <Card className="p-6">
          <h2 className="section-title">Weekly availability</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Day"><Select value={slot.day} onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))} options={DAYS} /></Field>
            <Field label="From"><Input type="time" value={slot.from} onChange={(e) => setSlot((s) => ({ ...s, from: e.target.value }))} /></Field>
            <Field label="To"><Input type="time" value={slot.to} onChange={(e) => setSlot((s) => ({ ...s, to: e.target.value }))} /></Field>
            <Button variant="secondary" icon={Plus} onClick={addSlot}>Add</Button>
          </div>
          {availability.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {availability.map((s, i) => (
                <button key={i} type="button" onClick={() => setAvailability((a) => a.filter((_, idx) => idx !== i))} className="chip border-lime/40 text-lime">
                  {s.day} {s.from}–{s.to} <X size={12} />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ivory/40">No slots added yet.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button loading={saving === 'availability'} onClick={saveAvailability} icon={Save}>Save availability</Button>
          </div>
        </Card>

        {/* Learning interests */}
        <Card className="p-6">
          <h2 className="section-title">What I want to learn</h2>
          <p className="mt-1 text-sm text-ivory/50">We&apos;ll use this to surface helpful peers and requests.</p>
          <div className="mt-4 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {skills.map((s) => {
              const on = wanted.includes(s._id);
              return (
                <button key={s._id} type="button" onClick={() => toggleWanted(s._id)} className={`chip ${on ? 'border-lime/50 bg-lime/10 text-lime' : ''}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button loading={saving === 'skills'} onClick={saveWanted} icon={Save}>Save interests</Button>
          </div>
        </Card>

        {/* Account */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="font-semibold">Sign out</p>
            <p className="text-sm text-ivory/50">You can log back in anytime.</p>
          </div>
          <Button variant="danger" icon={LogOut} onClick={logout}>Sign out</Button>
        </Card>
      </div>
    </Page>
  );
}