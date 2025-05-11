
export const demoCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    id: '1',
    name: 'Admin User',
    role: 'admin'
  },
  staff: {
    email: 'staff@example.com',
    password: 'staff123',
    id: '2',
    name: 'Staff User',
    role: 'staff'
  },
  student: {
    email: 'student@example.com',
    password: 'student123',
    id: '3',
    name: 'Student User',
    role: 'student'
  }
};

// Function to get UUID format for demo credentials
// This helps with compatibility when using demo data with real Supabase schema
export const getFormattedDemoCredentials = () => {
  return {
    admin: {
      ...demoCredentials.admin,
      id: '00000000-0000-0000-0000-000000000001'
    },
    staff: {
      ...demoCredentials.staff,
      id: '00000000-0000-0000-0000-000000000002'
    },
    student: {
      ...demoCredentials.student,
      id: '00000000-0000-0000-0000-000000000003'
    }
  };
};
