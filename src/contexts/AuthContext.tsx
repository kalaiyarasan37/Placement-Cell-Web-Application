import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { demoCredentials } from '../data/demoCredentials';

// Define UserRole enum for better type safety
export enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCredentials: (email: string, password: string) => Promise<void>;
  isSuperAdmin: () => boolean;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        
        // Fetch user role after session changes (with setTimeout for safety)
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Error",
          description: "Could not fetch user role. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const isSuperAdmin = () => {
    return userRole === UserRole.SUPER_ADMIN || currentUser?.email === 'achu73220@gmail.com';
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check if the credentials match one of our demo users
      const demoUser = Object.values(demoCredentials).find(
        user => user.email === email && user.password === password
      );

      if (demoUser) {
        // Create a mock user and session for demo purposes
        const mockUser = {
          id: demoUser.id,
          email: demoUser.email,
          app_metadata: {},
          user_metadata: { name: demoUser.name },
          aud: "authenticated",
          created_at: new Date().toISOString()
        } as User;

        const mockSession = {
          access_token: "demo_access_token",
          refresh_token: "demo_refresh_token",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: mockUser
        } as unknown as Session;

        setCurrentUser(mockUser);
        setSession(mockSession);
        setUserRole(demoUser.role);

        toast({
          title: "Login successful",
          description: `Logged in as ${demoUser.role} using ${email === 'achu73220@gmail.com' ? 'real admin' : 'demo'} account.`,
        });
        return true;
      }

      // If not a demo user, proceed with real auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (data.session) {
        toast({
          title: "Login successful",
          description: "Redirecting to your dashboard...",
        });
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear our demo user session if it exists
      if (currentUser && Object.values(demoCredentials).some(demo => demo.id === currentUser.id)) {
        setCurrentUser(null);
        setSession(null);
        setUserRole(null);
        toast({
          title: "Logged out",
          description: "You have been successfully logged out from account.",
        });
        return;
      }

      // Otherwise use supabase logout
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
      setUserRole(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  const updateCredentials = async (email: string, password: string) => {
    try {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      
      if (emailError) {
        toast({
          title: "Failed to update email",
          description: emailError.message,
          variant: "destructive",
        });
        return;
      }
      
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        
        if (passwordError) {
          toast({
            title: "Failed to update password",
            description: passwordError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "Credentials updated",
        description: "Your account information has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating credentials:', error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        userRole,
        login,
        logout,
        updateCredentials,
        isSuperAdmin,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Export the useAuth hook that enforces context usage
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
