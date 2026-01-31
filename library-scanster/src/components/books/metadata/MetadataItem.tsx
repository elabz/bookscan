
import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetadataItemProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}

export const MetadataItem = ({ icon: Icon, label, children, className = '' }: MetadataItemProps) => {
  return (
    <div className={`flex items-start ${className}`}>
      <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
};
