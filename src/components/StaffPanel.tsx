import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { companies, Company } from '../data/mockData';
import CompanyCard from './CompanyCard';
import ResumeViewer from './ResumeViewer';
import CompanyForm from './CompanyForm';
import { Plus } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

// Define the StudentWithResume interface that includes the user property
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

const StaffPanel: React.FC = () => {
  const { currentUser } = useAuth(); // Add this line to get the currentUser
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithResume | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [localStudents, setLocalStudents] = useState<StudentWithResume[]>([]);
  const [localCompanies, setLocalCompanies] = useState<Company[]>([]);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
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
        setIsLoading(false);
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
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };
  
  // Function to fetch companies
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching companies from Supabase');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) {
        console.error('Error fetching companies:', error);
        // Fall back to mock data if there's an error
        setLocalCompanies(companies as unknown as Company[]);
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
        setLocalCompanies(processedData as unknown as Company[]);
      } else {
        // Use mock data if no companies in the database
        console.log('No companies found, using mock data');
        setLocalCompanies(companies as unknown as Company[]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Fall back to mock data on any error
      setLocalCompanies(companies as unknown as Company[]);
      setIsLoading(false);
    }
  };
  
  // Fetch data and set up subscriptions
  useEffect(() => {
    fetchStudents();
    fetchCompanies();
    
    // Set up subscription for profiles
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.student' }, 
        () => {
          console.log('Student profiles changed, refreshing data');
          fetchStudents();
        }
      )
      .subscribe();
      
    // Set up subscription for student resume data
    const studentsSubscription = supabase
      .channel('students-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Student resume data changed, refreshing data');
          fetchStudents();
        }
      )
      .subscribe();
      
    // Set up subscription for companies
    const companiesSubscription = supabase
      .channel('companies-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'companies' }, 
        () => {
          console.log('Companies changed, refreshing data');
          fetchCompanies();
        }
      )
      .subscribe();
      
    // Clean up subscriptions
    return () => {
      profilesSubscription.unsubscribe();
      studentsSubscription.unsubscribe();
      companiesSubscription.unsubscribe();
    };
  }, []);
  
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
          // Don't show error toast
          return;
        }
        
        // Silent success - no toast
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
          posted_by: companyData.posted_by || currentUser?.id || 'system'
        };
        
        console.log('New company data to insert:', newCompanyData);
        
        const { error } = await supabase
          .from('companies')
          .insert(newCompanyData);
          
        if (error) {
          console.error('Error adding company:', error);
          // Don't show error toast
          return;
        }
        
        // Silent success - no toast
      }
      
      setIsCompanyFormOpen(false);
      // Force immediate refresh instead of waiting for subscription
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      // Don't show error toast
    }
  };
  
  return (
    <div className="panel-container">
      <NavBar title="Campus Recruitment - Staff Panel" />
      
      <div className="panel-content">
        <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="companies">Company Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students">
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
                              <div className={`
                                ${student.resumeStatus === 'approved' ? 'status-approved' : ''}
                                ${student.resumeStatus === 'pending' ? 'status-pending' : ''}
                                ${student.resumeStatus === 'rejected' ? 'status-rejected' : ''}
                              `}>
                                {student.resumeStatus === 'approved' && "Approved"}
                                {student.resumeStatus === 'pending' && "Pending"}
                                {student.resumeStatus === 'rejected' && "Needs Revision"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.resumeUrl ? (
                                <button
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                  onClick={() => handleViewResume(student)}
                                >
                                  View Resume
                                </button>
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
                {localCompanies.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-muted-foreground">
                    No companies found. Click "Add Company" to create one.
                  </div>
                ) : (
                  localCompanies.map(company => (
                    <CompanyCard 
                      key={company.id}
                      company={company}
                      isEditable={true}
                      onEdit={() => handleEditCompany(company)}
                      onDelete={() => handleDeleteCompany(company.id)}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
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
  );
};

export default StaffPanel;
