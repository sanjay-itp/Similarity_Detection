import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, ErrorBox, Field, Modal, PageHeader, Spinner } from '/components/ui';
import Icon from '/components/Icon';
import { useToast } from '/components/Toast';
import UserTable from './UserTable';

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const empty = () => ({ name: '', email: '', department: '', password: randomPassword() });

export default function ManageTeachers() {
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const teachers = useAsync(() => api.listUsers('teacher'), []);
  const [open, setOpen] = useState(params.get('new') === '1');
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    setOpen(false);
    setCreated(null);
    setForm(empty());
    if (params.get('new')) setParams({});
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return notify('Password must be at least 8 characters', 'error');
    setBusy(true);
    try {
      const t = await api.createTeacher({
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        password: form.password,
      });
      teachers.setData((list) => [...(list || []), { ...t, courseCount: 0 }]);
      setCreated({ ...t, password: form.password });
      notify(`Teacher account created for ${t.name}`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle="Only administrators can create teacher accounts."
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> Add teacher
          </button>
        }
      />
      <Card padded>
        <ErrorBox error={teachers.error} onRetry={teachers.reload} />
        {teachers.loading ? <Spinner /> : <UserTable users={teachers.data || []} role="teacher" onChange={teachers.setData} />}
      </Card>

      {open && (
        <Modal title={created ? 'Teacher account created' : 'Add a teacher'} onClose={close}>
          {created ? (
            <div className="stack">
              <p>Give these sign-in details to {created.name}. The password will not be shown again.</p>
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
                    notify('Copied to clipboard');
                  }}
                >
                  <Icon name="copy" /> Copy
                </button>
                <button className="btn btn-primary" onClick={close}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <Field label="Full name">
                <input required value={form.name} onChange={set('name')} placeholder="e.g. Dr. Anita Sharma" autoFocus />
              </Field>
              <Field label="Email address">
                <input type="email" required value={form.email} onChange={set('email')} placeholder="name@college.edu" />
              </Field>
              <Field label="Department">
                <input value={form.department} onChange={set('department')} placeholder="e.g. Computer Science" />
              </Field>
              <Field label="Temporary password" hint="The teacher can change it after signing in.">
                <div className="input-with-btn">
                  <input required value={form.password} onChange={set('password')} />
                  <button type="button" className="input-btn" onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>
                    Generate
                  </button>
                </div>
              </Field>
              <div className="modal-footer flush">
                <button type="button" className="btn btn-ghost" onClick={close}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
