
import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import UserManagement from './UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { students } from '../data/mockData';
import CompanyCard from './CompanyCard';
import CompanyForm from './CompanyForm';
import { Plus } from 'lucide-react';
import type { Company } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Activity {
  id: string;
  type: 'company_added' | 'resume_approved' | 'resume_rejected';
  description: string;
  timestamp: string;
  userName: string;
}

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalAdmin: number;
  totalCompanies: number;
  approvedResumes: number;
  pendingResumes: number;
  rejectedResumes: number;
  totalResumes: number;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [localCompanies, setLocalCompanies] = useState<Company[]>([]);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalAdmin: 0,
    totalCompanies: 0,
    approvedResumes: 0,
    pendingResumes: 0,
    rejectedResumes: 0,
    totalResumes: 0
  });
  const { currentUser } = useAuth();
  
  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      // Fetch counts of profiles by role
      const { data: profileCounts, error: profileError } = await supabase
        .from('profiles')
        .select('role, count')
        .group('role');
      
      if (profileError) {
        console.error('Error fetching profile counts:', profileError);
      }
      
      // Fetch company count
      const { count: companyCount, error: companyError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      if (companyError) {
        console.error('Error fetching company count:', companyError);
      }
      
      // Fetch resume counts by status
      const { data: resumeCounts, error: resumeError } = await supabase
        .from('students')
        .select('resume_status, count')
        .group('resume_status');
      
      if (resumeError) {
        console.error('Error fetching resume counts:', resumeError);
      }

      // Parse and set statistics
      const newStats = { ...stats };
      
      if (profileCounts) {
        newStats.totalStudents = profileCounts.find(p => p.role === 'student')?.count || 0;
        newStats.totalStaff = profileCounts.find(p => p.role === 'staff')?.count || 0;
        newStats.totalAdmin = profileCounts.find(p => p.role === 'admin')?.count || 0;
        newStats.totalUsers = newStats.totalStudents + newStats.totalStaff + newStats.totalAdmin;
      }
      
      if (companyCount !== null) {
        newStats.totalCompanies = companyCount;
      }
      
      if (resumeCounts) {
        newStats.approvedResumes = resumeCounts.find(r => r.resume_status === 'approved')?.count || 0;
        newStats.pendingResumes = resumeCounts.find(r => r.resume_status === 'pending')?.count || 0;
        newStats.rejectedResumes = resumeCounts.find(r => r.resume_status === 'rejected')?.count || 0;
        newStats.totalResumes = newStats.approvedResumes + newStats.pendingResumes + newStats.rejectedResumes;
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fall back to some default values
      setStats({
        totalUsers: students.length + 2,
        totalStudents: students.length,
        totalStaff: 1,
        totalAdmin: 1,
        totalCompanies: localCompanies.length,
        approvedResumes: students.filter(s => s.resumeStatus === 'approved').length,
        pendingResumes: students.filter(s => s.resumeStatus === 'pending').length,
        rejectedResumes: students.filter(s => s.resumeStatus === 'rejected').length,
        totalResumes: students.length
      });
    }
  };

  // Function to fetch recent activities
  const fetchRecentActivities = async () => {
    // In a real app, you would fetch activities from a dedicated table
    // Here we'll simulate this by checking recent changes in companies and students tables
    try {
      // Get recent companies (limit to latest 5)
      const { data: recentCompanies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, posted_by, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (companiesError) {
        console.error('Error fetching recent companies:', companiesError);
      }

      // Get recent resume status changes (would require a dedicated activities table in a real app)
      // For now, we'll use mock data combined with any real companies we found
      
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'resume_approved',
          description: 'Resume was approved',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          userName: 'Jane Smith'
        },
        {
          id: '2',
          type: 'resume_rejected',
          description: 'Resume was rejected',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          userName: 'John Doe'
        }
      ];
      
      // Convert companies to activities format
      const companyActivities: Activity[] = recentCompanies ? recentCompanies.map(company => ({
        id: `company-${company.id}`,
        type: 'company_added' as const,
        description: `${company.name} was added`,
        timestamp: company.created_at,
        userName: company.posted_by || 'Unknown'
      })) : [];
      
      // Combine and sort by timestamp
      const combinedActivities = [...companyActivities, ...mockActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Take only the 5 most recent
        
      setActivities(combinedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fall back to mock activities
      setActivities([
        {
          id: '1',
          type: 'company_added',
          description: 'New Company Added',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          userName: 'Staff Member'
        },
        {
          id: '2',
          type: 'resume_approved',
          description: 'Resume Approved',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          userName: 'Jane Smith'
        },
        {
          id: '3',
          type: 'resume_rejected',
          description: 'Resume Rejected',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          userName: 'John Doe'
        }
      ]);
    }
  };
  
  // Function to fetch companies from Supabase
  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) {
        console.error('Error fetching companies:', error);
        // Fall back to mock data if there's an error
        setLocalCompanies(companies as unknown as Company[]);
        return;
      }
      
      if (data && data.length > 0) {
        // Cast Supabase data to our Company interface
        setLocalCompanies(data as unknown as Company[]);
      } else {
        // If no companies found in DB, use mock data
        setLocalCompanies(companies as unknown as Company[]);
      }
    } catch (error) {
      console.error('Error:', error);
      setLocalCompanies(companies as unknown as Company[]);
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
    setSelectedCompany(undefined);
    setIsCompanyFormOpen(true);
  };

  const handleEditCompany = (company: Company) => {
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
        toast({
          title: "Error",
          description: "Failed to delete company. " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Local state update will happen through the subscription
      toast({
        title: "Company Deleted",
        description: "The company has been successfully removed.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the company.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    try {
      if (selectedCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: companyData.name,
            description: companyData.description,
            location: companyData.location,
            positions: companyData.positions,
            requirements: companyData.requirements,
            deadline: companyData.deadline || new Date().toISOString().split('T')[0]
          })
          .eq('id', selectedCompany.id);
          
        if (error) {
          console.error('Error updating company:', error);
          toast({
            title: "Error",
            description: "Failed to update company. " + error.message,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Company Updated",
          description: `${companyData.name} has been updated successfully.`,
        });
      } else {
        // Add new company
        const newCompanyData = {
          name: companyData.name || '',
          description: companyData.description || '',
          location: companyData.location || '',
          positions: companyData.positions || [],
          requirements: companyData.requirements || [],
          deadline: companyData.deadline || new Date().toISOString().split('T')[0],
          posted_by: currentUser?.id || "admin-user"
        };
        
        const { data, error } = await supabase
          .from('companies')
          .insert(newCompanyData)
          .select();
          
        if (error) {
          console.error('Error adding company:', error);
          toast({
            title: "Error",
            description: "Failed to add company. " + error.message,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Company Added",
          description: `${companyData.name} has been added successfully.`,
        });
      }
      
      // Close the form
      setIsCompanyFormOpen(false);
      // Update will happen through the subscription
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the company.",
        variant: "destructive"
      });
    }
  };

  // Function to format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 2) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  return (
    <div className="panel-container">
      <NavBar title="Campus Recruitment - Admin Panel" />
      
      <div className="panel-content">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="student-management">Student Management</TabsTrigger>
            <TabsTrigger value="staff-management">Staff Management</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="dashboard-stats grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalStudents} students + {stats.totalStaff} staff + {stats.totalAdmin} admin
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCompanies}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Resume Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.approvedResumes}/{stats.totalResumes}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: stats.totalResumes > 0 
                            ? `${(stats.approvedResumes / stats.totalResumes) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4 items-start border-b pb-4 last:border-0">
                        <div className={`w-2 h-2 rounded-full mt-2 
                          ${activity.type === 'company_added' ? 'bg-green-500' : ''}
                          ${activity.type === 'resume_approved' ? 'bg-blue-500' : ''}
                          ${activity.type === 'resume_rejected' ? 'bg-red-500' : ''}
                        `}></div>
                        <div>
                          <p className="font-medium">
                            {activity.type === 'company_added' && 'New Company Added'}
                            {activity.type === 'resume_approved' && 'Resume Approved'}
                            {activity.type === 'resume_rejected' && 'Resume Rejected'}
                          </p>
                          <p className="text-sm text-muted-foreground">{activity.description} by {activity.userName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="student-management">
            <UserManagement userType="student" />
          </TabsContent>
          
          <TabsContent value="staff-management">
            <UserManagement userType="staff" />
          </TabsContent>
          
          <TabsContent value="companies">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Company Listings</h2>
              <Button onClick={handleAddCompany}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-10">Loading companies...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {localCompanies.map(company => (
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Company Form Dialog */}
      <CompanyForm 
        isOpen={isCompanyFormOpen}
        onClose={() => setIsCompanyFormOpen(false)}
        onSave={handleSaveCompany}
        company={selectedCompany}
      />
    </div>
  );
};

export default AdminPanel;
