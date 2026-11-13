export function formatDate(value, withTime = false) {
  if (!value) return '';
  const d = new Date(value);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString(undefined, opts);
}

export function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function timeLeft(due) {
  const diff = new Date(due) - new Date();
  if (diff <= 0) return 'Closed';
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} left`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  return 'Due soon';
}

export function initials(name = '') {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Returns 'high' | 'medium' | 'low' for colouring similarity scores.
export function riskLevel(score, threshold = 40) {
  if (score >= threshold) return 'high';
  if (score >= threshold / 2) return 'medium';
  return 'low';
}

// Turns a local datetime-input value into ISO and back.
export function toInputDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
