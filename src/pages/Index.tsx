
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

export default Index;
