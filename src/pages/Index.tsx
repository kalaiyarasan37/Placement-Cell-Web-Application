
import React from 'react';
import Login from '../components/Login';
import AdminPanel from '../components/AdminPanel';
import StaffPanel from '../components/StaffPanel';
import StudentPanel from '../components/StudentPanel';
import SuperAdminPanel from '../components/SuperAdminPanel';
import { useAuth, UserRole } from '../contexts/AuthContext';

const Index: React.FC = () => {
  const { currentUser, userRole, isSuperAdmin } = useAuth();

  if (!currentUser || !userRole) {
    return <Login />;
  }

  // Check if the user is a super admin first (using the function from AuthContext)
  if (isSuperAdmin()) {
    return <SuperAdminPanel />;
  }

  // Routing based on user role
  switch (userRole) {
    case UserRole.ADMIN:
      // Admin has complete control with full CRUD operations
      return <AdminPanel />;
    case UserRole.STAFF:
      // Staff has a dedicated panel with limited privileges
      return <StaffPanel />;
    case UserRole.STUDENT:
      // Students can only access the student panel with their assigned ID
      return <StudentPanel studentId={currentUser.id} />;
    default:
      return <Login />;
  }
};

export default Index;
