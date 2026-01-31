
import { Hash } from 'lucide-react';
import { MetadataItem } from './MetadataItem';

interface IdentifierItemProps {
  identifier: string;
  label?: string;
}

export const IdentifierItem = ({ identifier, label = 'ISBN' }: IdentifierItemProps) => {
  if (!identifier) return null;
  
  return (
    <MetadataItem icon={Hash} label={label}>
      <div className="font-medium break-all">{identifier}</div>
    </MetadataItem>
  );
};
