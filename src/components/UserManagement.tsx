
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Edit, Plus, Trash } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { demoCredentials } from '../data/demoCredentials';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'staff' | 'student';
}

interface UserManagementProps {
  userType?: 'admin' | 'staff' | 'student';
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  userType
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    password: '',
    name: '',
    role: userType || 'student' as 'admin' | 'staff' | 'student',
  });

  // Fetch users from the database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get auth users
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          // Use demo data if auth API fails
          let filteredUsers = Object.values(demoCredentials);
          if (userType) {
            filteredUsers = filteredUsers.filter(user => user.role === userType);
          }
          setUsers(filteredUsers as User[]);
          setIsLoading(false);
          return;
        }

        // Get profiles to match with auth users
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data: profilesData, error: profilesError } = await query;
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Use demo data if profiles fetch fails
          let filteredUsers = Object.values(demoCredentials);
          if (userType) {
            filteredUsers = filteredUsers.filter(user => user.role === userType);
          }
          setUsers(filteredUsers as User[]);
          setIsLoading(false);
          return;
        }
        
        // Map profiles to users with email from auth
        const usersWithEmail = profilesData?.map(profile => {
          // Type assertion to make TypeScript happy since we know authData.users exists
          const authUsers = authData?.users || [];
          const authUser = authUsers.find(user => user.id === profile.id);
          return {
            ...profile,
            email: authUser?.email || undefined
          };
        }) || [];
        
        setUsers(usersWithEmail as User[]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Fallback to demo users
        let filteredUsers = Object.values(demoCredentials);
        if (userType) {
          filteredUsers = filteredUsers.filter(user => user.role === userType);
        }
        setUsers(filteredUsers as User[]);
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [userType]);

  const handleAddUser = () => {
    setFormData({
      id: '',
      email: '',
      password: '',
      name: '',
      role: userType || 'student',
    });
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({ 
      id: user.id,
      email: user.email || '',
      password: '',
      name: user.name,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value as 'admin' | 'staff' | 'student' });
  };

  const saveUser = async (isNewUser: boolean) => {
    if (isNewUser) {
      // Add new user
      setIsLoading(true);
      try {
        // First, create auth user with Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role
            }
          }
        });
        
        if (authError) {
          toast({
            title: "Error Creating User",
            description: authError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          toast({
            title: "Error",
            description: "Failed to create user account",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Create profile record manually to ensure it exists even before email confirmation
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: formData.name,
            role: formData.role
          });

        if (profileError) {
          toast({
            title: "Error Creating Profile",
            description: profileError.message,
            variant: "destructive",
          });
          // Continue anyway as the user auth was created
        }

        // Refresh user list with updated data
        // Get auth users
        const { data: refreshAuthData, error: refreshAuthError } = await supabase.auth.admin.listUsers();
        
        if (refreshAuthError) {
          // If there's an error refreshing, show a message but continue
          toast({
            title: "Warning",
            description: "User created but couldn't refresh user list",
            variant: "default",
          });
          setIsAddDialogOpen(false);
          setIsLoading(false);
          return;
        }
        
        // Get profiles
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data: refreshProfilesData, error: refreshProfilesError } = await query;
        
        if (refreshProfilesError) {
          toast({
            title: "Warning",
            description: "User created but couldn't refresh user list",
            variant: "default",
          });
          setIsAddDialogOpen(false);
          setIsLoading(false);
          return;
        }
        
        if (refreshProfilesData && refreshAuthData) {
          const updatedUsers = refreshProfilesData.map(profile => {
            // Type assertion to make TypeScript happy
            const authUsers = refreshAuthData?.users || [];
            const authUser = authUsers.find(user => user.id === profile.id);
            return {
              ...profile,
              email: authUser?.email || undefined
            };
          });
          setUsers(updatedUsers as User[]);
        }
        
        setIsAddDialogOpen(false);
        toast({
          title: "User Added",
          description: `${formData.name} has been added as a ${formData.role}. They will need to confirm their email before logging in.`,
        });
      } catch (error) {
        console.error('Error adding user:', error);
        toast({
          title: "Error",
          description: "Failed to create user",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Update existing user
      setIsLoading(true);
      try {
        // Update profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            name: formData.name, 
            role: formData.role
          })
          .eq('id', formData.id);
        
        if (profileError) {
          toast({
            title: "Error Updating User",
            description: profileError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Update auth data if password was provided
        if (formData.password) {
          const { error: authError } = await supabase.auth.updateUser({
            password: formData.password
          });
          
          if (authError) {
            toast({
              title: "Error Updating Password",
              description: authError.message,
              variant: "destructive",
            });
          }
        }

        // Refresh user list with updated data
        // Get auth users
        const { data: refreshAuthData, error: refreshAuthError } = await supabase.auth.admin.listUsers();
        
        if (refreshAuthError) {
          // If there's an error refreshing, show a message but continue
          toast({
            title: "Warning",
            description: "User updated but couldn't refresh user list",
            variant: "default",
          });
          setIsEditDialogOpen(false);
          setIsLoading(false);
          return;
        }
        
        // Get profiles
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data: refreshProfilesData, error: refreshProfilesError } = await query;
        
        if (refreshProfilesError) {
          toast({
            title: "Warning",
            description: "User updated but couldn't refresh user list",
            variant: "default",
          });
          setIsEditDialogOpen(false);
          setIsLoading(false);
          return;
        }
        
        if (refreshProfilesData && refreshAuthData) {
          const updatedUsers = refreshProfilesData.map(profile => {
            // Type assertion to make TypeScript happy
            const authUsers = refreshAuthData?.users || [];
            const authUser = authUsers.find(user => user.id === profile.id);
            return {
              ...profile,
              email: authUser?.email || undefined
            };
          });
          setUsers(updatedUsers as User[]);
        }
        
        setIsEditDialogOpen(false);
        toast({
          title: "User Updated",
          description: `${formData.name}'s information has been updated.`,
        });
      } catch (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        // Delete the user from auth system
        const { error } = await supabase.auth.admin.deleteUser(currentUser.id);
        
        if (error) {
          // If deleting from auth fails, try deleting just from profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', currentUser.id);
            
          if (profileError) {
            toast({
              title: "Error Deleting User",
              description: profileError.message,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        // Update user list in state
        setUsers(users.filter(u => u.id !== currentUser.id));
        setIsDeleteDialogOpen(false);
        toast({
          title: "User Deleted",
          description: `${currentUser.name} has been removed from the system.`,
          variant: "destructive",
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const roleToTitle = {
    'admin': 'Administrators',
    'staff': 'Staff Members',
    'student': 'Students'
  };

  if (isLoading && users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{userType ? roleToTitle[userType] : 'User Management'}</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{userType ? roleToTitle[userType] : 'User Management'}</CardTitle>
            <CardDescription>
              {userType 
                ? `Manage ${userType} accounts in the system` 
                : 'Add, edit, or remove users from the system'}
            </CardDescription>
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add {userType ? roleToTitle[userType].slice(0, -1) : 'User'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              {!userType && <TableHead>Role</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userType ? 3 : 4} className="text-center py-10 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  {!userType && <TableCell className="capitalize">{user.role}</TableCell>}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {userType ? roleToTitle[userType].slice(0, -1) : 'User'}</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                required
              />
            </div>
            {!userType && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => saveUser(true)} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input 
                id="edit-password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleInputChange} 
              />
              <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
            </div>
            {!userType && (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => saveUser(false)} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentUser && (
              <p>
                You are about to delete <span className="font-medium">{currentUser.name}</span> ({currentUser.role}).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
