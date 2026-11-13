import { useState } from 'react';
import { api } from '../../api';
import { formatDate } from '../../utils/format';
import { Avatar, Badge, EmptyState, Field, Modal } from '/components/ui';
import Icon from '/components/Icon';
import { useToast } from '/components/Toast';

// Shared table for the Teachers and Students admin pages.
export default function UserTable({ users, role, onChange }) {
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [resetFor, setResetFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = users.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.studentId || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q)
  );

  const toggleActive = async (u) => {
    try {
      const updated = await api.setUserActive(u.id, !u.active);
      onChange((list) => list.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
      notify(`${u.name} ${updated.active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const doReset = async () => {
    if (password.length < 8) return notify('Password must be at least 8 characters', 'error');
    setBusy(true);
    try {
      await api.resetUserPassword(resetFor.id, password);
      notify(`Password reset for ${resetFor.name}`);
      setResetFor(null);
      setPassword('');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.deleteUser(deleteFor.id);
      onChange((list) => list.filter((x) => x.id !== deleteFor.id));
      notify(`${deleteFor.name} deleted`);
      setDeleteFor(null);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder={`Search ${role}s by name, email${role === 'student' ? ', ID' : ', department'}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="muted small">
          {rows.length} of {users.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="users" title={users.length ? 'No matches' : `No ${role}s yet`} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>{role === 'student' ? 'Student ID' : 'Department'}</th>
                <th>{role === 'student' ? 'Submissions' : 'Courses'}</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="person">
                      <Avatar name={u.name} size={32} />
                      <div>
                        <div className="strong">{u.name}</div>
                        <div className="muted small">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{role === 'student' ? u.studentId : u.department || '–'}</td>
                  <td>{role === 'student' ? u.submissionCount ?? 0 : u.courseCount ?? 0}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{u.active ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}</td>
                  <td className="right">
                    <div className="row-actions">
                      <button className="icon-btn" title="Reset password" onClick={() => setResetFor(u)}>
                        <Icon name="key" />
                      </button>
                      <button
                        className="icon-btn"
                        title={u.active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(u)}
                      >
                        <Icon name="power" />
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setDeleteFor(u)}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetFor && (
        <Modal
          title={`Reset password for ${resetFor.name}`}
          onClose={() => setResetFor(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setResetFor(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={doReset} disabled={busy}>
                Reset password
              </button>
            </>
          }
        >
          <Field label="New password" hint="Share it with the user privately. They can change it under My Account.">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}

      {deleteFor && (
        <Modal
          title="Delete account?"
          onClose={() => setDeleteFor(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleteFor(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={doDelete} disabled={busy}>
                Delete
              </button>
            </>
          }
        >
          <p>
            <strong>{deleteFor.name}</strong> will lose access permanently. Consider deactivating instead if you may need the
            account again.
          </p>
        </Modal>
      )}
    </>
  );
}
