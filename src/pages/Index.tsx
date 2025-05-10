
import React from 'react';
import Login from '../components/Login';
import AdminPanel from '../components/AdminPanel';
import StaffPanel from '../components/StaffPanel';
import StudentPanel from '../components/StudentPanel';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const PanelRouter: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser || !userRole) {
    return <Login />;
  }

  switch (userRole) {
    case 'admin':
      return <AdminPanel />;
    case 'staff':
      return <StaffPanel />;
    case 'student':
      return <StudentPanel studentId={currentUser.id} />;
    default:
      return <Login />;
  }
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <PanelRouter />
    </AuthProvider>
  );
};

export default Index;
