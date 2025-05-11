
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavBarProps {
  title: string;
}

const NavBar: React.FC<NavBarProps> = ({ title }) => {
  const { currentUser, logout, userRole } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  // Get the user's display name - from either user_metadata.name, email, or fallback
  const getDisplayName = () => {
    if (!currentUser) return "User";
    
    // For demo users with user_metadata.name
    if (currentUser.user_metadata?.name) {
      return currentUser.user_metadata.name;
    }
    
    // Use email if available
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    
    // Fallback
    return "User";
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-recruitment-800 text-white">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-white hover:bg-recruitment-700">
            <User className="h-4 w-4 mr-2" />
            {getDisplayName()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="h-4 w-4 mr-2" />
            {userRole && <span className="capitalize">{userRole}</span>}
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default NavBar;
