import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student
import StudentLayout       from './components/Layout/StudentLayout';
import StudentDashboard    from './pages/student/Dashboard';
import StudentCourses      from './pages/student/Courses';
import StudentCourseDetail from './pages/student/CourseDetail';
import StudentLesson       from './pages/student/LessonPage';
import StudentQuiz         from './pages/student/QuizPage';
import StudentCertificates from './pages/student/Certificates';
import StudentAssignments  from './pages/student/Assignments';
import StudentExams        from './pages/student/Exams';
import StudentProfile      from './pages/student/Profile';

// Teacher
import TeacherLayout        from './components/Layout/TeacherLayout';
import TeacherDashboard     from './pages/teacher/Dashboard';
import TeacherCourses       from './pages/teacher/MyCourses';
import TeacherClassroom     from './pages/teacher/Classroom';
import TeacherCourseEditor  from './pages/teacher/CourseEditor';
import TeacherStudentProgress from './pages/teacher/StudentProgress';
import TeacherQuizReview       from './pages/teacher/QuizReview';
import TeacherProfile       from './pages/teacher/Profile';

// Admin
import AdminLayout    from './components/Layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import AdminCourses   from './pages/admin/Courses';
import AdminMedia       from './pages/admin/MediaManager';
import AdminClasses     from './pages/admin/Classes';
import AdminLandingEditor from './pages/admin/LandingEditor';
import AdminFAQ           from './pages/admin/FAQManager';

// Landing
import LandingPage from './pages/LandingPage';

// Protected route
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'admin')   return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return children;
};

const RedirectByRole = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={user ? <RedirectByRole /> : <LoginPage />} />
      <Route path="/register" element={user ? <RedirectByRole /> : <RegisterPage />} />
      <Route path="/dashboard" element={<Protected><RedirectByRole /></Protected>} />

      {/* ── Student ─────────────────────────────────────────── */}
      <Route path="/student" element={<Protected roles={['student']}><StudentLayout /></Protected>}>
        <Route path="dashboard"   element={<StudentDashboard />} />
        <Route path="courses"     element={<StudentCourses />} />
        <Route path="courses/:id" element={<StudentCourseDetail />} />
        <Route path="courses/:courseId/lessons/:lessonId" element={<StudentLesson />} />
        <Route path="courses/:courseId/quiz/:quizId"      element={<StudentQuiz />} />
        <Route path="certificates"  element={<StudentCertificates />} />
        <Route path="assignments"   element={<StudentAssignments />} />
        <Route path="exams"          element={<StudentExams />} />
        <Route path="profile"       element={<StudentProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Teacher ─────────────────────────────────────────── */}
      <Route path="/teacher" element={<Protected roles={['teacher', 'admin']}><TeacherLayout /></Protected>}>
        <Route path="dashboard"         element={<TeacherDashboard />} />
        <Route path="courses"           element={<TeacherCourses />} />
        <Route path="courses/new"       element={<TeacherCourseEditor />} />
        <Route path="courses/:id"       element={<TeacherClassroom />} />
        <Route path="courses/:id/edit"  element={<TeacherCourseEditor />} />
        <Route path="courses/:id/progress"  element={<TeacherStudentProgress />} />
        <Route path="courses/:id/quiz-review" element={<TeacherQuizReview />} />
        <Route path="profile"              element={<TeacherProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Admin ───────────────────────────────────────────── */}
      <Route path="/admin" element={<Protected roles={['admin']}><AdminLayout /></Protected>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="courses"   element={<AdminCourses />} />
        <Route path="media"         element={<AdminMedia />} />
        <Route path="classes"       element={<AdminClasses />} />
        <Route path="landing-editor" element={<AdminLandingEditor />} />
        <Route path="faq"            element={<AdminFAQ />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#c8a84b', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
