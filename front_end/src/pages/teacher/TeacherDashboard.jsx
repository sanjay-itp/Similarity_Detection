import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../utils/useAsync';
import { formatDate, timeLeft } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, ScoreBadge, Spinner, StatCard } from '../../components/ui';
import Icon from '../../components/Icon';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const data = useAsync(
    () => Promise.all([api.listCourses(), api.listAssignments(), api.listReports(), api.getSettings()]),
    []
  );

  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [courses, assignments, reports, settings] = data.data;
  const open = assignments.filter((a) => new Date(a.dueDate) > new Date());
  const toCheck = assignments.filter((a) => !a.hasReport && a.submissionCount >= 2);
  const flagged = reports.reduce((t, r) => t + r.flagged, 0);
  const totalSubs = assignments.reduce((t, a) => t + a.submissionCount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle="Here is what needs your attention."
        actions={
          <Link to="/teacher/assignments?new=1" className="btn btn-primary">
            <Icon name="plus" /> New assignment
          </Link>
        }
      />
      <div className="stats">
        <StatCard label="Courses" value={courses.length} icon="book" />
        <StatCard label="Open assignments" value={open.length} icon="file" tone="amber" />
        <StatCard label="Submissions received" value={totalSubs} icon="upload" tone="green" />
        <StatCard label="Flagged pairs" value={flagged} icon="alert" tone="red" hint={`at or above ${settings.similarityThreshold}%`} />
      </div>

      <div className="grid-2">
        <Card title="Ready for a similarity check">
          {toCheck.length === 0 ? (
            <EmptyState icon="scan" title="Nothing waiting">
              Assignments with two or more unchecked submissions appear here.
            </EmptyState>
          ) : (
            <ul className="list">
              {toCheck.map((a) => (
                <li key={a.id} className="list-item">
                  <div>
                    <div className="strong">{a.title}</div>
                    <div className="muted small">
                      {a.courseCode} · {a.submissionCount} submissions
                    </div>
                  </div>
                  <Link className="btn btn-sm btn-primary" to={`/teacher/assignments/${a.id}`}>
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming deadlines">
          {open.length === 0 ? (
            <EmptyState icon="clock" title="No open assignments" />
          ) : (
            <ul className="list">
              {open
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((a) => (
                  <li key={a.id} className="list-item">
                    <div>
                      <div className="strong">{a.title}</div>
                      <div className="muted small">
                        {a.courseCode} · due {formatDate(a.dueDate, true)}
                      </div>
                    </div>
                    <div className="right">
                      <Badge tone="blue">{timeLeft(a.dueDate)}</Badge>
                      <div className="muted small mt-xs">
                        {a.submissionCount}/{a.studentCount} submitted
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Latest similarity reports"
        className="mt"
        actions={
          <Link to="/teacher/reports" className="link">
            View all
          </Link>
        }
      >
        {reports.length === 0 ? (
          <EmptyState icon="report" title="No reports yet" />
        ) : (
          <ul className="list">
            {reports.slice(0, 4).map((r) => (
              <li key={r.assignmentId} className="list-item">
                <div>
                  <div className="strong">{r.assignmentTitle}</div>
                  <div className="muted small">
                    {r.courseCode} · {formatDate(r.generatedAt, true)} · {r.flagged} flagged of {r.pairs} pairs
                  </div>
                </div>
                <div className="row-actions">
                  <ScoreBadge score={r.max} threshold={settings.similarityThreshold} />
                  <Link className="btn btn-sm btn-ghost" to={`/teacher/assignments/${r.assignmentId}/report`}>
                    Open
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
