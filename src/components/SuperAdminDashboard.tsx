
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Dashboard component for Super Admin panel
const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [userStats, setUserStats] = useState({
    students: 0,
    staff: 0,
    admins: 0,
    companies: 0
  });
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up a real-time listener for profile changes
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        console.log('Profile data changed, refreshing stats');
        fetchDashboardStats();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user counts by role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role');
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        toast({
          title: "Error",
          description: "Failed to fetch user statistics",
          variant: "destructive"
        });
        return;
      }
      
      // Count users by role
      const stats = {
        students: 0,
        staff: 0,
        admins: 0,
        companies: 0
      };
      
      profileData?.forEach(profile => {
        if (profile.role === 'student') stats.students++;
        else if (profile.role === 'staff') stats.staff++;
        else if (profile.role === 'admin') stats.admins++;
      });
      
      // Fetch company count
      const { count: companyCount, error: companyError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      if (!companyError && companyCount !== null) {
        stats.companies = companyCount;
      }
      
      setUserStats(stats);
      
      // Generate mock activity data (this would be real data in a production app)
      const mockActivityData = [
        { name: 'Mon', logins: 4, registrations: 2 },
        { name: 'Tue', logins: 7, registrations: 3 },
        { name: 'Wed', logins: 5, registrations: 4 },
        { name: 'Thu', logins: 8, registrations: 6 },
        { name: 'Fri', logins: 12, registrations: 8 },
        { name: 'Sat', logins: 6, registrations: 5 },
        { name: 'Sun', logins: 3, registrations: 1 }
      ];
      
      setActivityData(mockActivityData);
      
    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format data for the pie chart
  const pieData = [
    { name: 'Students', value: userStats.students },
    { name: 'Staff', value: userStats.staff },
    { name: 'Admins', value: userStats.admins }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {isLoading ? (
        <div className="col-span-2 text-center py-8">Loading dashboard data...</div>
      ) : (
        <>
          {/* User Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>
                Breakdown of users by role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>
                System activity over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer
                  config={{
                    logins: {
                      label: "Logins",
                      color: "#2563eb"
                    },
                    registrations: {
                      label: "New Registrations",
                      color: "#16a34a"
                    }
                  }}
                >
                  <BarChart data={activityData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="logins" fill="var(--color-logins)" />
                    <Bar dataKey="registrations" fill="var(--color-registrations)" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>
                Current system statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-medium">Students</h3>
                  <p className="text-3xl font-bold">{userStats.students}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-medium">Staff</h3>
                  <p className="text-3xl font-bold">{userStats.staff}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-medium">Admins</h3>
                  <p className="text-3xl font-bold">{userStats.admins}</p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-medium">Companies</h3>
                  <p className="text-3xl font-bold">{userStats.companies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
