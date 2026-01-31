
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  to: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
}

export const NavLink = ({ to, onClick, children, icon: Icon }: NavLinkProps) => {
  return (
    <Link 
      to={to} 
      className="text-foreground/80 hover:text-primary font-medium flex items-center gap-1"
      onClick={onClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </Link>
  );
};
