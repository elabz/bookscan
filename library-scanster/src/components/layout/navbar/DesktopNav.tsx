
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from './NavLink';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { AuthButtons } from './AuthButtons';

interface DesktopNavProps {
  isSignedIn: boolean;
  userEmail: string | null;
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isAdmin?: boolean;
}

export const DesktopNav = ({ 
  isSignedIn,
  userEmail,
  signOut,
  searchQuery,
  setSearchQuery,
  handleSearch,
  isAdmin,
}: DesktopNavProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        {isSignedIn ? (
          <>
            <NavLink to="/library">
              My Library
            </NavLink>
            <NavLink to="/discover">
              Discover
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin">
                Admin
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink to="/">
              Discover
            </NavLink>
          </>
        )}
      </nav>
      
      {/* Search and Actions */}
      <div className="hidden md:flex items-center gap-4">
        {isSignedIn ? (
          <>
            <SearchBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              className="w-64"
            />
            <Button size="sm" variant="default" onClick={() => navigate('/books/add')}>
              <Scan className="h-4 w-4 mr-1" />
              Add / Scan
            </Button>
            <UserMenu userEmail={userEmail} signOut={signOut} />
          </>
        ) : (
          <AuthButtons />
        )}
      </div>
    </>
  );
};
