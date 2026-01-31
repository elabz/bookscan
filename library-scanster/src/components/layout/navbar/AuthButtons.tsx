
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthButtons = () => {
  const navigate = useNavigate();

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
        <LogIn className="mr-2 h-4 w-4" /> Log In
      </Button>
      <Button size="sm" variant="default" onClick={() => navigate('/signup')}>
        <UserPlus className="mr-2 h-4 w-4" /> Sign Up
      </Button>
    </>
  );
};
