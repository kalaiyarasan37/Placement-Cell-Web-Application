
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from '../contexts/AuthContext';
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("admin");
  
  const { login } = useAuth();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with:', { email, password });
      
      // Check if super admin login attempt but with wrong credentials
      if ((email === 'blue67388@gmail.com' && password !== 'superadmin@123') ||
          (email !== 'blue67388@gmail.com' && password === 'superadmin@123')) {
        throw new Error("Invalid super admin credentials. Please try again.");
      }
      
      await login(email, password);
      // Login success handling is done in the AuthContext
      toast({
        title: "Login Successful",
        description: "Welcome to the Campus Recruitment Portal",
      });
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login. Please try again.");
      toast({
        title: "Login Failed",
        description: err.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set demo credentials when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "admin") {
      setEmail('achu73220@gmail.com');
      setPassword('12345678');
    } else if (value === "staff") {
      setEmail('staff@example.com');
      setPassword('staff123');
    } else if (value === "student") {
      setEmail('student@example.com');
      setPassword('student123');
    } else if (value === "superadmin") {
      setEmail('blue67388@gmail.com');
      setPassword('superadmin@123');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-recruitment-700 to-recruitment-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Placement Cell</CardTitle>
          <CardDescription className="text-center font-semibold">
            Login to access your recruitment portal account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="admin" value={activeTab} onValueChange={handleTabChange} className="mb-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="superadmin">Super Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-recruitment-600 hover:bg-recruitment-700"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground text-center w-full">
            {activeTab === "admin" && "Admin credentials: achu73220@gmail.com / 12345678"}
            {activeTab === "staff" && "Demo credentials: staff@example.com / staff123"}
            {activeTab === "student" && "Demo credentials: student@example.com / student123"}
            {activeTab === "superadmin" && "Super Admin credentials: blue67388@gmail.com / superadmin@123"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
