import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, formatSize } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, Spinner } from '/components/ui';
import Icon from '/components/Icon';

export default function MySubmissions() {
  const subs = useAsync(() => api.mySubmissions(), []);
  if (subs.loading) return <Spinner />;
  if (subs.error) return <ErrorBox error={subs.error} onRetry={subs.reload} />;

  return (
    <>
      <PageHeader title="My submissions" subtitle="Everything you have handed in." />
      <Card padded={false}>
        {subs.data.length === 0 ? (
          <EmptyState
            icon="upload"
            title="No submissions yet"
            action={
              <Link to="/student/assignments" className="btn btn-primary">
                See assignments
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/student/assignments/${s.assignmentId}`} className="strong link-plain">
                        {s.assignmentTitle}
                      </Link>
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
                    <td>{s.status === 'checked' ? <Badge tone="green">Reviewed</Badge> : <Badge tone="blue">Awaiting review</Badge>}</td>
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
