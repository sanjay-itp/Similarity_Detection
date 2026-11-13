import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../utils/useAsync';
import { formatDate, timeLeft } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, Spinner, StatCard } from '../../components/ui';

export default function StudentDashboard() {
  const { user } = useAuth();
  const data = useAsync(() => Promise.all([api.listAssignments(), api.listCourses()]), []);

  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [assignments, courses] = data.data;
  const now = new Date();
  const due = assignments
    .filter((a) => !a.mySubmission && new Date(a.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const done = assignments.filter((a) => a.mySubmission);
  const missed = assignments.filter((a) => !a.mySubmission && new Date(a.dueDate) <= now);

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle={user.studentId ? `Student ID ${user.studentId}` : undefined} />
      <div className="stats">
        <StatCard label="Courses" value={courses.length} icon="book" />
        <StatCard label="To submit" value={due.length} icon="clock" tone="amber" />
        <StatCard label="Submitted" value={done.length} icon="check" tone="green" />
        <StatCard label="Missed" value={missed.length} icon="alert" tone="red" />
      </div>

      {courses.length === 0 && (
        <Card className="mb">
          <EmptyState
            icon="book"
            title="You are not in any course yet"
            action={
              <Link className="btn btn-primary" to="/student/courses">
                Join a course
              </Link>
            }
          >
            Ask your teacher for the course join code.
          </EmptyState>
        </Card>
      )}

      <Card title="Due soon">
        {due.length === 0 ? (
          <EmptyState icon="check" title="You're all caught up" />
        ) : (
          <ul className="list">
            {due.map((a) => (
              <li key={a.id} className="list-item">
                <div>
                  <div className="strong">{a.title}</div>
                  <div className="muted small">
                    {a.courseCode} · due {formatDate(a.dueDate, true)}
                  </div>
                </div>
                <div className="row-actions">
                  <Badge tone="amber">{timeLeft(a.dueDate)}</Badge>
                  <Link className="btn btn-sm btn-primary" to={`/student/assignments/${a.id}`}>
                    Submit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
