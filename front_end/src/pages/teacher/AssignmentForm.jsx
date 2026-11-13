import { useState } from 'react';
import { Field, Modal } from '/components/ui';
import { toInputDateTime } from '../../utils/format';

const TYPES = ['.pdf', '.docx', '.txt', '.doc', '.odt', '.py', '.java', '.c', '.cpp', '.js'];

export default function AssignmentForm({ initial, courses, allowedByAdmin, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    courseId: initial?.courseId || courses[0]?.id || '',
    title: initial?.title || '',
    description: initial?.description || '',
    dueDate: toInputDateTime(initial?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString()),
    allowedFileTypes: initial?.allowedFileTypes || allowedByAdmin.slice(),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (t) =>
    setForm((f) => ({
      ...f,
      allowedFileTypes: f.allowedFileTypes.includes(t) ? f.allowedFileTypes.filter((x) => x !== t) : [...f.allowedFileTypes, t],
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.allowedFileTypes.length) return setError('Choose at least one file type');
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, title: form.title.trim(), dueDate: new Date(form.dueDate).toISOString() });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit assignment' : 'New assignment'} onClose={onCancel} width={560}>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="Course">
          <select required value={form.courseId} onChange={set('courseId')} disabled={Boolean(initial)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input required value={form.title} onChange={set('title')} placeholder="e.g. Essay on academic integrity" autoFocus />
        </Field>
        <Field label="Instructions">
          <textarea rows={4} value={form.description} onChange={set('description')} placeholder="What should students submit?" />
        </Field>
        <Field label="Due date and time">
          <input type="datetime-local" required value={form.dueDate} onChange={set('dueDate')} />
        </Field>
        <div className="field">
          <span className="field-label">Accepted file types</span>
          <div className="chips">
            {TYPES.filter((t) => allowedByAdmin.includes(t)).map((t) => (
              <button type="button" key={t} className={`chip ${form.allowedFileTypes.includes(t) ? 'chip-on' : ''}`} onClick={() => toggle(t)}>
                {t}
              </button>
            ))}
          </div>
          <span className="field-hint">Only types enabled by the administrator are listed.</span>
        </div>
        <div className="modal-footer flush">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Publish assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
