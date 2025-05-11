
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

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
  const { session } = useAuth();
  
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

    // Check if user is authenticated
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload your resume",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload to Supabase Storage
      const fileName = `${studentId}-${Date.now()}.pdf`;
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(data.path);
      
      // Update student record in DB
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          resume_url: publicUrl,
          resume_status: 'pending'
        })
        .eq('user_id', studentId);
      
      if (updateError) {
        throw updateError;
      }
      
      onUploadSuccess(publicUrl);
      
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been uploaded and is pending review",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your resume",
        variant: "destructive",
      });
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
