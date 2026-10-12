import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Camera } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Button, Chip, Field, Input, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { extractError } from '../lib/api';
import { DEPARTMENTS, YEARS } from '../lib/utils';

export default function Register() {
  const { register, refresh } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: 1,
    studentId: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name';
    if (!form.email.includes('@')) nextErrors.email = 'Enter your college email';
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
    if (!form.department) nextErrors.department = 'Pick a department';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      // Create the account first so we obtain an auth token, then attach the
      // optional profile photo (the avatar endpoint requires authentication).
      await register({ ...form });
      if (image) {
        try {
          const fd = new FormData();
          fd.append('image', image);
          await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          await refresh();
        } catch {
          // A failed avatar upload must not block account creation.
        }
      }
      navigate('/onboarding');
    } catch (err) {
      showError(extractError(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Become a member"
      subtitle="Register with your student identity, then we'll personalise your profile in a few quick steps."
      footer={
        <>
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5"
          >
            {preview ? (
              <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <Camera size={22} className="text-ivory/40 transition group-hover:text-lime" />
            )}
            <span className="absolute inset-0 bg-midnight-950/0 transition group-hover:bg-midnight-950/20" />
          </button>
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-ivory/45">Optional · JPG, PNG or WebP</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" aria-label="Upload profile photo" />
        </div>

        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Aanya Mehta" />
        </Field>

        <Field label="College email" required error={errors.email} hint="Use your approved student email.">
          <Input type="email" value={form.email} onChange={set('email')} placeholder="you@yourcollege.edu" autoComplete="email" />
        </Field>

        <Field label="Password" required error={errors.password} hint="Minimum 8 characters. Never stored in plain text.">
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/45 hover:text-ivory"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Department" required error={errors.department}>
            <Select options={DEPARTMENTS} value={form.department} onChange={set('department')} placeholder="Department" />
          </Field>
          <Field label="Academic year">
            <Select options={YEARS.map((y) => ({ value: y, label: `Year ${y}` }))} value={String(form.year)} onChange={set('year')} />
          </Field>
        </div>

        <Field label="Student ID (optional)" hint="Not shown publicly.">
          <Input value={form.studentId} onChange={set('studentId')} placeholder="e.g. SSU2023001" />
        </Field>

        <Chip className="!w-full justify-center border-lavender/25 !py-2.5 text-lavender">
          Protected with secure password hashing (bcrypt)
        </Chip>

        <Button type="submit" className="w-full" size="lg" loading={loading} icon={UserPlus}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}