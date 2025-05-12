
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, File, X } from 'lucide-react';

interface ResumeViewerProps {
  studentName: string;
  resumeUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  isStaff?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onUpdateNotes?: (notes: string) => void;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({
  studentName,
  resumeUrl,
  status,
  notes = "",
  isStaff = false,
  onApprove,
  onReject,
  onUpdateNotes,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Needs Revision</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Review</Badge>;
    }
  };

  const handleDownload = () => {
    if (resumeUrl) {
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = resumeUrl.split('/').pop() || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{studentName}'s Resume</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {isStaff ? "Review this student's resume" : "Your resume status"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-md overflow-hidden">
          <iframe 
            src={resumeUrl} 
            className="w-full h-[500px] border-0"
            title={`${studentName}'s Resume`}
          />
        </div>
        
        <div className="flex items-center p-4 border rounded-md bg-secondary">
          <File className="h-8 w-8 text-muted-foreground mr-2" />
          <div className="flex-grow">
            <p>{resumeUrl.split('/').pop()}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {(status === 'rejected' || isStaff) && (
          <div>
            <p className="text-sm font-medium mb-1">Notes:</p>
            {isStaff ? (
              <textarea
                className="w-full p-2 border rounded-md h-24"
                value={notes}
                onChange={(e) => onUpdateNotes && onUpdateNotes(e.target.value)}
                placeholder="Add feedback for the student here..."
              />
            ) : (
              <div className="p-3 bg-muted rounded-md text-sm">
                {notes || "No feedback provided yet."}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {isStaff && (
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
            onClick={onReject}
          >
            <X className="h-4 w-4 mr-2" />
            Request Revision
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={onApprove}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ResumeViewer;
