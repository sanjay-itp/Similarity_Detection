# IntegrityCheck frontend

React frontend for the locally hosted similarity detection system.
Built with React 18, React Router and plain CSS (no UI library), bundled with Vite.

## Run it

Requires Node.js 18 or newer.

```bash
cd front_end
npm install
cp .env.example .env     # first time only
npm run dev
```

Open http://localhost:5173. Other computers on the same network can use
`http://<this-computer's-IP>:5173`.

### Demo mode vs real backend

`.env` controls where data comes from:

| `VITE_USE_MOCK` | What happens |
|---|---|
| `true` | Built-in demo data stored in the browser. No backend needed. Demo logins are shown on the sign in page. |
| `false` | All calls go to `/api` on the backend at `VITE_BACKEND_URL`. |

Demo accounts (mock mode only):

| Role | Email | Password |
|---|---|---|
| Admin | admin@integritycheck.local | admin123 |
| Teacher | teacher@integritycheck.local | teacher123 |
| Student | student@integritycheck.local | student123 |

Restart `npm run dev` after editing `.env`. To reset the demo data, go to My Account and click "Reset demo data".

### Production build

```bash
npm run build
```

This creates `dist/`. The backend can serve those static files directly, with `/api` on the same server.
Any path that is not a file or `/api` must return `dist/index.html` so React Router can handle it.

## Roles

- **Administrator**: installs and runs the system. On a fresh install with no admin, the app opens a one time setup page to create the admin account. Creates every teacher and student account (nobody signs up on their own) and picks each student's semester (1 to 8). Moves students up a semester when they pass, which swaps their courses for the next semester's. Sets system wide rules (similarity threshold, file types, upload size).
- **Teacher**: creates courses for a semester (students in that semester are enrolled automatically; each course also gets a join code), publishes assignments, sees submissions, runs similarity checks, reads ranked reports and a similarity matrix, compares two submissions side by side with matched text highlighted, and marks pairs as flagged or cleared.
- **Student**: signs in with the account the administrator created and is enrolled in every course of their semester (a join code adds a course from another semester), uploads assignments (drag and drop, file type and size checked) and tracks status. Students never see similarity scores.

## Folder layout

```
src/
  api/
    index.js      every backend call (the one file to match the backend against)
    client.js     fetch wrapper, token storage, error handling
    mock.js       fake backend for demo mode
    seed.js       demo data
  context/        signed in user state
  components/     layout, sidebar, icons, modal, badges, toasts
  pages/
    auth/         sign in, student registration, first run admin setup
    admin/        dashboard, teachers, students, settings
    teacher/      dashboard, courses, assignments, submissions, report, comparison
    student/      dashboard, assignments, submit, my submissions, courses
    shared/       account page, 404
  styles/
    theme.css     all colours, fonts, radii and shadows (change the look here)
    app.css       layout and component styles
  utils/          date and size formatting, demo similarity algorithm
```

## For the backend team

Read [API_CONTRACT.md](./API_CONTRACT.md). It lists every endpoint, request body and response shape the frontend uses.
    