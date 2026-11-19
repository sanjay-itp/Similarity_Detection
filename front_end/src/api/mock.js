// In-browser fake backend, used when VITE_USE_MOCK=true.
// It implements the same functions as the real API in api/index.js and keeps
// its data in localStorage so the whole UI can be demoed without a server.
// Delete this file (and seed.js) once the real backend is ready if you like.

import { buildSeed } from './seed';
import { getToken } from './client';
import { compareTexts } from '../utils/similarity';
import { SEMESTER_COUNT } from '../utils/semesters';

const DB_KEY = 'ic_mock_db_v3';
let memoryDb = null;

function freshSeed() {
  memoryDb = buildSeed();
  // the demo essay assignment starts with a finished report
  buildReport('a1', { name: 'Dr. Anita Sharma' });
  save();
}

function load() {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) memoryDb = JSON.parse(raw);
  } catch {
    memoryDb = null;
  }
  if (!memoryDb) freshSeed();
  return memoryDb;
}

function save() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(memoryDb));
  } catch {
    /* storage full or blocked, keep in memory only */
  }
}

export function resetMockData() {
  freshSeed();
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function newId(prefix) {
  const db = load();
  db.nextId += 1;
  return `${prefix}${db.nextId}`;
}

function publicUser(u) {
  if (!u) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = u;
  return rest;
}

function currentUser() {
  const token = getToken();
  if (!token || !token.startsWith('mock-')) fail('Not signed in', 401);
  const db = load();
  const user = db.users.find((u) => u.id === token.slice(5));
  if (!user || !user.active) fail('Session expired', 401);
  return user;
}

function requireRole(...roles) {
  const user = currentUser();
  if (!roles.includes(user.role)) fail('You do not have permission to do this', 403);
  return user;
}

function log(actor, action) {
  const db = load();
  db.activity.unshift({ id: newId('act'), at: new Date().toISOString(), actor: actor.name, action });
  db.activity = db.activity.slice(0, 50);
}

function userName(id) {
  const u = load().users.find((x) => x.id === id);
  return u ? u.name : 'Unknown';
}

function courseView(c) {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    joinCode: c.joinCode,
    semester: c.semester,
    teacherId: c.teacherId,
    teacherName: userName(c.teacherId),
    studentCount: c.studentIds.length,
  };
}

function visibleCourses(user) {
  const db = load();
  if (user.role === 'admin') return db.courses;
  if (user.role === 'teacher') return db.courses.filter((c) => c.teacherId === user.id);
  return db.courses.filter((c) => c.studentIds.includes(user.id));
}

function assignmentView(a, user) {
  const db = load();
  const course = db.courses.find((c) => c.id === a.courseId);
  const subs = db.submissions.filter((s) => s.assignmentId === a.id);
  const view = {
    ...a,
    courseCode: course?.code,
    courseName: course?.name,
    submissionCount: subs.length,
    studentCount: course?.studentIds.length || 0,
    hasReport: Boolean(db.reports[a.id]),
  };
  if (user.role === 'student') {
    const mine = subs.find((s) => s.studentId === user.id);
    view.mySubmission = mine ? submissionView(mine, user) : null;
  }
  return view;
}

function submissionView(s, user) {
  const db = load();
  const a = db.assignments.find((x) => x.id === s.assignmentId);
  const student = db.users.find((u) => u.id === s.studentId);
  const view = {
    id: s.id,
    assignmentId: s.assignmentId,
    assignmentTitle: a?.title,
    studentId: s.studentId,
    studentName: student?.name,
    studentNumber: student?.studentId,
    fileName: s.fileName,
    fileSize: s.fileSize,
    submittedAt: s.submittedAt,
    late: a ? new Date(s.submittedAt) > new Date(a.dueDate) : false,
    status: s.status,
  };
  if (user.role !== 'student') {
    const report = db.reports[s.assignmentId];
    if (report) {
      const scores = report.pairs
        .filter((p) => p.a.submissionId === s.id || p.b.submissionId === s.id)
        .map((p) => p.score);
      view.maxScore = scores.length ? Math.max(...scores) : 0;
    }
  }
  return view;
}

// ---------------- setup ----------------

