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
export const getCourses       = p  => API.get('/courses', { params: p });
export const getMyCourses     = () => API.get('/courses/my');
export const getEnrolledCourses = () => API.get('/courses/enrolled');
export const getCourse        = id => API.get(`/courses/${id}`);
export const createCourse     = d  => API.post('/courses', d);
export const updateCourse     = (id,d) => API.put(`/courses/${id}`, d);
export const deleteCourse     = id => API.delete(`/courses/${id}`);
export const addLesson        = (id,d) => API.post(`/courses/${id}/lessons`, d);
export const updateLesson     = (cId,lId,d) => API.put(`/courses/${cId}/lessons/${lId}`, d);
export const deleteLesson     = (cId,lId) => API.delete(`/courses/${cId}/lessons/${lId}`);
export const scheduleMeet     = (id,d) => API.post(`/courses/${id}/meets`, d);
export const getCourseStudents= id => API.get(`/courses/${id}/students`);

// Enrollments
export const enrollStudent    = (courseId) => API.post(`/courses/${courseId}/enroll`);
export const checkEnrollment  = (id) => API.get(`/courses/${id}/enrollment-check`);

// Progress
export const markComplete     = d  => API.post('/progress', d);
export const getCourseProgress= id => API.get(`/progress/${id}`);

// Assignments
export const submitAssignment = d  => API.post('/assignments/submit', d);
export const getCourseAssignments = id => API.get(`/assignments/course/${id}`);
export const getMyAssignments = id => API.get(`/assignments/my/${id}`);
export const gradeAssignment  = (id,d) => API.put(`/assignments/${id}/grade`, d);

// Quizzes
export const getCourseQuizzes = id => API.get(`/quizzes/course/${id}`);
export const getQuiz          = id => API.get(`/quizzes/${id}`);
export const createQuiz       = d  => API.post('/quizzes', d);
export const updateQuiz       = (id,d) => API.put(`/quizzes/${id}`, d);
export const submitQuiz       = (id,d) => API.post(`/quizzes/${id}/submit`, d);
export const getMyAttempts    = id => API.get(`/quizzes/${id}/attempts`);
export const getAllAttempts    = id => API.get(`/quizzes/${id}/all-attempts`);

// Certificates
export const getMyCertificates= () => API.get('/certificates/my');
export const getCertificate   = id => API.get(`/certificates/${id}`);
export const generateCertificate = certId => `${API.defaults.baseURL}/certificates/generate/${certId}`;

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read-all');

// Dashboard
export const getStudentDashboard = () => API.get('/dashboard/student');
export const getTeacherDashboard = () => API.get('/dashboard/teacher');
export const getAdminDashboard   = () => API.get('/dashboard/admin');

// Users (admin)
export const getUsers         = p  => API.get('/users', { params: p });
export const updateUserRole   = (id,d) => API.put(`/users/${id}/role`, d);
export const toggleUserActive = id => API.put(`/users/${id}/toggle-active`);
export const deleteUser       = id => API.delete(`/users/${id}`);
export const getTeachers      = () => API.get('/users/teachers/list');

// Chatbot
export const sendChatMessage  = d  => API.post('/chatbot/message', d);
export const explainConcept   = d  => API.post('/chatbot/explain', d);

export default API;

// Media (admin)
export const uploadImage   = (fd) => API.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const listImages    = ()   => API.get('/media/images');
export const deleteImage   = (fn) => API.delete(`/media/${fn}`);

// Site Settings & Admin Class Management
export const getSiteSettings   = ()     => API.get('/site');
export const updateSiteSettings = (d)   => API.put('/site', d);
export const getAdminClasses    = ()    => API.get('/site/admin/classes');
export const getClassStudents   = (id)  => API.get(`/site/admin/classes/${id}/students`);
export const adminEnroll        = (d)   => API.post('/site/admin/enroll', d);
export const adminUnenroll      = (d)   => API.delete('/site/admin/enroll', { data: d });
export const assignTeacher      = (id, teacherId) => API.put(`/site/admin/courses/${id}/teacher`, { teacherId });

// FAQ / Chatbot KB (admin)
export const getFAQ    = ()  => API.get('/site');
export const updateFAQ = (d) => API.put('/site', d);

// Meet attendance & recording
export const saveAttendance  = (courseId, meetId, d) => API.post(`/courses/${courseId}/meets/${meetId}/attendance`, d);
export const saveMeetRecording = (courseId, meetId, url) => API.put(`/courses/${courseId}/meets/${meetId}/recording`, { recordingUrl: url });

export const createUser = (d) => API.post('/users', d);
