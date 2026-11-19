import { useState } from 'react';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, EmptyState, ErrorBox, Field, Modal, PageHeader, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { SEMESTERS, semesterLabel } from '../../utils/semesters';

export default function TeacherCourses() {
  const notify = useToast();
  const courses = useAsync(() => api.listCourses(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', semester: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await api.createCourse({ code: form.code.trim().toUpperCase(), name: form.name.trim(), semester: Number(form.semester) });
      courses.setData((list) => [...(list || []), c]);
      notify(`${c.code} created. ${c.studentCount} ${semesterLabel(c.semester)} students added.`);
      setOpen(false);
      setForm({ code: '', name: '', semester: '' });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(code);
    notify('Join code copied');
  };

  return (
    <>
      <PageHeader
        title="My courses"
        subtitle="Students in a course's semester are added automatically."
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> New course
          </button>
        }
      />
      <ErrorBox error={courses.error} onRetry={courses.reload} />
      {courses.loading ? (
        <Spinner />
      ) : courses.data.length === 0 ? (
        <Card>
          <EmptyState icon="book" title="No courses yet" action={<button className="btn btn-primary" onClick={() => setOpen(true)}>Create your first course</button>}>
            Pick its semester and those students are added for you.
          </EmptyState>
        </Card>
      ) : (
        <div className="cards">
          {courses.data.map((c) => (
            <div key={c.id} className="course-card">
              <div className="course-meta">
                <span className="course-code">{c.code}</span>
                <span className="muted small">{semesterLabel(c.semester)}</span>
              </div>
              <h3>{c.name}</h3>
              <div className="muted small">{c.studentCount} students enrolled</div>
              <div className="joincode">
                <span>
                  Join code <strong>{c.joinCode}</strong>
                </span>
                <button className="icon-btn" title="Copy join code" onClick={() => copy(c.joinCode)}>
                  <Icon name="copy" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title="New course" onClose={() => setOpen(false)}>
          <form className="form" onSubmit={submit}>
            <Field label="Course code">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" autoFocus />
            </Field>
            <Field label="Course name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Software Engineering" />
            </Field>
            <Field label="Semester" hint="Everyone in this semester is enrolled automatically.">
              <select required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="" disabled>
                  Choose a semester
                </option>
                {SEMESTERS.map((n) => (
                  <option key={n} value={n}>
                    {semesterLabel(n)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="modal-footer flush">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Creating…' : 'Create course'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
//phase 5