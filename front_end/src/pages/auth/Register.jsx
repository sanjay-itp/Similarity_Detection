import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { Field } from '/components/ui';
import Icon from '/components/Icon';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.studentId.trim()) e.studentId = 'Enter your student ID or roll number';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        studentId: form.studentId.trim(),
        password: form.password,
      });
      navigate('/student', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Create a student account</h2>
      <p className="auth-sub">Teachers: ask your administrator for an account instead.</p>

      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="form" noValidate>
        <Field label="Full name" error={errors.name}>
          <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Sita Thapa" />
        </Field>
        <div className="form-row">
          <Field label="Email address" error={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@college.edu" />
          </Field>
          <Field label="Student ID" error={errors.studentId}>
            <input value={form.studentId} onChange={set('studentId')} placeholder="e.g. CS-2024-015" />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Password" error={errors.password}>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
