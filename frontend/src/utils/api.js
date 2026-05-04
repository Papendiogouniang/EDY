import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('dunis_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register         = d  => API.post('/auth/register', d);
export const login            = d  => API.post('/auth/login', d);
export const getMe            = () => API.get('/auth/me');
export const updateProfile    = d  => API.put('/auth/update-profile', d);
export const changePassword   = d  => API.put('/auth/change-password', d);

// Courses
export const getCourses       = p  => API.get('/api/courses', { params: p });
export const getMyCourses     = () => API.get('/api/courses/my');
export const getEnrolledCourses = () => API.get('/api/courses/enrolled');
export const getCourse        = id => API.get(`/api/courses/${id}`);
export const createCourse     = d  => API.post('/api/courses', d);
export const updateCourse     = (id,d) => API.put(`/api/courses/${id}`, d);
export const deleteCourse     = id => API.delete(`/api/courses/${id}`);
export const addLesson        = (id,d) => API.post(`/api/courses/${id}/lessons`, d);
export const updateLesson     = (cId,lId,d) => API.put(`/api/courses/${cId}/lessons/${lId}`, d);
export const deleteLesson     = (cId,lId) => API.delete(`/api/courses/${cId}/lessons/${lId}`);
export const scheduleMeet     = (id,d) => API.post(`/api/courses/${id}/meets`, d);
export const getCourseStudents= id => API.get(`/api/courses/${id}/students`);

// Enrollments
export const enrollStudent    = (courseId) => API.post(`/api/courses/${courseId}/enroll`);
export const checkEnrollment  = (id) => API.get(`/api/courses/${id}/enrollment-check`);

// Progress
export const markComplete     = d  => API.post('/api/progress', d);
export const getCourseProgress= id => API.get(`/api/progress/${id}`);

// Assignments
export const submitAssignment = d  => API.post('/api/assignments/submit', d);
export const getCourseAssignments = id => API.get(`/api/assignments/course/${id}`);
export const getMyAssignments = id => API.get(`/api/assignments/my/${id}`);
export const gradeAssignment  = (id,d) => API.put(`/api/assignments/${id}/grade`, d);

// Quizzes
export const getCourseQuizzes = id => API.get(`/api/quizzes/course/${id}`);
export const getQuiz          = id => API.get(`/api/quizzes/${id}`);
export const createQuiz       = d  => API.post('/api/quizzes', d);
export const updateQuiz       = (id,d) => API.put(`/api/quizzes/${id}`, d);
export const submitQuiz       = (id,d) => API.post(`/api/quizzes/${id}/submit`, d);
export const getMyAttempts    = id => API.get(`/api/quizzes/${id}/attempts`);
export const getAllAttempts    = id => API.get(`/api/quizzes/${id}/all-attempts`);

// Certificates
export const getMyCertificates= () => API.get('/api/certificates/my');
export const getCertificate   = id => API.get(`/api/certificates/${id}`);
export const generateCertificate = certId => `${API.defaults.baseURL}/certificates/generate/${certId}`;

// Notifications
export const getNotifications = () => API.get('/api/notifications');
export const markNotificationsRead = () => API.put('/api/notifications/read-all');

// Dashboard
export const getStudentDashboard = () => API.get('/api/dashboard/student');
export const getTeacherDashboard = () => API.get('/api/dashboard/teacher');
export const getAdminDashboard   = () => API.get('/api/dashboard/admin');

// Users (admin)
export const getUsers         = p  => API.get('/api/users', { params: p });
export const updateUserRole   = (id,d) => API.put(`/api/users/${id}/role`, d);
export const toggleUserActive = id => API.put(`/api/users/${id}/toggle-active`);
export const deleteUser       = id => API.delete(`/api/users/${id}`);
export const getTeachers      = () => API.get('/api/users/teachers/list');

// Chatbot
export const sendChatMessage  = d  => API.post('/api/chatbot/message', d);
export const explainConcept   = d  => API.post('/api/chatbot/explain', d);

export default API;

// Media (admin)
export const uploadImage   = (fd) => API.post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const listImages    = ()   => API.get('/api/media/images');
export const deleteImage   = (fn) => API.delete(`/api/media/${fn}`);

// Site Settings & Admin Class Management
export const getSiteSettings   = ()     => API.get('/api/site');
export const updateSiteSettings = (d)   => API.put('/api/site', d);
export const getAdminClasses    = ()    => API.get('/api/site/admin/classes');
export const getClassStudents   = (id)  => API.get(`/api/site/admin/classes/${id}/students`);
export const adminEnroll        = (d)   => API.post('/api/site/admin/enroll', d);
export const adminUnenroll      = (d)   => API.delete('/api/site/admin/enroll', { data: d });
export const assignTeacher      = (id, teacherId) => API.put(`/api/site/admin/courses/${id}/teacher`, { teacherId });

// FAQ / Chatbot KB (admin)
export const getFAQ    = ()  => API.get('/api/site');
export const updateFAQ = (d) => API.put('/api/site', d);

// Meet attendance & recording
export const saveAttendance  = (courseId, meetId, d) => API.post(`/api/courses/${courseId}/meets/${meetId}/attendance`, d);
export const saveMeetRecording = (courseId, meetId, url) => API.put(`/api/courses/${courseId}/meets/${meetId}/recording`, { recordingUrl: url });

export const createUser = (d) => API.post('/api/users', d);
