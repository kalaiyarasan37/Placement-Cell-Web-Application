
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Trash, Edit, Plus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import UserManagement from './UserManagement';
import CompanyForm from './CompanyForm';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from './NavBar';
import CompanyCard from './CompanyCard';
import ResumeViewer from './ResumeViewer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Company } from '../data/mockData';

// Define the StudentWithResume interface
interface StudentWithResume {
  id: string;
  name: string;
  course: string;
  year: number;
  resumeUrl?: string;
  resumeStatus: 'pending' | 'approved' | 'rejected';
  resumeNotes: string;
  user: {
    name: string;
    email?: string;
  };
}

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCompanies: 0,
    totalStudents: 0,
    totalStaff: 0,
    pendingResumes: 0,
    approvedResumes: 0,
    rejectedResumes: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  
  // Student management states
  const [localStudents, setLocalStudents] = useState<StudentWithResume[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithResume | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);

  // Fetch companies from Supabase
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching companies from Supabase');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) {
        console.error('Error fetching companies:', error);
        // No error toast, just log to console
        setIsLoading(false);
        return;
      }
      
      console.log('Companies data from DB:', data);
      
      if (data && data.length > 0) {
        // Ensure data types are correct before setting state
        const processedData = data.map(company => ({
          ...company,
          // Ensure positions and requirements are arrays
          positions: Array.isArray(company.positions) ? company.positions : [],
          requirements: Array.isArray(company.requirements) ? company.requirements : []
        }));
        
        console.log('Processed companies data:', processedData);
        setCompanies(processedData as Company[]);
      } else {
        console.log('No companies found');
        setCompanies([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setIsLoading(false);
    }
  };

  // Function to fetch students with their resume data
  const fetchStudents = async () => {
    try {
      // First get all profiles that are students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('role', 'student');
        
      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
        return;
      }

      // Get student resume data - safely handle profiles possibly being null/empty
      if (!profiles || profiles.length === 0) {
        console.log('No student profiles found');
        setLocalStudents([]);
        return;
      }
      
      // Then get student resume data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*');
        
      if (studentsError) {
        console.error('Error fetching student resume data:', studentsError);
        return;
      }
      
      // Get user emails from auth - safely handle possible auth errors
      let authUsers: any[] = [];
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authData?.users) {
          authUsers = authData.users;
        } else if (authError) {
          console.error('Error fetching auth users:', authError);
        }
      } catch (error) {
        console.error('Error accessing auth users:', error);
      }
      
      // Safely combine the data
      const combinedData = profiles.map(profile => {
        if (!profile) return null;
        
        const studentData = students?.find(s => s?.user_id === profile.id) || null;
        const authUser = authUsers?.find(u => u?.id === profile.id) || null;
        
        // Only add if we have valid profile data
        if (profile.id && profile.name) {
          return {
            id: profile.id,
            name: profile.name,
            course: "Not specified", // These fields would need to be added to your database
            year: 1, // Placeholder value
            resumeUrl: studentData?.resume_url || undefined,
            resumeStatus: (studentData?.resume_status as 'pending' | 'approved' | 'rejected') || 'pending',
            resumeNotes: '', // Initialize with empty string since resume_notes might not exist in the schema
            user: {
              name: profile.name,
              email: authUser?.email
            }
          } as StudentWithResume;
        }
        return null;
      }).filter(Boolean) as StudentWithResume[];
      
      setLocalStudents(combinedData);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      // Get total companies
      const { count: companyCount, error: companyError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      // Get total students
      const { count: studentCount, error: studentError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      // Get total staff
      const { count: staffCount, error: staffError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'staff');
      
      // Get resume stats
      const { data: resumeData, error: resumeError } = await supabase
        .from('students')
        .select('resume_status');
      
      if (companyError || studentError || staffError || resumeError) {
        console.error('Error fetching statistics:', 
                     { companyError, studentError, staffError, resumeError });
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
        return;
      }

      // Count resumes by status
      let pendingResumes = 0;
      let approvedResumes = 0;
      let rejectedResumes = 0;
      
      if (resumeData) {
        for (const resume of resumeData) {
          if (resume.resume_status === 'pending') pendingResumes++;
          else if (resume.resume_status === 'approved') approvedResumes++;
          else if (resume.resume_status === 'rejected') rejectedResumes++;
        }
      }
      
      setDashboardStats({
        totalCompanies: companyCount || 0,
        totalStudents: studentCount || 0,
        totalStaff: staffCount || 0,
        pendingResumes,
        approvedResumes,
        rejectedResumes,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching statistics",
        variant: "destructive",
      });
    }
  };
  
  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      // Fetch the 5 most recent student activities (resume submissions)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, resume_status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (studentError) {
        console.error('Error fetching student activities:', studentError);
        toast({
          title: "Error",
          description: `Failed to load recent activities: ${studentError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      // Get student profile information for the activities
      if (studentData && Array.isArray(studentData) && studentData.length > 0) {
        const studentIds = studentData.map(student => student.user_id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', studentIds);
          
        if (profileError) {
          console.error('Error fetching student profiles:', profileError);
          return;
        }
        
        // Merge the data
        const activities = studentData.map((student: any) => {
          // Check if student is valid before accessing properties
          if (!student) return null;
          
          const profile = profileData?.find((p: any) => p.id === student.user_id);
          
          return {
            id: student.id,
            type: 'resume',
            status: student.resume_status,
            date: student.created_at,
            studentId: student.user_id,
            studentName: profile ? profile.name : 'Unknown Student',
          };
        }).filter(Boolean); // Remove any null values
        
        setRecentActivities(activities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resume management functions
  const handleViewResume = (student: StudentWithResume) => {
    setSelectedStudent(student);
    setIsResumeDialogOpen(true);
  };
  
  const handleApproveResume = async () => {
    if (selectedStudent) {
      try {
        // Update in Supabase - only update properties known to exist in the schema
        const { error } = await supabase
          .from('students')
          .update({ resume_status: 'approved' })
          .eq('user_id', selectedStudent.id);
          
        if (error) {
          console.error('Error approving resume:', error);
          toast({
            title: "Error",
            description: "Failed to approve resume. " + error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Update local state for immediate UI feedback
        setSelectedStudent({ ...selectedStudent, resumeStatus: 'approved' });
        setLocalStudents(localStudents.map(s => 
          s.id === selectedStudent.id ? { ...s, resumeStatus: 'approved' } : s
        ));
        
        toast({
          title: "Resume Approved",
          description: `${selectedStudent.name}'s resume has been approved.`,
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleRejectResume = async () => {
    if (selectedStudent) {
      try {
        // Update in Supabase - only update properties known to exist in the schema
        const { error } = await supabase
          .from('students')
          .update({ resume_status: 'rejected' })
          .eq('user_id', selectedStudent.id);
          
        if (error) {
          console.error('Error rejecting resume:', error);
          toast({
            title: "Error",
            description: "Failed to request revision. " + error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Update local state for immediate UI feedback
        setSelectedStudent({ ...selectedStudent, resumeStatus: 'rejected' });
        setLocalStudents(localStudents.map(s => 
          s.id === selectedStudent.id ? { ...s, resumeStatus: 'rejected' } : s
        ));
        
        toast({
          title: "Revision Requested",
          description: `${selectedStudent.name} will be notified to update their resume.`,
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleUpdateNotes = async (notes: string) => {
    if (selectedStudent) {
      try {
        // We don't try to update resume_notes in Supabase since it doesn't exist in the schema
        // Only update the local state
        setSelectedStudent({ ...selectedStudent, resumeNotes: notes });
        setLocalStudents(localStudents.map(s => 
          s.id === selectedStudent.id ? { ...s, resumeNotes: notes } : s
        ));
        
        toast({
          title: "Notes Updated",
          description: "Feedback notes have been saved locally.",
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  // Company management functions
  const handleAddCompany = () => {
    setSelectedCompany(undefined);
    setIsCompanyFormOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    console.log('Editing company:', company);
    setSelectedCompany(company);
    setIsCompanyFormOpen(true);
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
        
      if (error) {
        console.error('Error deleting company:', error);
        // Don't show error toast
        return;
      }
      
      // The real-time subscription will update the UI
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    try {
      console.log('Saving company data:', companyData);
      
      // Ensure positions and requirements are always arrays
      const positions = Array.isArray(companyData.positions) ? companyData.positions : [];
      const requirements = Array.isArray(companyData.requirements) ? companyData.requirements : [];
      
      if (selectedCompany) {
        // Update existing company
        console.log('Updating existing company:', selectedCompany.id);
        const { error } = await supabase
          .from('companies')
          .update({
            name: companyData.name,
            description: companyData.description,
            location: companyData.location,
            positions: positions,
            requirements: requirements,
            deadline: companyData.deadline || new Date().toISOString().split('T')[0]
          })
          .eq('id', selectedCompany.id);
          
        if (error) {
          console.error('Error updating company:', error);
          toast({
            title: "Error",
            description: `Failed to update company: ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
      } else {
        // Add new company
        console.log('Adding new company');
        const newCompanyData = {
          name: companyData.name || '',
          description: companyData.description || '',
          location: companyData.location || '',
          positions: positions,
          requirements: requirements,
          deadline: companyData.deadline || new Date().toISOString().split('T')[0],
          posted_by: currentUser?.id || 'system'
        };
        
        console.log('New company data to insert:', newCompanyData);
        
        const { error, data } = await supabase
          .from('companies')
          .insert(newCompanyData)
          .select();
          
        if (error) {
          console.error('Error adding company:', error);
          toast({
            title: "Error",
            description: `Failed to add company: ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Success",
          description: "Company added successfully",
        });
        
        console.log('New company created:', data);
      }
      
      setIsCompanyFormOpen(false);
      // Force immediate refresh instead of waiting for subscription
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Fetch companies and set up real-time subscription
  useEffect(() => {
    fetchCompanies();
    fetchStudents();
    fetchDashboardStats();
    fetchRecentActivities();
    
    // Set up real-time subscription for companies table
    const companiesSubscription = supabase
      .channel('companies-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'companies' }, 
        () => {
          console.log('Companies changed, fetching updated data');
          fetchCompanies();
          fetchDashboardStats();
        }
      )
      .subscribe();
    
    // Set up real-time subscription for profiles table
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          console.log('Profiles changed, fetching updated data');
          fetchDashboardStats();
          fetchStudents();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for students table
    const studentsSubscription = supabase
      .channel('students-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Students changed, fetching updated data');
          fetchDashboardStats();
          fetchRecentActivities();
          fetchStudents();
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      companiesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      studentsSubscription.unsubscribe();
    };
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render dashboard tab
  const renderDashboard = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats.totalCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Companies registered in the system
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Students registered in the system
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats.totalStaff}</div>
          <p className="text-xs text-muted-foreground">
            Staff members with system access
          </p>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Resume Status</CardTitle>
          <CardDescription>
            Overview of student resume approvals
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-yellow-600">
              {dashboardStats.pendingResumes}
            </span>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-green-600">
              {dashboardStats.approvedResumes}
            </span>
            <span className="text-sm text-muted-foreground">Approved</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-red-600">
              {dashboardStats.rejectedResumes}
            </span>
            <span className="text-sm text-muted-foreground">Rejected</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest student resume submissions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading activities...</div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No recent activities found
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{activity.studentName}</span>
                    <span className="text-sm text-muted-foreground">
                      Resume submission
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(activity.status)}`}>
                      {activity.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render companies tab
  const renderCompanies = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Companies Management</CardTitle>
        <Button onClick={handleAddCompany} variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No companies found. Add some!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {companies.map(company => (
              <CompanyCard 
                key={company.id}
                company={company}
                isEditable={true}
                onEdit={() => handleEditCompany(company)}
                onDelete={() => handleDeleteCompany(company.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render students tab
  const renderStudents = () => (
    <Card>
      <CardHeader>
        <CardTitle>Student Resume Review</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">Loading students...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Resume Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                localStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded text-xs inline-block ${getStatusBadgeClass(student.resumeStatus)}`}>
                        {student.resumeStatus === 'approved' && "Approved"}
                        {student.resumeStatus === 'pending' && "Pending"}
                        {student.resumeStatus === 'rejected' && "Needs Revision"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.resumeUrl ? (
                        <Button
                          variant="link"
                          className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                          onClick={() => handleViewResume(student)}
                        >
                          View Resume
                        </Button>
                      ) : (
                        <span className="text-gray-400">No Resume</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="panel-container">
      <NavBar title="Campus Recruitment - Admin Panel" />
      
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="dashboard">
              {renderDashboard()}
            </TabsContent>
            
            <TabsContent value="companies">
              {renderCompanies()}
            </TabsContent>

            <TabsContent value="students">
              {renderStudents()}
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <UserManagement userType="student" />
              <UserManagement userType="staff" />
            </TabsContent>
          </div>
        </Tabs>

        {/* Resume Dialog */}
        <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Resume Review</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <ResumeViewer
                studentName={selectedStudent.name}
                resumeUrl={selectedStudent.resumeUrl || '/sample-resume.pdf'}
                status={selectedStudent.resumeStatus}
                notes={selectedStudent.resumeNotes}
                isStaff={true}
                onApprove={handleApproveResume}
                onReject={handleRejectResume}
                onUpdateNotes={handleUpdateNotes}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Company Form Dialog */}
        <CompanyForm 
          isOpen={isCompanyFormOpen} 
          onClose={() => setIsCompanyFormOpen(false)}
          onSave={handleSaveCompany}
          company={selectedCompany}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