export async function getSetupStatus() {
  await delay(100);
  const db = load();
  return { needsSetup: !db.users.some((u) => u.role === 'admin') };
}

export async function createFirstAdmin({ name, email, password }) {
  await delay();
  const db = load();
  if (db.users.some((u) => u.role === 'admin')) fail('An administrator already exists', 409);
  const user = { id: newId('u'), role: 'admin', name, email, password, active: true, createdAt: new Date().toISOString() };
  db.users.push(user);
  log(user, 'Created the administrator account');
  save();
  return { token: `mock-${user.id}`, user: publicUser(user) };
}

// ---------------- auth ----------------

export async function login(email, password) {
  await delay();
  const db = load();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) fail('Incorrect email or password', 401);
  if (!user.active) fail('This account has been deactivated. Contact your administrator.', 403);
  return { token: `mock-${user.id}`, user: publicUser(user) };
}

export async function me() {
  await delay(80);
  return publicUser(currentUser());
}

export async function logout() {
  await delay(50);
  return { ok: true };
}

export async function changePassword(currentPassword, newPassword) {
  await delay();
  const user = currentUser();
  if (user.password !== currentPassword) fail('Current password is incorrect');
  user.password = newPassword;
  save();
  return { ok: true };
}

// ---------------- admin ----------------

export async function getAdminStats() {
  await delay();
  requireRole('admin');
  const db = load();
  return {
    students: db.users.filter((u) => u.role === 'student').length,
    teachers: db.users.filter((u) => u.role === 'teacher').length,
    courses: db.courses.length,
    assignments: db.assignments.length,
    submissions: db.submissions.length,
    checksRun: Object.keys(db.reports).length,
  };
}

export async function listUsers(role) {
  await delay();
  requireRole('admin');
  const db = load();
  return db.users
    .filter((u) => u.role === role)
    .map((u) => {
      const v = publicUser(u);
      if (role === 'teacher') v.courseCount = db.courses.filter((c) => c.teacherId === u.id).length;
      if (role === 'student') v.submissionCount = db.submissions.filter((s) => s.studentId === u.id).length;
      return v;
    });
}

export async function createTeacher({ name, email, department, password }) {
  await delay();
  const admin = requireRole('admin');
  const db = load();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) fail('An account with this email already exists', 409);
  const user = { id: newId('u'), role: 'teacher', name, email, department, password, active: true, createdAt: new Date().toISOString() };
  db.users.push(user);
  log(admin, `Created teacher account for ${name}`);
  save();
  return publicUser(user);
}

function checkSemester(semester) {
  const n = Number(semester);
  if (!Number.isInteger(n) || n < 1 || n > SEMESTER_COUNT) fail(`Choose a semester from 1 to ${SEMESTER_COUNT}`);
  return n;
}

// Put a student in every course of a semester (and take them out of another).
function enrolInSemester(db, studentId, semester) {
  db.courses
    .filter((c) => c.semester === semester && !c.studentIds.includes(studentId))
    .forEach((c) => c.studentIds.push(studentId));
}
function leaveSemester(db, studentId, semester) {
  db.courses
    .filter((c) => c.semester === semester)
    .forEach((c) => {
      c.studentIds = c.studentIds.filter((id) => id !== studentId);
    });
}
function moveStudent(db, user, semester) {
  if (user.semester) leaveSemester(db, user.id, user.semester);
  user.semester = semester;
  enrolInSemester(db, user.id, semester);
}

export async function getSemesters() {
  await delay();
  requireRole('admin');
  const db = load();
  return Array.from({ length: SEMESTER_COUNT }, (_, i) => i + 1).map((n) => ({
    semester: n,
    courses: db.courses.filter((c) => c.semester === n).map((c) => ({ id: c.id, code: c.code, name: c.name })),
    studentCount: db.users.filter((u) => u.role === 'student' && u.semester === n).length,
  }));
}

export async function setStudentSemester(id, semester) {
  await delay();
  const admin = requireRole('admin');
  const n = checkSemester(semester);
  const db = load();
  const user = db.users.find((u) => u.id === id && u.role === 'student');
  if (!user) fail('Student not found', 404);
  moveStudent(db, user, n);
  log(admin, `Moved ${user.name} to semester ${n}`);
  save();
  return publicUser(user);
}

