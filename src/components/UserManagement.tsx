
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
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching users:', error);
          toast({
            title: "Error",
            description: "Failed to load users",
            variant: "destructive",
          });
          return;
        }
        
        setUsers(data as User[]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
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
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name,
            role: formData.role
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

        // Refresh user list
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data } = await query;
        
        if (data) {
          setUsers(data as User[]);
        }
        
        setIsAddDialogOpen(false);
        toast({
          title: "User Added",
          description: `${formData.name} has been added as a ${formData.role}.`,
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
          .update({ name: formData.name, role: formData.role })
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
          const { error: authError } = await supabase.auth.admin.updateUserById(
            formData.id,
            { password: formData.password }
          );
          
          if (authError) {
            toast({
              title: "Error Updating Password",
              description: authError.message,
              variant: "destructive",
            });
          }
        }

        // Refresh user list
        let query = supabase.from('profiles').select('id, name, role');
        
        if (userType) {
          query = query.eq('role', userType);
        }
        
        const { data } = await query;
        
        if (data) {
          setUsers(data as User[]);
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
        const { error } = await supabase.auth.admin.deleteUser(currentUser.id);
        
        if (error) {
          toast({
            title: "Error Deleting User",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

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
              {!userType && <TableHead>Role</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userType ? 2 : 3} className="text-center py-10 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
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
