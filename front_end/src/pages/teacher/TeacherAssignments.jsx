import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, Modal, PageHeader, Spinner } from '/components/ui';
import Icon from '/components/Icon';
import { useToast } from '/components/Toast';
import AssignmentForm from './AssignmentForm';

export default function TeacherAssignments() {
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const data = useAsync(() => Promise.all([api.listAssignments(), api.listCourses(), api.getSettings()]), []);
  const [editing, setEditing] = useState(params.get('new') === '1' ? 'new' : null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all');

  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [assignments, courses, settings] = data.data;

  const closeForm = () => {
    setEditing(null);
    if (params.get('new')) setParams({});
  };

  const save = async (form) => {
    if (editing === 'new') {
      await api.createAssignment(form);
      notify('Assignment published');
    } else {
      await api.updateAssignment(editing.id, form);
      notify('Assignment updated');
    }
    closeForm();
    data.reload();
  };

  const remove = async () => {
    try {
      await api.deleteAssignment(deleting.id);
      notify('Assignment deleted');
      setDeleting(null);
      data.reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const now = new Date();
  const rows = assignments.filter((a) =>
    filter === 'all' ? true : filter === 'open' ? new Date(a.dueDate) > now : new Date(a.dueDate) <= now
  );

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Create assignments, collect submissions and run similarity checks."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')} disabled={!courses.length}>
            <Icon name="plus" /> New assignment
          </button>
        }
      />

      {!courses.length && (
        <div className="alert alert-info">
          You need a course before you can create assignments. <Link to="/teacher/courses">Create a course</Link>
        </div>
      )}

      <Card padded={false}>
        <div className="tabs">
          {['all', 'open', 'closed'].map((f) => (
            <button key={f} className={`tab ${filter === f ? 'tab-on' : ''}`} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="file" title="No assignments here" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Due</th>
                  <th>Submissions</th>
                  <th>Check</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const closed = new Date(a.dueDate) <= now;
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link to={`/teacher/assignments/${a.id}`} className="strong link-plain">
                          {a.title}
                        </Link>
                      </td>
                      <td>
                        <Badge tone="blue">{a.courseCode}</Badge>
                      </td>
                      <td>
                        <div>{formatDate(a.dueDate, true)}</div>
                        <div className="small muted">{closed ? 'Closed' : 'Open'}</div>
                      </td>
                      <td>
                        {a.submissionCount} / {a.studentCount}
                      </td>
                      <td>{a.hasReport ? <Badge tone="green">Checked</Badge> : <Badge tone="neutral">Not run</Badge>}</td>
                      <td className="right">
                        <div className="row-actions">
                          <Link to={`/teacher/assignments/${a.id}`} className="icon-btn" title="Open submissions">
                            <Icon name="eye" />
                          </Link>
                          <button className="icon-btn" title="Edit" onClick={() => setEditing(a)}>
                            <Icon name="edit" />
                          </button>
                          <button className="icon-btn danger" title="Delete" onClick={() => setDeleting(a)}>
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <AssignmentForm
          initial={editing === 'new' ? null : editing}
          courses={courses}
          allowedByAdmin={settings.allowedFileTypes}
          onCancel={closeForm}
          onSave={save}
        />
      )}

      {deleting && (
        <Modal
          title="Delete assignment?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={remove}>
                Delete
              </button>
            </>
          }
        >
          <p>
            <strong>{deleting.title}</strong> and all {deleting.submissionCount} submissions and reports will be removed.
          </p>
        </Modal>
      )}
    </>
  );
}
