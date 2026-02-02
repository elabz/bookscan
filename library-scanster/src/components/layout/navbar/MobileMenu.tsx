
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, LogOut, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from './NavLink';
import { SearchBar } from './SearchBar';

interface MobileMenuProps {
  isSignedIn: boolean;
  userEmail: string | null;
  signOut: () => Promise<{ success?: boolean; error?: any }>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

export const MobileMenu = ({ 
  isSignedIn, 
  userEmail, 
  signOut, 
  isOpen, 
  setIsOpen,
  searchQuery,
  setSearchQuery,
  handleSearch
}: MobileMenuProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 shadow-lg animate-slide-down py-4 px-6">
      {isSignedIn ? (
        <>
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            className="mb-4"
          />
          
          <nav className="flex flex-col space-y-4">
            <NavLink to="/library" onClick={() => setIsOpen(false)}>
              My Library
            </NavLink>
            <NavLink to="/discover" onClick={() => setIsOpen(false)}>
              Discover
            </NavLink>
            <Button size="sm" variant="default" className="w-full" onClick={() => {
              navigate('/books/add');
              setIsOpen(false);
            }}>
              <Scan className="h-4 w-4 mr-1" />
              Add / Scan
            </Button>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col space-y-4">
          <NavLink to="/" onClick={() => setIsOpen(false)}>
            Discover
          </NavLink>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                navigate('/login');
                setIsOpen(false);
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="w-full"
              onClick={() => {
                navigate('/signup');
                setIsOpen(false);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};
