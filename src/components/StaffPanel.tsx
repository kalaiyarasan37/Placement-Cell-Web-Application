
import React, { useState } from 'react';
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
import { companies, students, Student, Company } from '../data/mockData';
import CompanyCard from './CompanyCard';
import ResumeViewer from './ResumeViewer';
import CompanyForm from './CompanyForm';
import { Plus } from 'lucide-react';

const StaffPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [localStudents, setLocalStudents] = useState(students);
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  
  const handleViewResume = (student: Student) => {
    setSelectedStudent(student);
    setIsResumeDialogOpen(true);
  };
  
  const handleApproveResume = () => {
    if (selectedStudent) {
      const updatedStudents = localStudents.map(s => 
        s.id === selectedStudent.id ? { ...s, resumeStatus: 'approved' as const } : s
      );
      setLocalStudents(updatedStudents);
      setSelectedStudent({ ...selectedStudent, resumeStatus: 'approved' as const });
      
      toast({
        title: "Resume Approved",
        description: `${selectedStudent.name}'s resume has been approved.`,
      });
    }
  };
  
  const handleRejectResume = () => {
    if (selectedStudent) {
      const updatedStudents = localStudents.map(s => 
        s.id === selectedStudent.id ? { ...s, resumeStatus: 'rejected' as const } : s
      );
      setLocalStudents(updatedStudents);
      setSelectedStudent({ ...selectedStudent, resumeStatus: 'rejected' as const });
      
      toast({
        title: "Revision Requested",
        description: `${selectedStudent.name} will be notified to update their resume.`,
      });
    }
  };
  
  const handleUpdateNotes = (notes: string) => {
    if (selectedStudent) {
      const updatedStudents = localStudents.map(s => 
        s.id === selectedStudent.id ? { ...s, resumeNotes: notes } : s
      );
      setLocalStudents(updatedStudents);
      setSelectedStudent({ ...selectedStudent, resumeNotes: notes });
    }
  };

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
    toast({
      title: "Company Deleted",
      description: "The company has been removed from the system.",
    });
  };

  const handleSaveCompany = (companyData: Partial<Company>) => {
    if (selectedCompany) {
      // Edit existing company
      const updatedCompanies = localCompanies.map(c => 
        c.id === selectedCompany.id ? { ...c, ...companyData } as Company : c
      );
      setLocalCompanies(updatedCompanies);
      toast({
        title: "Company Updated",
        description: `${companyData.name} has been updated successfully.`,
      });
    } else {
      // Add new company
      const newCompany = {
        ...companyData,
        id: Date.now().toString(),
        postedBy: "Staff Member", // This would come from the current user in a real app
      } as Company;
      
      setLocalCompanies([...localCompanies, newCompany]);
      toast({
        title: "Company Added",
        description: `${newCompany.name} has been added to the system.`,
      });
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Resume Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>Year {student.year}</TableCell>
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
                          <button
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => handleViewResume(student)}
                          >
                            View Resume
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
