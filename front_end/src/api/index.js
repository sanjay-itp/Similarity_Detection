// Every call the frontend makes to the backend lives in this file.
// The exact request and response shapes are documented in API_CONTRACT.md.
//
// When VITE_USE_MOCK=true the same functions are answered by mock.js, which
// keeps demo data in the browser so the UI can be used without a backend.

import { request, setToken } from './client';
import * as mock from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const isMock = USE_MOCK;

const real = {
  // ---------- setup (first run, admin) ----------
  getSetupStatus: () => request('/setup/status'),
  createFirstAdmin: (data) => request('/setup/admin', { method: 'POST', body: data }),

  // ---------- auth ----------
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  // ---------- admin ----------
  getAdminStats: () => request('/admin/stats'),
  listUsers: (role) => request(`/admin/users?role=${encodeURIComponent(role)}`),
  createTeacher: (data) => request('/admin/teachers', { method: 'POST', body: data }),
  createStudent: (data) => request('/admin/students', { method: 'POST', body: data }),
  getSemesters: () => request('/admin/semesters'),
  setStudentSemester: (id, semester) => request(`/admin/users/${id}`, { method: 'PATCH', body: { semester } }),
  promoteStudents: (studentIds) => request('/admin/students/promote', { method: 'POST', body: { studentIds } }),
  setUserActive: (id, active) => request(`/admin/users/${id}`, { method: 'PATCH', body: { active } }),
  resetUserPassword: (id, password) =>
    request(`/admin/users/${id}/reset-password`, { method: 'POST', body: { password } }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: data }),
  getActivity: () => request('/admin/activity'),

  // ---------- courses ----------
  listCourses: () => request('/courses'),
  createCourse: (data) => request('/courses', { method: 'POST', body: data }),
  joinCourse: (joinCode) => request('/courses/join', { method: 'POST', body: { joinCode } }),

  // ---------- assignments ----------
  listAssignments: () => request('/assignments'),
  getAssignment: (id) => request(`/assignments/${id}`),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: data }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: data }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // ---------- submissions ----------
  submitAssignment: (assignmentId, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/assignments/${assignmentId}/submissions`, { method: 'POST', form });
  },
  listSubmissions: (assignmentId) => request(`/assignments/${assignmentId}/submissions`),
  mySubmissions: () => request('/submissions/mine'),

  // ---------- similarity ----------
  runCheck: (assignmentId) => request(`/assignments/${assignmentId}/check`, { method: 'POST' }),
  getReport: (assignmentId) => request(`/assignments/${assignmentId}/report`),
  getPair: (pairId) => request(`/reports/pairs/${pairId}`),
  setPairReview: (pairId, review) =>
    request(`/reports/pairs/${pairId}`, { method: 'PATCH', body: review }),
  listReports: () => request('/reports'),
};

const impl = USE_MOCK ? mock : real;

// Wrap login style calls so the token is stored no matter which backend answered.
async function withToken(promise) {
  const res = await promise;
  if (res && res.token) setToken(res.token);
  return res;
}

export const api = {
  ...impl,
  login: (email, password) => withToken(impl.login(email, password)),
  createFirstAdmin: (data) => withToken(impl.createFirstAdmin(data)),
  logout: async () => {
    try {
      await impl.logout();
    } finally {
      setToken(null);
    }
  },
};
