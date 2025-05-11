
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'staff' | 'student';
  name: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  course: string;
  year: number;
  resumeUrl?: string;
  resumeStatus: 'pending' | 'approved' | 'rejected';
  resumeNotes?: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  positions: string[];
  deadline: string;
  requirements: string[];
  location: string;
  posted_by: string;  // Changed from postedBy to posted_by to match Supabase schema
}

// Mock users for login
export const users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
  },
  {
    id: '2',
    username: 'staff',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member',
  },
  {
    id: '3',
    username: 'student',
    password: 'student123',
    role: 'student',
    name: 'Student User',
  },
];

// Mock students
export const students: Student[] = [
  {
    id: '1',
    userId: '3',
    name: 'Student User',
    email: 'student@example.com',
    course: 'Computer Science',
    year: 3,
    resumeUrl: '/mock-resume.pdf',
    resumeStatus: 'pending',
    resumeNotes: '',
  },
  {
    id: '2',
    userId: '4',
    name: 'Jane Smith',
    email: 'jane@example.com',
    course: 'Business Administration',
    year: 4,
    resumeUrl: '/jane-resume.pdf',
    resumeStatus: 'approved',
    resumeNotes: 'Great resume, approved for applications.',
  },
  {
    id: '3',
    userId: '5',
    name: 'John Doe',
    email: 'john@example.com',
    course: 'Mechanical Engineering',
    year: 2,
    resumeUrl: '/john-resume.pdf',
    resumeStatus: 'rejected',
    resumeNotes: 'Please add more details about your project experience.',
  },
];

// Mock companies - updated to use posted_by instead of postedBy
export const companies: Company[] = [
  {
    id: '1',
    name: 'Tech Innovations Inc.',
    description: 'Leading technology company focused on AI solutions.',
    positions: ['Software Engineer', 'Data Scientist', 'UX Designer'],
    deadline: '2025-06-15',
    requirements: ['Strong programming skills', 'Problem-solving abilities', 'Team player'],
    location: 'San Francisco, CA',
    posted_by: 'Admin User',
  },
  {
    id: '2',
    name: 'Global Finance Group',
    description: 'International financial services provider.',
    positions: ['Financial Analyst', 'Risk Management Specialist', 'Business Consultant'],
    deadline: '2025-05-30',
    requirements: ['Finance or related degree', 'Analytical skills', 'Excel proficiency'],
    location: 'New York, NY',
    posted_by: 'Staff Member',
  },
  {
    id: '3',
    name: 'Eco Solutions',
    description: 'Sustainable engineering and environmental consulting firm.',
    positions: ['Environmental Engineer', 'Sustainability Consultant', 'Project Manager'],
    deadline: '2025-07-01',
    requirements: ['Engineering background', 'Environmental knowledge', 'Project management skills'],
    location: 'Seattle, WA',
    posted_by: 'Admin User',
  },
];
