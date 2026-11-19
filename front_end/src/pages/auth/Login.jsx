import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth, homeFor } from '../../context/AuthContext';
import { api, isMock } from '../../api';
import { Field } from '../../components/ui';
import Icon from '../../components/Icon';

const DEMO = [
  { role: 'Admin', email: 'admin@integritycheck.local', password: 'admin123' },
  { role: 'Teacher', email: 'teacher@integritycheck.local', password: 'teacher123' },
  { role: 'Student', email: 'student@integritycheck.local', password: 'student123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // On a fresh install there is no admin yet: send the installer to setup.
  useEffect(() => {
    api
      .getSetupStatus()
      .then((s) => s?.needsSetup && navigate('/setup', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="auth-title">Welcome back</h2>

      {error && (
        <div className="alert alert-error">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="form">
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
          />
        </Field>
        <Field label="Password">
          <div className="input-with-btn">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                          />
            <button type="button" className="input-btn" onClick={() => setShowPw((s) => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-note">No account? Ask your administrator.</p>

      {isMock && (
        <div className="demo-box">
          <strong>Demo accounts</strong>
          <div className="demo-list">
            {DEMO.map((d) => (
              <button
                key={d.role}
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