export async function promoteStudents(studentIds) {
  await delay();
  const admin = requireRole('admin');
  const db = load();
  const promoted = [];
  const skipped = [];
  for (const id of studentIds) {
    const user = db.users.find((u) => u.id === id && u.role === 'student');
    if (!user) skipped.push({ id, reason: 'not found' });
    else if (!user.semester) skipped.push({ id, reason: 'no semester set' });
    else if (user.semester >= SEMESTER_COUNT) skipped.push({ id, reason: 'already in the final semester' });
    else {
      moveStudent(db, user, user.semester + 1);
      promoted.push(publicUser(user));
    }
  }
  if (promoted.length) log(admin, `Moved ${promoted.length} student${promoted.length === 1 ? '' : 's'} up a semester`);
  save();
  return { promoted, skipped };
}

export async function createStudent({ name, email, studentId, semester, password }) {
  await delay();
  const admin = requireRole('admin');
  const db = load();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) fail('An account with this email already exists', 409);
  if (db.users.some((u) => u.role === 'student' && u.studentId && u.studentId.toLowerCase() === studentId.toLowerCase()))
    fail('A student with this ID already exists', 409);
  const n = checkSemester(semester);
  const user = { id: newId('u'), role: 'student', name, email, studentId, semester: n, password, active: true, createdAt: new Date().toISOString() };
  db.users.push(user);
  enrolInSemester(db, user.id, n);
  log(admin, `Created student account for ${name}`);
  save();
  return publicUser(user);
}

export async function setUserActive(id, active) {
  await delay();
  const admin = requireRole('admin');
  const user = load().users.find((u) => u.id === id);
  if (!user) fail('User not found', 404);
  if (user.role === 'admin') fail('The administrator account cannot be deactivated');
  user.active = active;
  log(admin, `${active ? 'Activated' : 'Deactivated'} ${user.name}`);
  save();
  return publicUser(user);
}

export async function resetUserPassword(id, password) {
  await delay();
  const admin = requireRole('admin');
  const user = load().users.find((u) => u.id === id);
  if (!user) fail('User not found', 404);
  user.password = password;
  log(admin, `Reset password for ${user.name}`);
  save();
  return { ok: true };
}

export async function deleteUser(id) {
  await delay();
  const admin = requireRole('admin');
  const db = load();
  const user = db.users.find((u) => u.id === id);
  if (!user) fail('User not found', 404);
  if (user.role === 'admin') fail('The administrator account cannot be deleted');
  db.users = db.users.filter((u) => u.id !== id);
  log(admin, `Deleted ${user.role} account ${user.name}`);
  save();
  return { ok: true };
}

export async function getSettings() {
  await delay();
  currentUser();
  return { ...load().settings };
}

export async function updateSettings(data) {
  await delay();
  const admin = requireRole('admin');
  const db = load();
  db.settings = { ...db.settings, ...data };
  log(admin, 'Updated system settings');
  save();
  return { ...db.settings };
}

export async function getActivity() {
  await delay();
  requireRole('admin');
  return load().activity.slice(0, 20);
}

// ---------------- courses ----------------

export async function listCourses() {
  await delay();
  const user = currentUser();
  return visibleCourses(user).map(courseView);
}

