import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext';
import Layout from '/components/Layout';
import { Spinner } from '/components/ui';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Setup from './pages/auth/Setup';
import Account from './pages/shared/Account';
import NotFound from './pages/shared/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageStudents from './pages/admin/ManageStudents';
import SystemSettings from './pages/admin/SystemSettings';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import AssignmentSubmissions from './pages/teacher/AssignmentSubmissions';
import SimilarityReport from './pages/teacher/SimilarityReport';
import ComparisonView from './pages/teacher/ComparisonView';
import ReportsList from './pages/teacher/ReportsList';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssignments from './pages/student/StudentAssignments';
import SubmitAssignment from './pages/student/SubmitAssignment';
import MySubmissions from './pages/student/MySubmissions';
import StudentCourses from './pages/student/StudentCourses';

// Only lets a signed-in user with one of the given roles through.
function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session…" />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/setup" element={<GuestOnly><Setup /></GuestOnly>} />

      <Route element={<RequireRole><Layout /></RequireRole>}>
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="/admin" element={<RequireRole roles={['admin']}><Layout /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="teachers" element={<ManageTeachers />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      <Route path="/teacher" element={<RequireRole roles={['teacher']}><Layout /></RequireRole>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="assignments/:id" element={<AssignmentSubmissions />} />
        <Route path="assignments/:id/report" element={<SimilarityReport />} />
        <Route path="compare/:pairId" element={<ComparisonView />} />
        <Route path="reports" element={<ReportsList />} />
      </Route>

      <Route path="/student" element={<RequireRole roles={['student']}><Layout /></RequireRole>}>
        <Route index element={<StudentDashboard />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:id" element={<SubmitAssignment />} />
        <Route path="submissions" element={<MySubmissions />} />
        <Route path="courses" element={<StudentCourses />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
