
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Search, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from './NavBar';
import AdminPanel from './AdminPanel';
import SuperAdminDashboard from './SuperAdminDashboard';
import CompanyManager from './CompanyManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Define interfaces
interface Admin {
  id: string;
  name: string;
  email?: string;
  role: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  role: string;
  created_at: string;
  registration_number?: string;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  role: string;
  created_at: string;
  department?: string;
}

const SuperAdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Admin states
  const [adminUsers, setAdminUsers] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  
  // Student states
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // Staff states
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  
  // Loading and dialog states
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Admin | Student | Staff | null>(null);
  const [currentType, setCurrentType] = useState<'admin' | 'student' | 'staff'>('admin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registration_number: '',
    department: '',
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Generate a unique user ID for new users
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  };

  // Fetch functions - Updated to handle demo users properly
  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');
        
      if (error) {
        console.error('Error fetching admins:', error);
        return;
      }
      
      const profileData = data as Admin[];
      setAdminUsers(profileData);
      setFilteredAdmins(profileData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
        
      if (error) {
        console.error('Error fetching students:', error);
        return;
      }
      
      const profileData = data as Student[];
      setStudents(profileData);
      setFilteredStudents(profileData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');
        
      if (error) {
        console.error('Error fetching staff:', error);
        return;
      }
      
      const profileData = data as Staff[];
      setStaffMembers(profileData);
      setFilteredStaff(profileData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAdmins(), fetchStudents(), fetchStaff()]);
    setIsLoading(false);
  };
  
  // Filter effects
  useEffect(() => {
    if (adminSearchTerm.trim() === '') {
      setFilteredAdmins(adminUsers);
      return;
    }
    
    const filtered = adminUsers.filter(admin => 
      admin.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
      admin.email?.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );
    
    setFilteredAdmins(filtered);
  }, [adminSearchTerm, adminUsers]);

  useEffect(() => {
    if (studentSearchTerm.trim() === '') {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
      student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
    
    setFilteredStudents(filtered);
  }, [studentSearchTerm, students]);

  useEffect(() => {
    if (staffSearchTerm.trim() === '') {
      setFilteredStaff(staffMembers);
      return;
    }
    
    const filtered = staffMembers.filter(staff => 
      staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) || 
      staff.email?.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      staff.department?.toLowerCase().includes(staffSearchTerm.toLowerCase())
    );
    
    setFilteredStaff(filtered);
  }, [staffSearchTerm, staffMembers]);
  
  // Initialize data and subscriptions
  useEffect(() => {
    fetchAllData();
    
    const adminSubscription = supabase
      .channel('admin-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'role=eq.admin' 
        }, 
        () => {
          fetchAdmins();
        }
      )
      .subscribe();

    const studentSubscription = supabase
      .channel('student-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'role=eq.student' 
        }, 
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    const staffSubscription = supabase
      .channel('staff-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'role=eq.staff' 
        }, 
        () => {
          fetchStaff();
        }
      )
      .subscribe();
      
    return () => {
      adminSubscription.unsubscribe();
      studentSubscription.unsubscribe();
      staffSubscription.unsubscribe();
    };
  }, []);
  
  // CRUD handlers
  const handleAdd = (type: 'admin' | 'student' | 'staff') => {
    setCurrentItem(null);
    setCurrentType(type);
    setFormData({ name: '', email: '', password: '', registration_number: '', department: '' });
    setIsAddDialogOpen(true);
  };
  
  const handleEdit = (item: Admin | Student | Staff, type: 'admin' | 'student' | 'staff') => {
    setCurrentItem(item);
    setCurrentType(type);
    setFormData({
      name: item.name,
      email: item.email || '',
      password: '',
      registration_number: (item as Student).registration_number || '',
      department: (item as Staff).department || ''
    });
    setIsAddDialogOpen(true);
  };
  
  const handleDelete = (item: Admin | Student | Staff, type: 'admin' | 'student' | 'staff') => {
    setCurrentItem(item);
    setCurrentType(type);
    setIsDeleteDialogOpen(true);
  };
  
  const resetFormState = () => {
    setCurrentItem(null);
    setFormData({ name: '', email: '', password: '', registration_number: '', department: '' });
    setIsAddDialogOpen(false);
    setIsDeleteDialogOpen(false);
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
    
    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "Error",
        description: "Valid email is required",
        variant: "destructive"
      });
      return;
    }

    if (!currentItem && (!formData.password || formData.password.length < 6)) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    // Validate specific fields based on type
    if (currentType === 'student' && !currentItem && !formData.registration_number.trim()) {
      toast({
        title: "Error",
        description: "Registration number is required for students",
        variant: "destructive"
      });
      return;
    }

    if (currentType === 'staff' && !formData.department.trim()) {
      toast({
        title: "Error",
        description: "Department is required for staff",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (currentItem) {
        // Update existing user
        const updateData: any = {
          name: formData.name,
          email: formData.email
        };

        if (currentType === 'student' && formData.registration_number) {
          updateData.registration_number = formData.registration_number;
        }

        if (currentType === 'staff' && formData.department) {
          updateData.department = formData.department;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', currentItem.id);
          
        if (error) {
          toast({
            title: "Error",
            description: `Failed to update ${currentType}. ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Updated`,
          description: `${formData.name}'s profile has been updated.`,
        });
      } else {
        // Create new user - Direct profile creation for Super Admin
        const newUserId = generateUserId();
        
        const profileData: any = {
          id: newUserId,
          name: formData.name,
          email: formData.email,
          role: currentType,
          created_at: new Date().toISOString()
        };

        if (currentType === 'student' && formData.registration_number) {
          profileData.registration_number = formData.registration_number;
        }

        if (currentType === 'staff' && formData.department) {
          profileData.department = formData.department;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);
          
        if (profileError) {
          toast({
            title: "Error",
            description: `Failed to create ${currentType} profile. ${profileError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // If creating a student, also create a student record
        if (currentType === 'student') {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: newUserId,
              resume_status: 'pending'
            });
            
          if (studentError) {
            console.error('Error creating student record:', studentError);
          }
        }
        
        toast({
          title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Created`,
          description: `${formData.name} has been added as a ${currentType}.`,
        });
      }
      
      resetFormState();
      fetchAllData();
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const confirmDelete = async () => {
    if (!currentItem) return;
    
    try {
      // Delete related records first
      if (currentType === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('user_id', currentItem.id);
          
        if (studentError) {
          console.error('Error deleting student record:', studentError);
        }
      }
      
      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentItem.id);
        
      if (profileError) {
        toast({
          title: "Error",
          description: `Failed to delete ${currentType} profile. ${profileError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: `${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Deleted`,
        description: `${currentItem.name} has been removed.`,
        variant: "destructive"
      });
      
      resetFormState();
      fetchAllData();
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Render table component
  const renderTable = (
    data: any[], 
    filteredData: any[], 
    searchTerm: string, 
    setSearchTerm: (term: string) => void,
    type: 'admin' | 'student' | 'staff',
    title: string
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={() => handleAdd(type)} variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}s by name, email${type === 'student' ? ', or registration number' : type === 'staff' ? ', or department' : ''}...`}
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
        ) : filteredData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? `No ${type}s found matching your search.` : `No ${type}s found. Add some!`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  {type === 'student' && <TableHead>Registration Number</TableHead>}
                  {type === 'staff' && <TableHead>Department</TableHead>}
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    {type === 'student' && <TableCell>{item.registration_number || 'N/A'}</TableCell>}
                    {type === 'staff' && <TableCell>{item.department || 'N/A'}</TableCell>}
                    <TableCell>{item.created_at ? formatDate(item.created_at) : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(item, type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(item, type)}
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
    </Card>
  );

  return (
    <div className="panel-container">
      <NavBar title="Campus Recruitment - Super Admin Panel" />
      
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                  <CardDescription>
                    Key metrics and platform analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SuperAdminDashboard />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="admins">
              {renderTable(adminUsers, filteredAdmins, adminSearchTerm, setAdminSearchTerm, 'admin', 'Admin Users')}
            </TabsContent>

            <TabsContent value="students">
              {renderTable(students, filteredStudents, studentSearchTerm, setStudentSearchTerm, 'student', 'Student Users')}
            </TabsContent>

            <TabsContent value="staff">
              {renderTable(staffMembers, filteredStaff, staffSearchTerm, setStaffSearchTerm, 'staff', 'Staff Users')}
            </TabsContent>
            
            <TabsContent value="companies">
              <CompanyManager />
            </TabsContent>
            
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>
                    Access the full system functionality below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentItem ? `Edit ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}` : `Add New ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}`}
              </DialogTitle>
              <DialogDescription>
                {currentItem 
                  ? `Update ${currentType} information`
                  : `Enter the details for the new ${currentType}`}
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
                    placeholder={`Enter ${currentType} name`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder={`Enter ${currentType} email`}
                    required
                  />
                </div>

                {currentType === 'student' && (
                  <div>
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input 
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                      placeholder="Enter registration number"
                      required={!currentItem}
                    />
                  </div>
                )}

                {currentType === 'staff' && (
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Enter department"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="password">
                    {currentItem ? "Password (leave blank to keep current)" : "Password"}
                  </Label>
                  <Input 
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={currentItem ? "••••••••" : "Enter password"}
                    required={!currentItem}
                  />
                  {!currentItem && (
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
                  {currentItem ? 'Update' : 'Add'}
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
                Are you sure you want to delete {currentType} {currentItem?.name}? This action cannot be undone.
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
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
