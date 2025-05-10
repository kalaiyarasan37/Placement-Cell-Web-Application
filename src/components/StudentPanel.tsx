
import React, { useState } from 'react';
import NavBar from './NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/use-toast';
import { companies } from '../data/mockData';
import CompanyCard from './CompanyCard';
import ResumeUpload from './ResumeUpload';
import ResumeViewer from './ResumeViewer';

interface StudentPanelProps {
  studentId: string;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ studentId }) => {
  const [resumeUrl, setResumeUrl] = useState<string | undefined>('/mock-resume.pdf');
  const [resumeStatus, setResumeStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [resumeNotes, setResumeNotes] = useState('');
  const [isViewResumeDialogOpen, setIsViewResumeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<typeof companies[0] | null>(null);
  
  const handleResumeUpload = (url: string) => {
    setResumeUrl(url);
    setResumeStatus('pending');
    setResumeNotes('');
  };
  
  const handleApplyToCompany = (company: typeof companies[0]) => {
    setSelectedCompany(company);
    
    if (resumeStatus !== 'approved') {
      toast({
        title: "Cannot Apply",
        description: "Your resume must be approved before you can apply to companies.",
        variant: "destructive",
      });
      return;
    }
    
    setIsApplyDialogOpen(true);
  };
  
  const handleSubmitApplication = () => {
    // In a real app, this would submit the application to the backend
    toast({
      title: "Application Submitted",
      description: `Your application to ${selectedCompany?.name} has been submitted successfully.`,
    });
    setIsApplyDialogOpen(false);
  };
  
  return (
    <div className="panel-container">
      <NavBar title="Campus Recruitment - Student Panel" />
      
      <div className="panel-content">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="resume">Resume Management</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-4">Welcome to Campus Recruitment Portal</h2>
                <p className="mb-4">
                  This platform connects you with potential employers and helps you manage your job applications.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setActiveTab("resume")}>
                    Manage Your Resume
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("companies")}
                  >
                    Browse Companies
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="font-medium mb-4">Resume Status</h3>
                {resumeUrl ? (
                  <div>
                    <div className={`mb-4 text-sm font-medium rounded-full px-3 py-1 inline-block
                      ${resumeStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      ${resumeStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${resumeStatus === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {resumeStatus === 'approved' && "Approved"}
                      {resumeStatus === 'pending' && "Pending Review"}
                      {resumeStatus === 'rejected' && "Needs Revision"}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setIsViewResumeDialogOpen(true)}
                    >
                      View Resume
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">
                      You haven't uploaded a resume yet.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setActiveTab("resume")}
                    >
                      Upload Resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-medium mb-4">Upcoming Deadlines</h3>
              <div className="space-y-4">
                {companies.slice(0, 3).map(company => (
                  <div key={company.id} className="flex justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.positions.join(', ')}</p>
                    </div>
                    <p className="text-sm">
                      {new Date(company.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="resume">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResumeUpload
                studentId={studentId}
                currentResumeUrl={resumeUrl}
                onUploadSuccess={handleResumeUpload}
              />
              
              {resumeUrl && (
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-medium mb-4">Current Resume Status</h3>
                  
                  <div className="mb-4">
                    <span className="font-medium text-sm mr-2">Status:</span>
                    <span className={`
                      ${resumeStatus === 'approved' ? 'text-green-600' : ''}
                      ${resumeStatus === 'pending' ? 'text-yellow-600' : ''}
                      ${resumeStatus === 'rejected' ? 'text-red-600' : ''}
                    `}>
                      {resumeStatus === 'approved' && "Approved"}
                      {resumeStatus === 'pending' && "Pending Review"}
                      {resumeStatus === 'rejected' && "Needs Revision"}
                    </span>
                  </div>
                  
                  {resumeNotes && (
                    <div className="mb-4">
                      <p className="font-medium text-sm mb-1">Feedback:</p>
                      <p className="text-sm p-3 bg-gray-50 rounded border">
                        {resumeNotes}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setIsViewResumeDialogOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    View My Resume
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="companies">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {companies.map(company => (
                <CompanyCard 
                  key={company.id}
                  company={company}
                  canApply={resumeStatus === 'approved'}
                  onApply={() => handleApplyToCompany(company)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* View Resume Dialog */}
      <Dialog open={isViewResumeDialogOpen} onOpenChange={setIsViewResumeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your Resume</DialogTitle>
          </DialogHeader>
          <ResumeViewer
            studentName="Your"
            resumeUrl={resumeUrl || '/sample-resume.pdf'}
            status={resumeStatus}
            notes={resumeNotes}
          />
        </DialogContent>
      </Dialog>
      
      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {selectedCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You are applying for the following position(s):
            </p>
            <ul className="list-disc pl-5 mb-4">
              {selectedCompany?.positions.map((position, index) => (
                <li key={index}>{position}</li>
              ))}
            </ul>
            <p>
              Your approved resume will be sent with this application.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication}>
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPanel;
