import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate } from '../../utils/format';
import { Card, ErrorBox, PageHeader, Spinner, StatCard } from '../../components/ui';
import Icon from '../../components/Icon';

export default function AdminDashboard() {
  const stats = useAsync(() => api.getAdminStats(), []);
  const activity = useAsync(() => api.getActivity(), []);
  const settings = useAsync(() => api.getSettings(), []);

  return (
    <>
      <PageHeader
        title="Administrator dashboard"
        subtitle={settings.data?.institutionName || 'System overview'}
        actions={
          <Link to="/admin/teachers?new=1" className="btn btn-primary">
            <Icon name="plus" /> Add teacher
          </Link>
        }
      />

      <ErrorBox error={stats.error} onRetry={stats.reload} />
      <div className="stats">
        <StatCard label="Teachers" value={stats.data?.teachers} icon="teacher" />
        <StatCard label="Students" value={stats.data?.students} icon="users" tone="green" />
        <StatCard label="Courses" value={stats.data?.courses} icon="book" tone="amber" />
        <StatCard label="Submissions" value={stats.data?.submissions} icon="upload" tone="violet" />
        <StatCard label="Checks run" value={stats.data?.checksRun} icon="scan" tone="red" />
      </div>

      <div className="grid-2-1">
        <Card title="Recent activity">
          {activity.loading ? (
            <Spinner />
          ) : (
            <ul className="timeline">
              {(activity.data || []).map((a) => (
                <li key={a.id}>
                  <span className="timeline-dot" />
                  <div>
                    <div>
                      <strong>{a.actor}</strong> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}
                    </div>
                    <div className="muted small">{formatDate(a.at, true)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="System configuration">
          {settings.data && (
            <dl className="details">
              <dt>Similarity threshold</dt>
              <dd>{settings.data.similarityThreshold}%</dd>
              <dt>Allowed file types</dt>
              <dd>{settings.data.allowedFileTypes.join(', ')}</dd>
              <dt>Max upload size</dt>
              <dd>{settings.data.maxFileSizeMb} MB</dd>
              <dt>Student self registration</dt>
              <dd>{settings.data.allowStudentRegistration ? 'Open' : 'Closed'}</dd>
            </dl>
          )}
          <Link to="/admin/settings" className="btn btn-ghost btn-block mt-sm">
            <Icon name="settings" /> Change settings
          </Link>
        </Card>
      </div>
    </>
  );
}
