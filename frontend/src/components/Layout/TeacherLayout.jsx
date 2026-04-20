import React from 'react';
import BaseLayout from './BaseLayout';
import { FiHome, FiBook, FiUser } from 'react-icons/fi';

const teacherNav = [
  { to: '/teacher/dashboard', icon: FiHome,  label: 'Dashboard' },
  { to: '/teacher/courses',   icon: FiBook,  label: 'My Classes' },
  { to: '/teacher/profile',   icon: FiUser,  label: 'Profile' },
];

export default function TeacherLayout() {
  return <BaseLayout navItems={teacherNav} role="teacher" />;
}
