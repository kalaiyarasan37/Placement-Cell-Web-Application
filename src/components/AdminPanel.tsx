import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import UserManagement from './UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { companies, students, users } from '../data/mockData';
import CompanyCard from './CompanyCard';
import CompanyForm from './CompanyForm';
import { Plus } from 'lucide-react';
import { Company } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [localCompanies, setLocalCompanies] = useState<Company[]>(companies);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Function to fetch companies from Supabase
  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) {
        console.error('Error fetching companies:', error);
        // Fall back to mock data if there's an error
        setLocalCompanies(companies);
        return;
      }
      
      if (data && data.length > 0) {
        setLocalCompanies(data as Company[]);
      } else {
        // If no companies found in DB, use mock data
        setLocalCompanies(companies);
      }
    } catch (error) {
      console.error('Error:', error);
      setLocalCompanies(companies);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch companies and set up real-time subscription
  useEffect(() => {
    fetchCompanies();
    
    // Set up real-time subscription for companies table
    const companiesSubscription = supabase
      .channel('companies-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'companies' }, 
        () => {
          console.log('Companies changed, fetching updated data');
          fetchCompanies();
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      companiesSubscription.unsubscribe();
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
            deadline: companyData.deadline
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
          ...companyData,
          posted_by: currentUser?.id || "1",
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
            <div className="dashboard-stats">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{students.length + 2}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {students.length} students + {users.filter(u => u.role === 'staff').length} staff + {users.filter(u => u.role === 'admin').length} admin
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
                  <div className="text-3xl font-bold">{localCompanies.length}</div>
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
                    {students.filter(s => s.resumeStatus === 'approved').length}/{students.length}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(students.filter(s => s.resumeStatus === 'approved').length / students.length) * 100}%` }}
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
                  <div className="flex gap-4 items-start border-b pb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium">New Company Added</p>
                      <p className="text-sm text-muted-foreground">Tech Innovations Inc. was added by Staff Member</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start border-b pb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Resume Approved</p>
                      <p className="text-sm text-muted-foreground">Jane Smith's resume was approved by Staff Member</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Resume Rejected</p>
                      <p className="text-sm text-muted-foreground">John Doe's resume was rejected by Staff Member</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
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
