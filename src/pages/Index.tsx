
import React from 'react';
import Login from '../components/Login';
import AdminPanel from '../components/AdminPanel';
import StaffPanel from '../components/StaffPanel';
import StudentPanel from '../components/StudentPanel';
import { useAuth } from '../contexts/AuthContext';

const Index: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser || !userRole) {
    return <Login />;
  }

  // Routing based on user role
  switch (userRole) {
    case 'admin':
      // Admin has access to the most powerful panel
      return <AdminPanel />;
    case 'staff':
      // Staff has a dedicated panel with limited privileges
      return <StaffPanel />;
    case 'student':
      // Students can only access the student panel
      return <StudentPanel studentId={currentUser.id} />;
    default:
      return <Login />;
  }
};

export default Index;
