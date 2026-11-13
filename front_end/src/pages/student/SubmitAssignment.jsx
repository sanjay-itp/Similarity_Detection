import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, formatSize, timeLeft } from '../../utils/format';
import { Badge, Card, ErrorBox, PageHeader, Spinner } from '/components/ui';
import Icon from '/components/Icon';
import { useToast } from '/components/Toast';

export default function SubmitAssignment() {
  const { id } = useParams();
  const notify = useToast();
  const data = useAsync(() => Promise.all([api.getAssignment(id), api.getSettings()]), [id]);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const input = useRef(null);

  if (data.loading) return <Spinner />;
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const [a, settings] = data.data;
  const closed = new Date(a.dueDate) <= new Date();
  const mine = a.mySubmission;

  const pick = (f) => {
    setError('');
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!a.allowedFileTypes.includes(ext)) {
      setError(`${ext} files are not accepted. Use ${a.allowedFileTypes.join(', ')}.`);
      return;
    }
    if (f.size > settings.maxFileSizeMb * 1024 * 1024) {
      setError(`File is larger than the ${settings.maxFileSizeMb} MB limit.`);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const sub = await api.submitAssignment(id, file);
      data.setData(([assignment, s]) => [{ ...assignment, mySubmission: sub }, s]);
      setFile(null);
      notify('Assignment submitted');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        back={
          <Link to="/student/assignments" className="back">
            <Icon name="arrowLeft" size={16} /> Assignments
          </Link>
        }
        title={a.title}
        subtitle={`${a.courseCode} · ${a.courseName}`}
      />

      <div className="grid-2-1">
        <div className="stack">
          <Card title="Instructions">
            <p className="pre">{a.description || 'No extra instructions.'}</p>
          </Card>

          <Card title={mine ? 'Replace your submission' : 'Your submission'}>
            {closed ? (
              <div className="alert alert-warn">
                <Icon name="clock" /> The deadline has passed. Submissions are closed.
              </div>
            ) : (
              <>
                <div
                  className={`dropzone ${drag ? 'dropzone-on' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    pick(e.dataTransfer.files[0]);
                  }}
                  onClick={() => input.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
                >
                  <Icon name="upload" size={28} />
                  <strong>Drop your file here or click to browse</strong>
                  <span className="muted small">
                    {a.allowedFileTypes.join(', ')} · up to {settings.maxFileSizeMb} MB
                  </span>
                  <input
                    ref={input}
                    type="file"
                    hidden
                    accept={a.allowedFileTypes.join(',')}
                    onChange={(e) => {
                      pick(e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </div>

                {error && (
                  <div className="alert alert-error mt-sm">
                    <Icon name="alert" /> {error}
                  </div>
                )}

                {file && (
                  <div className="picked">
                    <div className="file">
                      <Icon name="file" />
                      <div>
                        <div className="strong">{file.name}</div>
                        <div className="muted small">{formatSize(file.size)}</div>
                      </div>
                    </div>
                    <button className="icon-btn" onClick={() => setFile(null)} title="Remove">
                      <Icon name="x" />
                    </button>
                  </div>
                )}

                <label className="check mt-sm">
                  <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                  I confirm this is my own work and I have cited all sources.
                </label>

                <button className="btn btn-primary mt-sm" disabled={!file || !confirm || busy} onClick={submit}>
                  {busy ? 'Uploading…' : mine ? 'Replace submission' : 'Submit assignment'}
                </button>
              </>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card title="Details">
            <dl className="details">
              <dt>Due</dt>
              <dd>{formatDate(a.dueDate, true)}</dd>
              <dt>Time left</dt>
              <dd>{timeLeft(a.dueDate)}</dd>
              <dt>Accepted files</dt>
              <dd>{a.allowedFileTypes.join(', ')}</dd>
            </dl>
          </Card>
          <Card title="Status">
            {mine ? (
              <div className="stack-sm">
                <Badge tone={mine.late ? 'amber' : 'green'}>{mine.late ? 'Submitted late' : 'Submitted'}</Badge>
                <div className="file">
                  <Icon name="file" />
                  <div>
                    <div className="strong">{mine.fileName}</div>
                    <div className="muted small">
                      {formatSize(mine.fileSize)} · {formatDate(mine.submittedAt, true)}
                    </div>
                  </div>
                </div>
                <div className="muted small">
                  {mine.status === 'checked' ? 'Your teacher has reviewed submissions for this assignment.' : 'Waiting for your teacher to review.'}
                </div>
              </div>
            ) : (
              <Badge tone={closed ? 'red' : 'neutral'}>{closed ? 'Missed' : 'Not submitted'}</Badge>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
