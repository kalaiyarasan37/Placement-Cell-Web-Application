
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
import { supabase } from '../integrations/supabase/client';
import { Label } from "@/components/ui/label";
import { Edit, Trash, UserPlus, Search, X } from "lucide-react";

interface UserManagementProps {
  userType: 'student' | 'staff';
}

interface User {
  id: string;
  name: string;
  role: string;
  created_at?: string;
  email?: string;
}

interface StudentDetails {
  id: string;
  user_id: string;
  resume_url: string | null;
  resume_status: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ userType }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [studentDetails, setStudentDetails] = useState<Record<string, StudentDetails>>({});
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Fetch profiles based on role
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('role', userType);
      
      if (error) {
        console.error(`Error fetching ${userType}s:`, error);
        toast({
          title: "Error",
          description: `Failed to fetch ${userType} list. ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      if (data) {
        setUsers(data as User[]);
        setFilteredUsers(data as User[]);
        
        // If we're handling students, also fetch their additional details
        if (userType === 'student') {
          await fetchStudentDetails(data as User[]);
        }
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

  const fetchStudentDetails = async (studentUsers: User[]) => {
    if (studentUsers.length === 0) return;
    
    // Get student IDs
    const studentIds = studentUsers.map(student => student.id);
    
    try {
      // Fetch student details
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('user_id', studentIds);
        
      if (error) {
        console.error('Error fetching student details:', error);
        return;
      }
      
      if (data) {
        // Create a map of user_id to student details
        const detailsMap: Record<string, StudentDetails> = {};
        data.forEach((student: StudentDetails) => {
          detailsMap[student.user_id] = student;
        });
        
        setStudentDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscription for profiles table
    const profilesSubscription = supabase
      .channel('user-management-profiles')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `role=eq.${userType}`
        }, 
        () => {
          console.log(`${userType} profiles changed, refreshing data`);
          fetchUsers();
        }
      )
      .subscribe();
      
    // If handling students, also subscribe to student details changes
    let studentsSubscription;
    if (userType === 'student') {
      studentsSubscription = supabase
        .channel('user-management-students')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'students'
          }, 
          () => {
            console.log('Student details changed, refreshing data');
            fetchUsers(); // This will also fetch the latest student details
          }
        )
        .subscribe();
    }
    
    // Clean up subscriptions when component unmounts
    return () => {
      profilesSubscription.unsubscribe();
      if (studentsSubscription) {
        studentsSubscription.unsubscribe();
      }
    };
  }, [userType]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '' });
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({ 
      name: user.name,
      email: user.email || '',
      password: '' // We don't populate password on edit
    });
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetFormState = () => {
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '' });
    setIsFormOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleChangeResumeStatus = async (
    userId: string, 
    newStatus: 'pending' | 'approved' | 'rejected'
  ) => {
    try {
      // Update student record in the database
      const { error } = await supabase
        .from('students')
        .update({ resume_status: newStatus })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating resume status:', error);
        toast({
          title: "Error",
          description: `Failed to update resume status. ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Status Updated",
        description: `Resume status changed to ${newStatus}.`,
      });
      
      // Update will happen through the subscription
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
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

    // Password validation when creating a new user
    if (!currentUser && (!formData.password || formData.password.length < 6)) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // If editing an existing user
      if (currentUser) {
        // Update the profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            // Only update email if it has changed and is provided
            ...(formData.email && formData.email !== currentUser.email ? { email: formData.email } : {})
          })
          .eq('id', currentUser.id);
          
        if (error) {
          console.error('Error updating user:', error);
          toast({
            title: "Error",
            description: `Failed to update user. ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // If password is provided, update it
        if (formData.password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            currentUser.id,
            { password: formData.password }
          );
          
          if (authError) {
            console.error('Error updating password:', authError);
            toast({
              title: "Warning",
              description: `User updated but password could not be changed. ${authError.message}`,
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "User Updated",
          description: `${formData.name}'s profile has been updated.`,
        });
      } 
      // If creating a new user
      else {
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: userType
            }
          }
        });
        
        if (authError) {
          console.error('Error creating auth user:', authError);
          toast({
            title: "Error",
            description: `Failed to create user account. ${authError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        if (!authData.user || !authData.user.id) {
          toast({
            title: "Error",
            description: "Failed to create user account. No user ID returned.",
            variant: "destructive"
          });
          return;
        }
        
        const newUserId = authData.user.id;
        
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            name: formData.name,
            role: userType,
            email: formData.email
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          toast({
            title: "Error",
            description: `Failed to create user profile. ${profileError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // If creating a student, also create a student record
        if (userType === 'student') {
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
              description: `User created but student record could not be created. ${studentError.message}`,
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "User Created",
          description: `${formData.name} has been added as a ${userType} with login credentials.`,
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

  const confirmDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      // First, if it's a student, delete from students table
      if (userType === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('user_id', currentUser.id);
          
        if (studentError) {
          console.error('Error deleting student record:', studentError);
          toast({
            title: "Error",
            description: `Failed to delete student data. ${studentError.message}`,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentUser.id);
        
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        toast({
          title: "Error",
          description: `Failed to delete user profile. ${profileError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "User Deleted",
        description: `${currentUser.name} has been removed.`,
        variant: "destructive"
      });
      
      // Close the dialog and reset state
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{userType === 'student' ? 'Students' : 'Staff'} Management</CardTitle>
        <Button onClick={handleAddUser} variant="default" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add {userType === 'student' ? 'Student' : 'Staff'}
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${userType}s by name...`}
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
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? 'No users found matching your search.' : 'No users found. Add some!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  {userType === 'student' && <TableHead>Resume Status</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email || 'Not set'}</TableCell>
                    {userType === 'student' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <select
                            value={studentDetails[user.id]?.resume_status || 'pending'}
                            onChange={(e) => handleChangeResumeStatus(
                              user.id, 
                              e.target.value as 'pending' | 'approved' | 'rejected'
                            )}
                            className={`rounded px-2 py-1 text-sm font-medium
                              ${studentDetails[user.id]?.resume_status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                              ${studentDetails[user.id]?.resume_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${studentDetails[user.id]?.resume_status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                            `}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          {studentDetails[user.id]?.resume_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(studentDetails[user.id]?.resume_url || '', '_blank')}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
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
      
      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentUser ? `Edit ${userType}` : `Add New ${userType}`}
            </DialogTitle>
            <DialogDescription>
              {currentUser 
                ? `Update ${userType} information`
                : `Enter the details for the new ${userType} with login credentials`}
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
                <Label htmlFor="password">
                  {currentUser ? "Password (leave blank to keep current)" : "Password"}
                </Label>
                <Input 
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={currentUser ? "••••••••" : "Enter password"}
                  required={!currentUser}
                />
                {!currentUser && (
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
                {currentUser ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline"
              onClick={resetFormState}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDeleteUser}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
