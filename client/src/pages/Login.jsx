import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractError } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.email.includes('@')) nextErrors.email = 'Enter your college email';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      showError(extractError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const demoFill = (email) =>
    setForm({ email, password: 'DemoPass123' });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to jump back into your campus community."
      footer={
        <>
          New to Skill Swap University?{' '}
          <Link to="/register" className="font-semibold text-lime hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="College email" required error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@yourcollege.edu"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              autoComplete="current-password"
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

        <Button type="submit" className="w-full" size="lg" loading={loading} icon={LogIn}>
          Log in
        </Button>

        <div className="pt-2">
          <p className="mb-2 text-center text-xs uppercase tracking-wider text-ivory/35">Try a demo student</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => demoFill('demo1@demo.ssu.edu')}>
              demo1@demo.ssu.edu
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => demoFill('demo5@demo.ssu.edu')}>
              demo5@demo.ssu.edu
            </Button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}