export async function createCourse({ code, name, semester }) {
  await delay();
  const teacher = requireRole('teacher');
  const n = checkSemester(semester);
  const db = load();
  const joinCode = `${code.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  // everyone already in that semester is enrolled straight away
  const studentIds = db.users.filter((u) => u.role === 'student' && u.semester === n).map((u) => u.id);
  const course = { id: newId('c'), code, name, semester: n, teacherId: teacher.id, joinCode, studentIds };
  db.courses.push(course);
  save();
  return courseView(course);
}

export async function joinCourse(joinCode) {
  await delay();
  const student = requireRole('student');
  const course = load().courses.find((c) => c.joinCode.toLowerCase() === String(joinCode).trim().toLowerCase());
  if (!course) fail('No course found with that join code', 404);
  if (course.studentIds.includes(student.id)) fail('You are already enrolled in this course', 409);
  course.studentIds.push(student.id);
  save();
  return courseView(course);
}

// ---------------- assignments ----------------

export async function listAssignments() {
  await delay();
  const user = currentUser();
  const courseIds = visibleCourses(user).map((c) => c.id);
  return load()
    .assignments.filter((a) => courseIds.includes(a.courseId))
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    .map((a) => assignmentView(a, user));
}

export async function getAssignment(id) {
  await delay();
  const user = currentUser();
  const a = load().assignments.find((x) => x.id === id);
  if (!a) fail('Assignment not found', 404);
  return assignmentView(a, user);
}

export async function createAssignment(data) {
  await delay();
  const teacher = requireRole('teacher');
  const db = load();
  const course = db.courses.find((c) => c.id === data.courseId && c.teacherId === teacher.id);
  if (!course) fail('Choose one of your courses');
  const a = {
    id: newId('a'),
    courseId: data.courseId,
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
    allowedFileTypes: data.allowedFileTypes,
    createdAt: new Date().toISOString(),
  };
  db.assignments.push(a);
  save();
  return assignmentView(a, teacher);
}

export async function updateAssignment(id, data) {
  await delay();
  const teacher = requireRole('teacher');
  const a = load().assignments.find((x) => x.id === id);
  if (!a) fail('Assignment not found', 404);
  Object.assign(a, data);
  save();
  return assignmentView(a, teacher);
}

export async function deleteAssignment(id) {
  await delay();
  requireRole('teacher');
  const db = load();
  db.assignments = db.assignments.filter((a) => a.id !== id);
  db.submissions = db.submissions.filter((s) => s.assignmentId !== id);
  delete db.reports[id];
  save();
  return { ok: true };
}

// ---------------- submissions ----------------

function readFileText(file) {
  return new Promise((resolve) => {
    if (!/\.(txt|md|c|cpp|java|py|js)$/i.test(file.name)) {
      resolve(
        `[${file.name}] Text extraction from this file type is done by the backend. ` +
          'In demo mode only .txt files are compared by their real content.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

export async function submitAssignment(assignmentId, file) {
  const student = requireRole('student');
  const db = load();
  const a = db.assignments.find((x) => x.id === assignmentId);
  if (!a) fail('Assignment not found', 404);
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!a.allowedFileTypes.includes(ext)) fail(`File type ${ext} is not allowed for this assignment`);
  if (file.size > db.settings.maxFileSizeMb * 1024 * 1024) fail(`File is larger than ${db.settings.maxFileSizeMb} MB`);
  const text = await readFileText(file);
  await delay(600);
  const existing = db.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === student.id);
  const record = {
    id: existing ? existing.id : newId('sub'),
    assignmentId,
    studentId: student.id,
    fileName: file.name,
    fileSize: file.size,
    submittedAt: new Date().toISOString(),
    text,
    status: 'submitted',
  };
  if (existing) Object.assign(existing, record);
  else db.submissions.push(record);
  save();
  return submissionView(record, student);
}

export async function listSubmissions(assignmentId) {
  await delay();
  const user = requireRole('teacher', 'admin');
  return load()
    .submissions.filter((s) => s.assignmentId === assignmentId)
    .map((s) => submissionView(s, user));
}

export async function mySubmissions() {
  await delay();
  const student = requireRole('student');
  return load()
    .submissions.filter((s) => s.studentId === student.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .map((s) => submissionView(s, student));
}

// ---------------- similarity ----------------

function buildReport(assignmentId, actor) {
  const db = load();
  const subs = db.submissions.filter((s) => s.assignmentId === assignmentId);
  const old = db.reports[assignmentId];
  const pairs = [];
  for (let i = 0; i < subs.length; i += 1) {
    for (let j = i + 1; j < subs.length; j += 1) {
      const { score } = compareTexts(subs[i].text, subs[j].text, db.settings.ngramSize);
      const id = `${subs[i].id}__${subs[j].id}`;
      const prev = old?.pairs.find((p) => p.id === id);
      pairs.push({
        id,
        a: { submissionId: subs[i].id, studentName: userName(subs[i].studentId) },
        b: { submissionId: subs[j].id, studentName: userName(subs[j].studentId) },
        score,
        review: prev ? prev.review : { status: 'pending', note: '' },
      });
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  subs.forEach((s) => {
    s.status = 'checked';
  });
  const report = {
    assignmentId,
    status: 'completed',
    generatedAt: new Date().toISOString(),
    generatedBy: actor.name,
    threshold: db.settings.similarityThreshold,
    pairs,
  };
  db.reports[assignmentId] = report;
  return report;
}

function reportView(report) {
  const db = load();
  const a = db.assignments.find((x) => x.id === report.assignmentId);
  const scores = report.pairs.map((p) => p.score);
  const threshold = db.settings.similarityThreshold;
  return {
    ...report,
    threshold,
    assignmentTitle: a?.title,
    courseCode: db.courses.find((c) => c.id === a?.courseId)?.code,
    stats: {
      submissions: db.submissions.filter((s) => s.assignmentId === report.assignmentId).length,
      pairs: report.pairs.length,
      flagged: report.pairs.filter((p) => p.score >= threshold).length,
      average: scores.length ? Math.round(scores.reduce((t, x) => t + x, 0) / scores.length) : 0,
      max: scores.length ? Math.max(...scores) : 0,
    },
  };
}

export async function runCheck(assignmentId) {
  const teacher = requireRole('teacher');
  await delay(1400);
  const db = load();
  const a = db.assignments.find((x) => x.id === assignmentId);
  if (!a) fail('Assignment not found', 404);
  if (db.submissions.filter((s) => s.assignmentId === assignmentId).length < 2) {
    fail('At least two submissions are needed to run a similarity check');
  }
  const report = buildReport(assignmentId, teacher);
  log(teacher, `Ran similarity check on "${a.title}"`);
  save();
  return reportView(report);
}

export async function getReport(assignmentId) {
  await delay();
  requireRole('teacher', 'admin');
  const db = load();
  const report = db.reports[assignmentId];
  if (!report) return null;
  return reportView(report);
}

export async function listReports() {
  await delay();
  const user = requireRole('teacher', 'admin');
  const db = load();
  const courseIds = visibleCourses(user).map((c) => c.id);
  return Object.values(db.reports)
    .filter((r) => {
      const a = db.assignments.find((x) => x.id === r.assignmentId);
      return a && courseIds.includes(a.courseId);
    })
    .map((r) => {
      const v = reportView(r);
      return {
        assignmentId: v.assignmentId,
        assignmentTitle: v.assignmentTitle,
        courseCode: v.courseCode,
        generatedAt: v.generatedAt,
        ...v.stats,
      };
    })
    .sort((x, y) => new Date(y.generatedAt) - new Date(x.generatedAt));
}

export async function getPair(pairId) {
  await delay();
  requireRole('teacher', 'admin');
  const db = load();
  const [idA, idB] = pairId.split('__');
  const sa = db.submissions.find((s) => s.id === idA);
  const sb = db.submissions.find((s) => s.id === idB);
  if (!sa || !sb) fail('Comparison not found', 404);
  const report = db.reports[sa.assignmentId];
  const pair = report?.pairs.find((p) => p.id === pairId);
  const { score, matches } = compareTexts(sa.text, sb.text, db.settings.ngramSize);
  const a = db.assignments.find((x) => x.id === sa.assignmentId);
  return {
    id: pairId,
    assignmentId: sa.assignmentId,
    assignmentTitle: a?.title,
    score: pair ? pair.score : score,
    threshold: db.settings.similarityThreshold,
    review: pair ? pair.review : { status: 'pending', note: '' },
    a: { submissionId: sa.id, studentName: userName(sa.studentId), fileName: sa.fileName, submittedAt: sa.submittedAt, text: sa.text },
    b: { submissionId: sb.id, studentName: userName(sb.studentId), fileName: sb.fileName, submittedAt: sb.submittedAt, text: sb.text },
    matches,
  };
}

export async function setPairReview(pairId, review) {
  await delay();
  const teacher = requireRole('teacher');
  const db = load();
  const report = Object.values(db.reports).find((r) => r.pairs.some((p) => p.id === pairId));
  const pair = report?.pairs.find((p) => p.id === pairId);
  if (!pair) fail('Comparison not found', 404);
  pair.review = { status: review.status, note: review.note || '', reviewedBy: teacher.name, reviewedAt: new Date().toISOString() };
  save();
  return pair.review;
}
