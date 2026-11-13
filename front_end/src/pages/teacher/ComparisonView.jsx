import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, riskLevel } from '../../utils/format';
import { Card, ErrorBox, PageHeader, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';

// Splits text into plain and highlighted pieces using [start, end] ranges.
function Highlighted({ text, ranges }) {
  const parts = [];
  let pos = 0;
  ranges.forEach(([start, end], i) => {
    if (start > pos) parts.push(<span key={`t${i}`}>{text.slice(pos, start)}</span>);
    parts.push(
      <mark key={`m${i}`} className="match">
        {text.slice(start, end)}
      </mark>
    );
    pos = end;
  });
  if (pos < text.length) parts.push(<span key="end">{text.slice(pos)}</span>);
  return <div className="doc-text">{parts}</div>;
}

function coverage(text, ranges) {
  if (!text) return 0;
  const covered = ranges.reduce((t, [s, e]) => t + (e - s), 0);
  return Math.round((covered / text.length) * 100);
}

export default function ComparisonView() {
  const { pairId } = useParams();
  const notify = useToast();
  const pair = useAsync(() => api.getPair(pairId), [pairId]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pair.data) setNote(pair.data.review?.note || '');
  }, [pair.data]);

  if (pair.loading) return <Spinner />;
  if (pair.error) return <ErrorBox error={pair.error} onRetry={pair.reload} />;
  const p = pair.data;
  const level = riskLevel(p.score, p.threshold);

  const review = async (status) => {
    setSaving(true);
    try {
      const r = await api.setPairReview(pairId, { status, note });
      pair.setData((d) => ({ ...d, review: r }));
      notify(status === 'flagged' ? 'Pair flagged for follow-up' : status === 'cleared' ? 'Pair marked as cleared' : 'Review reset');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const status = p.review?.status || 'pending';

  return (
    <>
      <PageHeader
        back={
          <Link to={`/teacher/assignments/${p.assignmentId}/report`} className="back">
            <Icon name="arrowLeft" size={16} /> Report
          </Link>
        }
        title={`${p.a.studentName} vs ${p.b.studentName}`}
        subtitle={p.assignmentTitle}
        actions={
          <div className={`score-big score-${level}`}>
            <strong>{p.score}%</strong>
            <span>similar</span>
          </div>
        }
      />

      <div className="compare">
        {[
          { side: p.a, ranges: p.matches.a },
          { side: p.b, ranges: p.matches.b },
        ].map(({ side, ranges }) => (
          <Card key={side.submissionId} padded={false} className="doc">
            <div className="doc-head">
              <div>
                <div className="strong">{side.studentName}</div>
                <div className="muted small">
                  {side.fileName} · {formatDate(side.submittedAt, true)}
                </div>
              </div>
              <span className="muted small">{coverage(side.text, ranges)}% of text matched</span>
            </div>
            <Highlighted text={side.text} ranges={ranges} />
          </Card>
        ))}
      </div>

      <Card title="Your review" className="mt">
        <div className="review">
          <textarea
            rows={3}
            placeholder="Notes for this pair (visible to teachers only)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="review-actions">
            <span className="muted small">
              Current: <strong>{{ pending: 'Not reviewed', flagged: 'Flagged', cleared: 'Cleared' }[status]}</strong>
              {p.review?.reviewedBy && ` by ${p.review.reviewedBy}`}
            </span>
            <div className="row-actions">
              <button className="btn btn-ghost" disabled={saving} onClick={() => review('cleared')}>
                <Icon name="check" /> Mark as cleared
              </button>
              <button className="btn btn-danger" disabled={saving} onClick={() => review('flagged')}>
                <Icon name="alert" /> Flag for follow-up
              </button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
