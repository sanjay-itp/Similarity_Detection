import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, formatSize } from '../../utils/format';
import { Avatar, Badge, Card, EmptyState, ErrorBox, PageHeader, ScoreBadge, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';

export default function AssignmentSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const data = useAsync(() => Promise.all([api.getAssignment(id), api.listSubmissions(id), api.getSettings()]), [id]);
  const [running, setRunning] = useState(false);

  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [assignment, submissions, settings] = data.data;
  const pending = submissions.filter((s) => s.status !== 'checked').length;

  const run = async () => {
    setRunning(true);
    try {
      await api.runCheck(id);
      notify('Similarity check complete');
      navigate(`/teacher/assignments/${id}/report`);
    } catch (err) {
      notify(err.message, 'error');
      setRunning(false);
    }
  };

  return (
    <>
      <PageHeader
        back={
          <Link to="/teacher/assignments" className="back">
            <Icon name="arrowLeft" size={16} /> Assignments
          </Link>
        }
        title={assignment.title}
        subtitle={`${assignment.courseCode} · ${assignment.courseName} · due ${formatDate(assignment.dueDate, true)}`}
        actions={
          <>
            {assignment.hasReport && (
              <Link to={`/teacher/assignments/${id}/report`} className="btn btn-ghost">
                <Icon name="report" /> View report
              </Link>
            )}
            <button className="btn btn-primary" onClick={run} disabled={running || submissions.length < 2}>
              <Icon name="scan" /> {running ? 'Checking…' : assignment.hasReport ? 'Re-run check' : 'Run similarity check'}
            </button>
          </>
        }
      />

      {running && (
        <div className="alert alert-info">
          <span className="spinner" /> Comparing {submissions.length} submissions ({(submissions.length * (submissions.length - 1)) / 2}{' '}
          pairs). This can take a while for large classes.
        </div>
      )}

      <div className="stats stats-3">
        <div className="mini-stat">
          <span className="muted small">Submitted</span>
          <strong>
            {submissions.length} / {assignment.studentCount}
          </strong>
        </div>
        <div className="mini-stat">
          <span className="muted small">Not yet checked</span>
          <strong>{pending}</strong>
        </div>
        <div className="mini-stat">
          <span className="muted small">Late</span>
          <strong>{submissions.filter((s) => s.late).length}</strong>
        </div>
      </div>

      {assignment.description && (
        <Card title="Instructions" className="mb">
          <p className="pre">{assignment.description}</p>
          <p className="muted small">Accepted: {assignment.allowedFileTypes.join(', ')}</p>
        </Card>
      )}

      <Card title="Submissions" padded={false}>
        {submissions.length === 0 ? (
          <EmptyState icon="upload" title="No submissions yet">
            Students in {assignment.courseCode} will see this assignment on their dashboard.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="right">Highest match</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="person">
                        <Avatar name={s.studentName} size={32} />
                        <div>
                          <div className="strong">{s.studentName}</div>
                          <div className="muted small">{s.studentNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="file">
                        <Icon name="file" />
                        <div>
                          <div>{s.fileName}</div>
                          <div className="muted small">{formatSize(s.fileSize)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {formatDate(s.submittedAt, true)} {s.late && <Badge tone="amber">Late</Badge>}
                    </td>
                    <td>{s.status === 'checked' ? <Badge tone="green">Checked</Badge> : <Badge tone="blue">New</Badge>}</td>
                    <td className="right">{s.maxScore != null ? <ScoreBadge score={s.maxScore} threshold={settings.similarityThreshold} /> : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
