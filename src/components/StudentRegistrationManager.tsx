
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from '../integrations/supabase/client';
import { Edit, Trash, UserPlus, Search, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  registration_number?: string;
}

const StudentRegistrationManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registration_number: '',
    password: ''
  });

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Fetch all student profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, email, registration_number')
        .eq('role', 'student');
      
      if (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: `Failed to fetch student list. ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      if (data) {
        // Type assertion to ensure the data conforms to User[] type
        setStudents(data as User[]);
        setFilteredStudents(data as User[]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    
    // Set up real-time subscription for profiles table
    const profilesSubscription = supabase
      .channel('student-registration-profiles')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'role=eq.student'
        }, 
        () => {
          console.log('Student profiles changed, refreshing data');
          fetchStudents();
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      profilesSubscription.unsubscribe();
    };
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registration_number && student.registration_number.includes(searchTerm))
    );
    
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setFormData({ name: '', email: '', registration_number: '', password: '' });
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: User) => {
    setSelectedStudent(student);
    setFormData({ 
      name: student.name,
      email: student.email || '',
      registration_number: student.registration_number || '',
      password: '' // We don't populate password on edit
    });
    setIsFormOpen(true);
  };

  const resetFormState = () => {
    setSelectedStudent(null);
    setFormData({ name: '', email: '', registration_number: '', password: '' });
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Email validation
    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "Error",
        description: "Valid email is required",
        variant: "destructive"
      });
      return;
    }

    // Registration number validation
    if (!formData.registration_number) {
      toast({
        title: "Error",
        description: "Registration number is required",
        variant: "destructive"
      });
      return;
    }

    // Password validation when creating a new student
    if (!selectedStudent && (!formData.password || formData.password.length < 6)) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Check if registration number already exists (except for the current student being edited)
      const { data: existingReg, error: regCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('registration_number', formData.registration_number)
        .neq('id', selectedStudent?.id || '');
        
      if (regCheckError) {
        console.error('Error checking registration number:', regCheckError);
        toast({
          title: "Error",
          description: `Failed to verify registration number. ${regCheckError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      if (existingReg && existingReg.length > 0) {
        toast({
          title: "Error",
          description: "Registration number already exists",
          variant: "destructive"
        });
        return;
      }
      
      // If editing an existing student
      if (selectedStudent) {
        // Update the profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            email: formData.email,
            registration_number: formData.registration_number
          })
          .eq('id', selectedStudent.id);
          
        if (error) {
          console.error('Error updating student:', error);
          toast({
            title: "Error",
            description: `Failed to update student. ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // If password is provided, update it
        if (formData.password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            selectedStudent.id,
            { password: formData.password }
          );
          
          if (authError) {
            console.error('Error updating password:', authError);
            toast({
              title: "Warning",
              description: `Student updated but password could not be changed. ${authError.message}`,
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "Student Updated",
          description: `${formData.name}'s profile has been updated.`,
        });
      } 
      // If creating a new student
      else {
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: 'student'
            }
          }
        });
        
        if (authError) {
          console.error('Error creating auth user:', authError);
          toast({
            title: "Error",
            description: `Failed to create student account. ${authError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        if (!authData.user || !authData.user.id) {
          toast({
            title: "Error",
            description: "Failed to create student account. No user ID returned.",
            variant: "destructive"
          });
          return;
        }
        
        const newUserId = authData.user.id;
        
        // Create profile record with registration number
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            name: formData.name,
            role: 'student',
            email: formData.email,
            registration_number: formData.registration_number
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          toast({
            title: "Error",
            description: `Failed to create student profile. ${profileError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // Create student record
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: newUserId,
            resume_status: 'pending'
          });
            
        if (studentError) {
          console.error('Error creating student record:', studentError);
          toast({
            title: "Warning",
            description: `Student created but student record could not be created. ${studentError.message}`,
            variant: "destructive"
          });
        }
        
        toast({
          title: "Student Created",
          description: `${formData.name} has been added as a student with registration number ${formData.registration_number}.`,
        });
      }
      
      // Close the form and reset state
      resetFormState();
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudent = async (student: User) => {
    try {
      // First, delete from students table
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('user_id', student.id);
        
      if (studentError) {
        console.error('Error deleting student record:', studentError);
        toast({
          title: "Error",
          description: `Failed to delete student data. ${studentError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', student.id);
        
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        toast({
          title: "Error",
          description: `Failed to delete student profile. ${profileError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Student Deleted",
        description: `${student.name} has been removed.`,
        variant: "destructive"
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Student Registration Management</CardTitle>
        <Button onClick={handleAddStudent} variant="default" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students by name or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? 'No students found matching your search.' : 'No students found. Add some!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email || 'Not set'}</TableCell>
                    <TableCell>{student.registration_number || 'Not set'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Student Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? `Edit Student` : `Add New Student`}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent 
                ? `Update student information and registration number`
                : `Enter the details for the new student with registration number`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="registration">Registration Number</Label>
                <Input 
                  id="registration"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                  placeholder="Enter registration number"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">
                  {selectedStudent ? "Password (leave blank to keep current)" : "Password"}
                </Label>
                <Input 
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={selectedStudent ? "••••••••" : "Enter password"}
                  required={!selectedStudent}
                />
                {!selectedStudent && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetFormState}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedStudent ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StudentRegistrationManager;
