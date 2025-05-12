
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

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
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
  const [currentCompany, setCurrentCompany] = useState<any>(null);

  // Fetch companies from Supabase
  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Error",
          description: `Failed to load companies: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching companies",
        variant: "destructive",
      });
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
      if (studentData) {
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

  // Fetch companies and set up real-time subscription
  useEffect(() => {
    fetchCompanies();
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
          fetchRecentActivities();
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

  const handleAddCompany = () => {
    setCurrentCompany(null);
    setIsCompanyFormOpen(true);
  };

  const handleEditCompany = (company: any) => {
    setCurrentCompany(company);
    setIsCompanyFormOpen(true);
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting company:', error);
        toast({
          title: "Error",
          description: `Failed to delete company: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Company Deleted",
        description: "The company has been removed successfully.",
      });
      
      // The real-time subscription will handle updating the list
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the company",
        variant: "destructive",
      });
    }
  };

  const handleSaveCompany = async (companyData: any) => {
    try {
      if (currentCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', currentCompany.id);
          
        if (error) {
          console.error('Error updating company:', error);
          toast({
            title: "Error",
            description: `Failed to update company: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Company Updated",
          description: "The company information has been updated successfully.",
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert([companyData]);
          
        if (error) {
          console.error('Error adding company:', error);
          toast({
            title: "Error",
            description: `Failed to add company: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Company Added",
          description: "The company has been added successfully.",
        });
      }
      
      // Close the form
      setIsCompanyFormOpen(false);
      
      // The real-time subscription will handle updating the list
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

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
          <div className="space-y-4">
            {companies.map((company) => (
              <Card key={company.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditCompany(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{company.location}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Description:</strong> {company.description}
                    </div>
                    
                    <div>
                      <strong className="text-sm">Positions:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {company.positions && company.positions.map((position: string, index: number) => (
                          <span 
                            key={index}
                            className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                          >
                            {position}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-sm">Requirements:</strong>
                      <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                        {company.requirements && company.requirements.map((req: string, index: number) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm pt-2 border-t mt-2">
                      <span>
                        <strong>Deadline:</strong> {formatDate(company.deadline)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Company Form Modal */}
      <CompanyForm 
        isOpen={isCompanyFormOpen} 
        onClose={() => setIsCompanyFormOpen(false)}
        onSave={handleSaveCompany}
        company={currentCompany}
      />
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="dashboard">
            {renderDashboard()}
          </TabsContent>
          
          <TabsContent value="companies">
            {renderCompanies()}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <UserManagement userType="student" />
            <UserManagement userType="staff" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
