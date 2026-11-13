import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, ScoreBadge, Spinner } from '/components/ui';

export default function ReportsList() {
  const data = useAsync(() => Promise.all([api.listReports(), api.getSettings()]), []);
  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [reports, settings] = data.data;

  return (
    <>
      <PageHeader title="Similarity reports" subtitle="Every similarity check you have run, newest first." />
      <Card padded={false}>
        {reports.length === 0 ? (
          <EmptyState icon="report" title="No reports yet">
            Open an assignment and run a similarity check to create a report.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Generated</th>
                  <th>Submissions</th>
                  <th>Flagged pairs</th>
                  <th>Highest</th>
                  <th className="right" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.assignmentId}>
                    <td>
                      <div className="strong">{r.assignmentTitle}</div>
                      <Badge tone="blue">{r.courseCode}</Badge>
                    </td>
                    <td>{formatDate(r.generatedAt, true)}</td>
                    <td>{r.submissions}</td>
                    <td>{r.flagged > 0 ? <Badge tone="red">{r.flagged} flagged</Badge> : <Badge tone="green">None</Badge>}</td>
                    <td>
                      <ScoreBadge score={r.max} threshold={settings.similarityThreshold} />
                    </td>
                    <td className="right">
                      <Link className="btn btn-sm btn-ghost" to={`/teacher/assignments/${r.assignmentId}/report`}>
                        Open report
                      </Link>
                    </td>
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
