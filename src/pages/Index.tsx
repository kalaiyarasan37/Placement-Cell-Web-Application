
import React, { useEffect } from 'react';
import Login from '../components/Login';
import AdminPanel from '../components/AdminPanel';
import StaffPanel from '../components/StaffPanel';
import StudentPanel from '../components/StudentPanel';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { students } from '../data/mockData';

const PanelRouter: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  switch (currentUser.role) {
    case 'admin':
      return <AdminPanel />;
    case 'staff':
      return <StaffPanel />;
    case 'student':
      const student = students.find(s => s.userId === currentUser.id);
      return <StudentPanel studentId={student?.id || currentUser.id} />;
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
