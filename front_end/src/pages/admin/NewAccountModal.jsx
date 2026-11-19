import { useState } from 'react';
import { api } from '../../api';
import { Field, Modal } from '../../components/ui';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Students get a student ID, teachers get a department.
const ROLES = {
  student: {
    noun: 'student',
    extra: { key: 'studentId', label: 'Student ID', placeholder: 'e.g. CS-2024-015', required: true },
    create: (data) => api.createStudent(data),
  },
  teacher: {
    noun: 'teacher',
    extra: { key: 'department', label: 'Department', placeholder: 'e.g. Computer Science', required: false },
    create: (data) => api.createTeacher(data),
  },
};

const emptyForm = () => ({ name: '', email: '', studentId: '', department: '', password: randomPassword() });

// Admins create every account. Nobody signs up on their own.
export default function NewAccountModal({ role, onCreated, onClose }) {
  const notify = useToast();
  const cfg = ROLES[role];
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return notify('Password must be at least 8 characters', 'error');
    setBusy(true);
    try {
      const user = await cfg.create({
        name: form.name.trim(),
        email: form.email.trim(),
        [cfg.extra.key]: form[cfg.extra.key].trim(),
        password: form.password,
      });
      onCreated(user);
      setCreated({ ...user, password: form.password });
      notify(`Account created for ${user.name}`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const addAnother = () => {
    setCreated(null);
    setForm(emptyForm());
  };

  return (
    <Modal title={created ? 'Account ready' : `New ${cfg.noun}`} onClose={onClose}>
      {created ? (
        <div className="stack">
          <p>Share these with {created.name}. The password won't be shown again.</p>
          <div className="credentials">
            <div>
              <span className="muted small">Email</span>
              <code>{created.email}</code>
            </div>
            <div>
              <span className="muted small">Temporary password</span>
              <code>{created.password}</code>
            </div>
          </div>
          <div className="modal-footer flush">
            <button
              className="btn btn-ghost"
              onClick={() => {
                navigator.clipboard?.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
                notify('Copied');
              }}
            >
              <Icon name="copy" /> Copy
            </button>
            <button className="btn btn-ghost" onClick={addAnother}>
              Add another
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <Field label="Full name">
            <input required value={form.name} onChange={set('name')} autoFocus />
          </Field>
          <div className="form-row">
            <Field label="Email">
              <input type="email" required value={form.email} onChange={set('email')} placeholder="name@college.edu" />
            </Field>
            <Field label={cfg.extra.label}>
              <input
                required={cfg.extra.required}
                value={form[cfg.extra.key]}
                onChange={set(cfg.extra.key)}
                placeholder={cfg.extra.placeholder}
              />
            </Field>
          </div>
          <Field label="Temporary password" hint="They can change it after signing in.">
            <div className="input-with-btn">
              <input required value={form.password} onChange={set('password')} />
              <button type="button" className="input-btn" onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>
                New
              </button>
            </div>
          </Field>
          <div className="modal-footer flush">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
