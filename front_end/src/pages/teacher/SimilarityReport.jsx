import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { formatDate, riskLevel } from '../../utils/format';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, ScoreBadge, ScoreBar, Spinner, StatCard } from '/components/ui';
import Icon from '/components/Icon';

const REVIEW = {
  pending: { tone: 'neutral', label: 'Not reviewed' },
  flagged: { tone: 'red', label: 'Flagged' },
  cleared: { tone: 'green', label: 'Cleared' },
};

function Matrix({ report }) {
  const names = [];
  report.pairs.forEach((p) => {
    if (!names.includes(p.a.studentName)) names.push(p.a.studentName);
    if (!names.includes(p.b.studentName)) names.push(p.b.studentName);
  });
  const lookup = {};
  report.pairs.forEach((p) => {
    lookup[`${p.a.studentName}|${p.b.studentName}`] = p;
    lookup[`${p.b.studentName}|${p.a.studentName}`] = p;
  });
  const short = (n) => n.split(' ')[0];

  return (
    <div className="matrix-wrap">
      <table className="matrix">
        <thead>
          <tr>
            <th />
            {names.map((n) => (
              <th key={n} title={n}>
                {short(n)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((row) => (
            <tr key={row}>
              <th title={row}>{short(row)}</th>
              {names.map((col) => {
                if (row === col) return <td key={col} className="matrix-self" />;
                const p = lookup[`${row}|${col}`];
                const level = p ? riskLevel(p.score, report.threshold) : 'low';
                return (
                  <td key={col} className={`matrix-cell heat-${level}`} style={{ '--heat': (p?.score || 0) / 100 }}>
                    {p ? (
                      <Link to={`/teacher/compare/${p.id}`} title={`${row} vs ${col}: ${p.score}%`}>
                        {p.score}
                      </Link>
                    ) : (
                      '–'
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SimilarityReport() {
  const { id } = useParams();
  const report = useAsync(() => api.getReport(id), [id]);
  const [view, setView] = useState('pairs');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    if (!report.data) return [];
    const q = query.trim().toLowerCase();
    return report.data.pairs.filter(
      (p) =>
        (!onlyFlagged || p.score >= report.data.threshold) &&
        (!q || p.a.studentName.toLowerCase().includes(q) || p.b.studentName.toLowerCase().includes(q))
    );
  }, [report.data, onlyFlagged, query]);

  if (report.loading) return <Spinner />;
  if (report.error) return <ErrorBox error={report.error} onRetry={report.reload} />;
  if (!report.data) {
    return (
      <Card>
        <EmptyState
          icon="report"
          title="No report yet"
          action={
            <Link className="btn btn-primary" to={`/teacher/assignments/${id}`}>
              Go to submissions
            </Link>
          }
        >
          Run a similarity check on this assignment first.
        </EmptyState>
      </Card>
    );
  }

  const r = report.data;

  return (
    <>
      <PageHeader
        back={
          <Link to={`/teacher/assignments/${id}`} className="back">
            <Icon name="arrowLeft" size={16} /> Submissions
          </Link>
        }
        title="Similarity report"
        subtitle={`${r.assignmentTitle} · ${r.courseCode} · generated ${formatDate(r.generatedAt, true)}`}
      />

      <div className="stats">
        <StatCard label="Submissions compared" value={r.stats.submissions} icon="file" />
        <StatCard label="Pairs analysed" value={r.stats.pairs} icon="users" tone="violet" />
        <StatCard label={`Flagged (≥ ${r.threshold}%)`} value={r.stats.flagged} icon="alert" tone="red" />
        <StatCard label="Highest similarity" value={`${r.stats.max}%`} icon="report" tone="amber" hint={`Average ${r.stats.average}%`} />
      </div>

      <Card padded={false}>
        <div className="tabs tabs-between">
          <div className="tabs-inner">
            <button className={`tab ${view === 'pairs' ? 'tab-on' : ''}`} onClick={() => setView('pairs')}>
              Ranked pairs
            </button>
            <button className={`tab ${view === 'matrix' ? 'tab-on' : ''}`} onClick={() => setView('matrix')}>
              Matrix
            </button>
          </div>
          {view === 'pairs' && (
            <div className="tab-tools">
              <div className="search search-sm">
                <Icon name="search" />
                <input placeholder="Filter by student" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <label className="check">
                <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
                Flagged only
              </label>
            </div>
          )}
        </div>

        {view === 'matrix' ? (
          <div className="card-body">
            <p className="muted small">Each cell is the similarity between two students. Click a number to compare.</p>
            <Matrix report={r} />
            <div className="legend">
              <span>
                <i className="heat-low" /> Low
              </span>
              <span>
                <i className="heat-medium" /> Moderate
              </span>
              <span>
                <i className="heat-high" /> Above threshold
              </span>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon="check" title="No pairs match the filter" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student A</th>
                  <th>Student B</th>
                  <th style={{ width: '28%' }}>Similarity</th>
                  <th>Review</th>
                  <th className="right" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className={p.score >= r.threshold ? 'row-flag' : ''}>
                    <td className="muted">{i + 1}</td>
                    <td className="strong">{p.a.studentName}</td>
                    <td className="strong">{p.b.studentName}</td>
                    <td>
                      <div className="score-cell">
                        <ScoreBar score={p.score} threshold={r.threshold} />
                        <ScoreBadge score={p.score} threshold={r.threshold} />
                      </div>
                    </td>
                    <td>
                      <Badge tone={REVIEW[p.review?.status || 'pending'].tone}>{REVIEW[p.review?.status || 'pending'].label}</Badge>
                    </td>
                    <td className="right">
                      <Link to={`/teacher/compare/${p.id}`} className="btn btn-sm btn-ghost">
                        Compare <Icon name="arrowRight" size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="muted small mt-sm">
        A high score shows overlapping text, not proof of copying. Read the highlighted passages before deciding.
      </p>
    </>
  );
}
