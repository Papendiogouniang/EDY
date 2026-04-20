// StudentLayout.jsx
import React from 'react';
import BaseLayout from './BaseLayout';
import { FiHome, FiBook, FiAward, FiUser, FiClipboard, FiEdit } from 'react-icons/fi';
import './Layout.css';

const studentNav = [
  { to: '/student/dashboard',    icon: FiHome,  label: 'Dashboard' },
  { to: '/student/courses',      icon: FiBook,  label: 'My Courses' },
  { to: '/student/assignments',  icon: FiClipboard, label: 'Devoirs' },
  { to: '/student/exams',          icon: FiEdit,      label: 'Examens & Quiz' },
  { to: '/student/certificates', icon: FiAward, label: 'Certificates' },
  { to: '/student/profile',      icon: FiUser,  label: 'Profile' },
];

export default function StudentLayout() {
  return <BaseLayout navItems={studentNav} role="student" />;
}
