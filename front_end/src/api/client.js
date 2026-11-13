// Low level HTTP helper used by api/index.js when talking to the real backend.
// The JWT (or session token) returned by /api/auth/login is stored in
// localStorage and sent as "Authorization: Bearer <token>" on every request.

const TOKEN_KEY = 'ic_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable, ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // FormData, the browser sets the multipart header itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = (data && (data.message || data.error || data.detail)) || `Request failed (${res.status})`;
    // The dev proxy answers 500/502/504 with an empty body when the backend is not running.
    if (!text && res.status >= 500) message = 'The server is not responding. Is the backend running?';
    if (res.status === 401) setToken(null);
    throw new ApiError(message, res.status, data);
  }
  return data;
}
