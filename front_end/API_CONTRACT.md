# Backend API contract

This is what the frontend expects from the backend. Every call is in
`src/api/index.js`. If you change a URL or a field name, change it there too.

## General rules

- Base path: `/api`. In development the Vite server forwards `/api/*` to `VITE_BACKEND_URL` (default `http://localhost:8000`).
- Requests and responses are JSON, except file upload (multipart).
- Auth: login and setup return `{ token, user }`. The frontend sends `Authorization: Bearer <token>` on every later request.
- Errors: send a non-2xx status with `{ "message": "Human readable text" }`. The frontend shows `message` to the user.
- `401` logs the user out. `403` means "not allowed for this role".
- Dates are ISO 8601 strings (`2026-11-13T09:30:00Z`). IDs can be strings or numbers.
- The backend must check roles itself. Hiding pages in the frontend is not security.

## Objects

```jsonc
// User (never include the password)
{ "id": "u1", "role": "admin|teacher|student", "name": "Sita Thapa", "email": "sita@college.edu",
  "active": true, "createdAt": "...",
  "studentId": "CS-2023-014",   // students only
  "department": "Computer Science" } // teachers only

// Course
{ "id": "c1", "code": "CS301", "name": "Software Engineering", "joinCode": "SE-4821",
  "teacherId": "u2", "teacherName": "Dr. Anita Sharma", "studentCount": 5 }

// Assignment
{ "id": "a1", "courseId": "c1", "courseCode": "CS301", "courseName": "Software Engineering",
  "title": "...", "description": "...", "dueDate": "...", "allowedFileTypes": [".pdf", ".docx"],
  "submissionCount": 5, "studentCount": 5, "hasReport": true, "createdAt": "...",
  "mySubmission": Submission | null }   // only when a student asks

// Submission
{ "id": "sub1", "assignmentId": "a1", "assignmentTitle": "...", "studentId": "u10",
  "studentName": "Sita Thapa", "studentNumber": "CS-2023-014", "fileName": "essay.pdf",
  "fileSize": 24576, "submittedAt": "...", "late": false, "status": "submitted|checked",
  "maxScore": 72 }   // teachers only, highest similarity with any other submission

// Settings
{ "institutionName": "...", "similarityThreshold": 40, "allowedFileTypes": [".pdf", ".docx", ".txt"],
  "maxFileSizeMb": 10, "ngramSize": 5 }
```

## Endpoints

### First run setup

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| GET | `/setup/status` | anyone | | `{ needsSetup: boolean }` (true when no admin exists) |
| POST | `/setup/admin` | anyone, only while `needsSetup` | `{ name, email, password }` | `{ token, user }` |

If you would rather create the admin from a command line script during installation, keep
`/setup/status` returning `{ needsSetup: false }` and the setup page is never shown.

### Auth

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | anyone | `{ email, password }` | `{ token, user }` (403 if deactivated) |
| GET | `/auth/me` | signed in | | `User` |
| POST | `/auth/logout` | signed in | | `{ ok: true }` |
| POST | `/auth/change-password` | signed in | `{ currentPassword, newPassword }` | `{ ok: true }` |

### Admin

There is no self sign-up. Every student, teacher and admin account is created here by an administrator.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/admin/stats` | | `{ students, teachers, courses, assignments, submissions, checksRun }` |
| GET | `/admin/users?role=teacher\|student` | | `User[]` plus `courseCount` (teachers) or `submissionCount` (students) |
| POST | `/admin/teachers` | `{ name, email, department, password }` | `User`. 409 if the email is taken |
| POST | `/admin/students` | `{ name, email, studentId, password }` | `User`. 409 if the email or student ID is taken |
| PATCH | `/admin/users/:id` | `{ active }` | `User` |
| POST | `/admin/users/:id/reset-password` | `{ password }` | `{ ok: true }` |
| DELETE | `/admin/users/:id` | | `{ ok: true }` |
| GET | `/admin/settings` | | `Settings` (any signed in user may read it) |
| PUT | `/admin/settings` | `Settings` | `Settings` |
| GET | `/admin/activity` | | `[{ id, at, actor, action }]` newest first, about 20 items |

### Courses

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| GET | `/courses` | all | | `Course[]` (teacher: own courses, student: enrolled, admin: all) |
| POST | `/courses` | teacher | `{ code, name }` | `Course` with a generated `joinCode` |
| POST | `/courses/join` | student | `{ joinCode }` | `Course` (404 bad code, 409 already enrolled) |

### Assignments

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| GET | `/assignments` | all | | `Assignment[]` from the user's courses |
| GET | `/assignments/:id` | all | | `Assignment` |
| POST | `/assignments` | teacher | `{ courseId, title, description, dueDate, allowedFileTypes }` | `Assignment` |
| PUT | `/assignments/:id` | teacher | same as POST | `Assignment` |
| DELETE | `/assignments/:id` | teacher | | `{ ok: true }` |

### Submissions

| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| POST | `/assignments/:id/submissions` | student | multipart, field `file` | `Submission`. A second upload replaces the first |
| GET | `/assignments/:id/submissions` | teacher | | `Submission[]` |
| GET | `/submissions/mine` | student | | `Submission[]` |

Reject uploads after `dueDate` only if you want hard deadlines. The UI already blocks it and marks late ones.

### Similarity

| Method | Path | Who | Returns |
|---|---|---|---|
| POST | `/assignments/:id/check` | teacher | `Report` (runs the comparison, can take time) |
| GET | `/assignments/:id/report` | teacher | `Report` or `null` if never run |
| GET | `/reports` | teacher | `[{ assignmentId, assignmentTitle, courseCode, generatedAt, submissions, pairs, flagged, average, max }]` |
| GET | `/reports/pairs/:pairId` | teacher | `Pair detail` |
| PATCH | `/reports/pairs/:pairId` | teacher | body `{ status: "flagged\|cleared\|pending", note }`, returns `{ status, note, reviewedBy, reviewedAt }` |

```jsonc
// Report
{ "assignmentId": "a1", "assignmentTitle": "...", "courseCode": "CS301",
  "status": "completed", "generatedAt": "...", "generatedBy": "Dr. Anita Sharma",
  "threshold": 40,
  "stats": { "submissions": 5, "pairs": 10, "flagged": 1, "average": 8, "max": 72 },
  "pairs": [   // sorted by score, highest first
    { "id": "sub1__sub2",
      "a": { "submissionId": "sub1", "studentName": "Sita Thapa" },
      "b": { "submissionId": "sub2", "studentName": "Bikash Rai" },
      "score": 72,                     // 0 to 100
      "review": { "status": "pending", "note": "" } }
  ] }

// Pair detail (for the side by side view)
{ "id": "sub1__sub2", "assignmentId": "a1", "assignmentTitle": "...", "score": 72, "threshold": 40,
  "review": { "status": "pending", "note": "" },
  "a": { "submissionId": "sub1", "studentName": "...", "fileName": "...", "submittedAt": "...", "text": "extracted plain text" },
  "b": { ... same ... },
  "matches": {
    "a": [[0, 412], [530, 690]],   // [start, end) character offsets into a.text
    "b": [[0, 412], [488, 640]]    // [start, end) character offsets into b.text
  } }
```

The backend extracts plain text from PDF and DOCX files. The frontend only shows the
`text` it gets back and highlights the ranges in `matches`. Ranges must be sorted and must not overlap.

Students never see similarity scores. Do not include `maxScore` or report data in student responses.
