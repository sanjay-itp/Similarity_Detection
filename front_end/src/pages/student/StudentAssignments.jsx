import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, timeLeft } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, Spinner } from '/components/ui';

function statusOf(a) {
  if (a.mySubmission) return a.mySubmission.late ? { tone: 'amber', label: 'Submitted late' } : { tone: 'green', label: 'Submitted' };
  if (new Date(a.dueDate) <= new Date()) return { tone: 'red', label: 'Missed' };
  return { tone: 'blue', label: timeLeft(a.dueDate) };
}

export default function StudentAssignments() {
  const assignments = useAsync(() => api.listAssignments(), []);
  const [filter, setFilter] = useState('todo');

  if (assignments.loading) return <Spinner />;
  if (assignments.error) return <ErrorBox error={assignments.error} onRetry={assignments.reload} />;

  const now = new Date();
  const rows = assignments.data.filter((a) => {
    if (filter === 'todo') return !a.mySubmission && new Date(a.dueDate) > now;
    if (filter === 'done') return a.mySubmission;
    return true;
  });

  return (
    <>
      <PageHeader title="Assignments" subtitle="Assignments from all your courses." />
      <Card padded={false}>
        <div className="tabs">
          {[
            ['todo', 'To do'],
            ['done', 'Submitted'],
            ['all', 'All'],
          ].map(([key, label]) => (
            <button key={key} className={`tab ${filter === key ? 'tab-on' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="file" title="Nothing here" />
        ) : (
          <ul className="list list-padded">
            {rows.map((a) => {
              const s = statusOf(a);
              return (
                <li key={a.id} className="list-item">
                  <div>
                    <Link to={`/student/assignments/${a.id}`} className="strong link-plain">
                      {a.title}
                    </Link>
                    <div className="muted small">
                      {a.courseCode} · {a.courseName} · due {formatDate(a.dueDate, true)}
                    </div>
                  </div>
                  <div className="row-actions">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <Link className="btn btn-sm btn-ghost" to={`/student/assignments/${a.id}`}>
                      {a.mySubmission ? 'View' : 'Open'}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
