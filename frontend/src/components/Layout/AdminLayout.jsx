import React from 'react';
import BaseLayout from './BaseLayout';
import { FiHome, FiUsers, FiBook, FiImage, FiGrid, FiEdit3, FiMessageSquare } from 'react-icons/fi';

const adminNav = [
  { to: '/admin/dashboard',      icon: FiHome,           label: 'Dashboard' },
  { to: '/admin/users',          icon: FiUsers,          label: 'Users' },
  { to: '/admin/courses',        icon: FiBook,           label: 'Courses' },
  { to: '/admin/classes',        icon: FiGrid,           label: 'Classes' },
  { to: '/admin/media',          icon: FiImage,          label: 'Media Library' },
  { to: '/admin/landing-editor', icon: FiEdit3,          label: 'Landing Page' },
  { to: '/admin/faq',            icon: FiMessageSquare,  label: 'FAQ & Chatbot' },
];

export default function AdminLayout() {
  return <BaseLayout navItems={adminNav} role="admin" />;
}
