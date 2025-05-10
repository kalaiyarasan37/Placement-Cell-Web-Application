
import React, { useState } from 'react';
import NavBar from './NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { companies, students, Student } from '../data/mockData';
import CompanyCard from './CompanyCard';
import ResumeViewer from './ResumeViewer';

const StaffPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [localStudents, setLocalStudents] = useState(students);
  
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {companies.map(company => (
                <CompanyCard 
                  key={company.id}
                  company={company}
                  isEditable={true}
                  onEdit={() => {}}
                  onDelete={() => {}}
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
    </div>
  );
};

export default StaffPanel;

