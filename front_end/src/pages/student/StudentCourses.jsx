import { useState } from 'react';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, EmptyState, ErrorBox, PageHeader, Spinner } from '/components/ui';
import Icon from '/components/Icon';
import { useToast } from '/components/Toast';

export default function StudentCourses() {
  const notify = useToast();
  const courses = useAsync(() => api.listCourses(), []);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const join = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const c = await api.joinCourse(code.trim());
      courses.setData((list) => [...(list || []), c]);
      setCode('');
      notify(`Joined ${c.code} · ${c.name}`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My courses" subtitle="Join a course with the code your teacher gives you." />
      <Card className="mb">
        <form className="join" onSubmit={join}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter join code, e.g. SE-4821" aria-label="Join code" />
          <button className="btn btn-primary" disabled={busy || !code.trim()}>
            <Icon name="plus" /> {busy ? 'Joining…' : 'Join course'}
          </button>
        </form>
      </Card>
      <ErrorBox error={courses.error} onRetry={courses.reload} />
      {courses.loading ? (
        <Spinner />
      ) : courses.data.length === 0 ? (
        <Card>
          <EmptyState icon="book" title="No courses yet" />
        </Card>
      ) : (
        <div className="cards">
          {courses.data.map((c) => (
            <div key={c.id} className="course-card">
              <span className="course-code">{c.code}</span>
              <h3>{c.name}</h3>
              <div className="muted small">{c.teacherName}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
