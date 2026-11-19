import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { SEMESTERS, SEMESTER_COUNT, semesterLabel } from '../../utils/semesters';
import { Card, ErrorBox, Field, Modal, PageHeader, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';
import UserTable from './UserTable';
import NewAccountModal from './NewAccountModal';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function ManageStudents() {
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const students = useAsync(() => api.listUsers('student'), []);
  const [open, setOpen] = useState(params.get('new') === '1');
  const [semester, setSemester] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [moveFor, setMoveFor] = useState(null);
  const [moveTo, setMoveTo] = useState('');
  const [busy, setBusy] = useState(false);

  const all = students.data || [];
  const shown = semester === 'all' ? all : all.filter((s) => s.semester === Number(semester));
  const countIn = (n) => all.filter((s) => s.semester === n).length;

  const picked = all.filter((s) => selected.has(s.id));
  const movable = picked.filter((s) => s.semester && s.semester < SEMESTER_COUNT);
  const finalYear = picked.length - movable.length;
  const fromSems = [...new Set(movable.map((s) => s.semester))];

  const replaceUsers = (updated) => {
    const byId = new Map(updated.map((u) => [u.id, u]));
    students.setData((list) => list.map((u) => (byId.has(u.id) ? { ...u, ...byId.get(u.id) } : u)));
  };

  const closeNew = () => {
    setOpen(false);
    if (params.get('new')) setParams({});
  };

  const changeFilter = (value) => {
    setSemester(value);
    setSelected(new Set());
  };

  const promote = async () => {
    setBusy(true);
    try {
      const res = await api.promoteStudents(movable.map((s) => s.id));
      replaceUsers(res.promoted);
      setSelected(new Set());
      setPromoteOpen(false);
      notify(
        res.skipped.length
          ? `${plural(res.promoted.length, 'student')} moved up. ${res.skipped.length} skipped.`
          : `${plural(res.promoted.length, 'student')} moved up a semester`
      );
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const openMove = (u) => {
    setMoveFor(u);
    setMoveTo(String(u.semester || ''));
  };

  const saveMove = async () => {
    setBusy(true);
    try {
      const u = await api.setStudentSemester(moveFor.id, Number(moveTo));
      replaceUsers([u]);
      notify(`${u.name} is now in ${semesterLabel(u.semester)}`);
      setMoveFor(null);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> New student
          </button>
        }
      />

      <div className="semester-bar">
        <label className="semester-filter">
          <span className="muted small">Semester</span>
          <select value={semester} onChange={(e) => changeFilter(e.target.value)}>
            <option value="all">All ({all.length})</option>
            {SEMESTERS.map((n) => (
              <option key={n} value={n}>
                {semesterLabel(n)} ({countIn(n)})
              </option>
            ))}
          </select>
        </label>
        {selected.size > 0 && (
          <div className="bulk-actions">
            <span className="small">{selected.size} selected</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setPromoteOpen(true)} disabled={movable.length === 0}>
              <Icon name="arrowUp" /> Move to next semester
            </button>
          </div>
        )}
      </div>

      <Card padded>
        <ErrorBox error={students.error} onRetry={students.reload} />
        {students.loading ? (
          <Spinner />
        ) : (
          <UserTable
            users={shown}
            role="student"
            onChange={students.setData}
            selected={selected}
            onSelect={setSelected}
            onChangeSemester={openMove}
          />
        )}
      </Card>

      {open && (
        <NewAccountModal
          role="student"
          onClose={closeNew}
          onCreated={(s) => students.setData((list) => [...(list || []), { ...s, submissionCount: 0 }])}
        />
      )}

      {promoteOpen && (
        <Modal
          title="Move to next semester?"
          onClose={() => setPromoteOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setPromoteOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={promote} disabled={busy || movable.length === 0}>
                {busy ? 'Moving…' : `Move ${plural(movable.length, 'student')}`}
              </button>
            </>
          }
        >
          <div className="stack">
            <p>
              {fromSems.length === 1
                ? `${plural(movable.length, 'student')} ${movable.length === 1 ? 'moves' : 'move'} from ${semesterLabel(fromSems[0])} to ${semesterLabel(fromSems[0] + 1)}.`
                : `${plural(movable.length, 'student')} each move up one semester.`}
            </p>
            <p className="muted">They leave their current courses and join the next semester's. Past submissions are kept.</p>
            {finalYear > 0 && (
              <p className="muted small">
                {plural(finalYear, 'student')} in {semesterLabel(SEMESTER_COUNT)} will stay where they are.
              </p>
            )}
          </div>
        </Modal>
      )}

      {moveFor && (
        <Modal
          title={`Semester for ${moveFor.name}`}
          onClose={() => setMoveFor(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setMoveFor(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveMove}
                disabled={busy || !moveTo || Number(moveTo) === moveFor.semester}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <Field label="Semester" hint="Their courses switch to the new semester's. Past submissions are kept.">
            <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} autoFocus>
              <option value="" disabled>
                Choose a semester
              </option>
              {SEMESTERS.map((n) => (
                <option key={n} value={n}>
                  {semesterLabel(n)}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
// phase 5