import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, isMock } from '../../api';
import { resetMockData } from '../../api/mock';
import { Card, Field, PageHeader, Avatar } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { semesterLabel } from '../../utils/semesters';

export default function Account() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) return notify('New password must be at least 8 characters', 'error');
    if (form.next !== form.confirm) return notify('Passwords do not match', 'error');
    setBusy(true);
    try {
      await api.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      notify('Password updated');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My account" subtitle="Your profile and password." />
      <div className="grid-2">
        <Card title="Profile">
          <div className="profile">
            <Avatar name={user.name} size={56} />
            <div>
              <div className="profile-name">{user.name}</div>
              <div className="muted">{user.email}</div>
            </div>
          </div>
          <dl className="details">
            <dt>Role</dt>
            <dd className="capitalize">{user.role}</dd>
            {user.studentId && (
              <>
                <dt>Student ID</dt>
                <dd>{user.studentId}</dd>
                <dt>Semester</dt>
                <dd>{semesterLabel(user.semester)}</dd>
              </>
            )}
            {user.department && (
              <>
                <dt>Department</dt>
                <dd>{user.department}</dd>
              </>
            )}
          </dl>
        </Card>
        <Card title="Change password">
          <form className="form" onSubmit={submit}>
            <Field label="Current password">
              <input type="password" required value={form.current} onChange={set('current')} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <input type="password" required value={form.next} onChange={set('next')} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </Field>
            <div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        </Card>
      </div>
      {isMock && (
        <Card title="Demo data" className="mt">
          <p className="muted">
            You are running with built-in demo data stored in this browser. Resetting restores the original demo accounts,
            courses and submissions.
          </p>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              resetMockData();
              await logout();
              window.location.href = '/login';
            }}
          >
            Reset demo data
          </button>
        </Card>
      )}
    </>
  );
}
