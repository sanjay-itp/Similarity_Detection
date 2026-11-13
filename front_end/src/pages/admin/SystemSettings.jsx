import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Card, ErrorBox, Field, PageHeader, Spinner, Toggle } from '../../components/ui';
import { useToast } from '../../components/Toast';

const FILE_TYPES = ['.pdf', '.docx', '.txt', '.doc', '.odt', '.py', '.java', '.c', '.cpp', '.js'];

export default function SystemSettings() {
  const notify = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getSettings().then(setForm).catch(setError);
  }, []);

  if (error) return <ErrorBox error={error} />;
  if (!form) return <Spinner />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleType = (t) =>
    set('allowedFileTypes', form.allowedFileTypes.includes(t) ? form.allowedFileTypes.filter((x) => x !== t) : [...form.allowedFileTypes, t]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.allowedFileTypes.length) return notify('Allow at least one file type', 'error');
    setBusy(true);
    try {
      setForm(await api.updateSettings(form));
      notify('Settings saved');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader
        title="System settings"
        subtitle="These apply to every course and assignment."
        actions={
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        }
      />
      <div className="grid-2">
        <Card title="Institution">
          <div className="form">
            <Field label="Institution name">
              <input value={form.institutionName || ''} onChange={(e) => set('institutionName', e.target.value)} />
            </Field>
            <Toggle
              checked={form.allowStudentRegistration}
              onChange={(v) => set('allowStudentRegistration', v)}
              label="Allow students to create their own accounts"
            />
          </div>
        </Card>

        <Card title="Similarity detection">
          <div className="form">
            <Field
              label={`Flag threshold: ${form.similarityThreshold}%`}
              hint="Pairs scoring at or above this value are flagged for teacher review."
            >
              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={form.similarityThreshold}
                onChange={(e) => set('similarityThreshold', Number(e.target.value))}
              />
            </Field>
            <Field label="Word n-gram size" hint="Length of the word sequences compared. Smaller values catch more, with more false positives.">
              <select value={form.ngramSize} onChange={(e) => set('ngramSize', Number(e.target.value))}>
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} words
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Uploads">
          <div className="form">
            <Field label="Maximum file size (MB)">
              <input
                type="number"
                min="1"
                max="200"
                value={form.maxFileSizeMb}
                onChange={(e) => set('maxFileSizeMb', Number(e.target.value))}
              />
            </Field>
            <div className="field">
              <span className="field-label">Allowed file types</span>
              <div className="chips">
                {FILE_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`chip ${form.allowedFileTypes.includes(t) ? 'chip-on' : ''}`}
                    onClick={() => toggleType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
