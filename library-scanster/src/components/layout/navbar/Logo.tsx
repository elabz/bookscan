
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export const Logo = () => {
  return (
    <Link 
      to="/" 
      className="flex items-center space-x-2 text-primary font-display font-bold text-xl"
    >
      <BookOpen className="h-6 w-6" />
      <span className="animate-fade-in">AllMyBooks</span>
    </Link>
  );
};
