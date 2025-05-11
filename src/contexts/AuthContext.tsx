
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCredentials: (email: string, password: string) => Promise<void>;
}

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
        return;
      }
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setUserRole(null);
    localStorage.removeItem('currentUser');
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
    } catch (error) {
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
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
