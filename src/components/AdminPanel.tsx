
import React, { useState } from 'react';
import NavBar from './NavBar';
import UserManagement from './UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { companies, students, users, User } from '../data/mockData';
import CompanyCard from './CompanyCard';
import CompanyForm from './CompanyForm';
import { Plus } from 'lucide-react';
import { Company } from '../data/mockData';

// Filter users by role for separate management sections
const staffUsers = users.filter(user => user.role === 'staff');
const studentUsers = users.filter(user => user.role === 'student');

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);

  const handleAddCompany = () => {
    setSelectedCompany(undefined);
    setIsCompanyFormOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsCompanyFormOpen(true);
  };

  const handleDeleteCompany = (companyId: string) => {
    setLocalCompanies(localCompanies.filter(company => company.id !== companyId));
  };

  const handleSaveCompany = (companyData: Partial<Company>) => {
    if (selectedCompany) {
      // Edit existing company
      const updatedCompanies = localCompanies.map(c => 
        c.id === selectedCompany.id ? { ...c, ...companyData } as Company : c
      );
      setLocalCompanies(updatedCompanies);
    } else {
      // Add new company
      const newCompany = {
        ...companyData,
        id: Date.now().toString(),
        postedBy: "Admin", // This would come from the current user in a real app
      } as Company;
      
      setLocalCompanies([...localCompanies, newCompany]);
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
                    {students.length} students + {staffUsers.length} staff + {users.filter(u => u.role === 'admin').length} admin
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
                  <div className="text-3xl font-bold">{companies.length}</div>
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
            <UserManagement initialUsers={studentUsers} userType="student" />
          </TabsContent>
          
          <TabsContent value="staff-management">
            <UserManagement initialUsers={staffUsers} userType="staff" />
          </TabsContent>
          
          <TabsContent value="companies">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Company Listings</h2>
              <Button onClick={handleAddCompany}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
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
