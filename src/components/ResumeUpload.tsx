
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

interface ResumeUploadProps {
  studentId: string;
  currentResumeUrl?: string;
  onUploadSuccess: (url: string) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ 
  studentId, 
  currentResumeUrl, 
  onUploadSuccess 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Check if file is PDF
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // In a real app, this would upload to a server
      // For mock data, we'll create a fake URL
      const mockUrl = `/uploads/${studentId}-${file.name}`;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUploadSuccess(mockUrl);
      
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been uploaded and is pending review",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your resume",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Upload</CardTitle>
        <CardDescription>
          Upload your resume for staff review. Only PDF files accepted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF)</Label>
            <Input 
              id="resume" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
            />
          </div>
          
          {currentResumeUrl && (
            <div className="text-sm text-muted-foreground">
              Current resume: {currentResumeUrl.split('/').pop()}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={!file || uploading} 
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Your resume will be reviewed by our staff before you can apply to companies.
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;
