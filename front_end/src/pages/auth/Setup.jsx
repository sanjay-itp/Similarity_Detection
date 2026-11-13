import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Field, Spinner } from '/components/ui';
import Icon from '/components/Icon';

// First-run screen. Shown only when the backend reports that no admin exists,
// i.e. right after the administrator installs and starts the system.
export default function Setup() {
  const { setupAdmin } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSetupStatus()
      .then((s) => {
        if (!s?.needsSetup) navigate('/login', { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await setupAdmin({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <Spinner />;

  return (
    <AuthLayout>
      <span className="eyebrow">First-time setup</span>
      <h2 className="auth-title">Create the administrator account</h2>
      <p className="auth-sub">
        This account manages teachers, students and system settings. You can only do this once.
      </p>
      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={submit} className="form">
        <Field label="Full name">
          <input required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email address">
          <input type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <div className="form-row">
          <Field label="Password">
            <input type="password" required value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Confirm password">
            <input type="password" required value={form.confirm} onChange={set('confirm')} />
          </Field>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Setting up…' : 'Finish setup'}
        </button>
      </form>
    </AuthLayout>
  );
}
