
import { User } from 'lucide-react';
import { MetadataItem } from './MetadataItem';

interface AuthorsItemProps {
  authors: string[];
}

export const AuthorsItem = ({ authors }: AuthorsItemProps) => {
  if (!authors || authors.length === 0) return null;
  
  return (
    <MetadataItem icon={User} label="Authors" className="col-span-2">
      <div className="font-medium">
        {authors.length === 1 ? (
          authors[0]
        ) : (
          <ul className="list-disc pl-5">
            {authors.map((author, idx) => (
              <li key={idx}>{author}</li>
            ))}
          </ul>
        )}
      </div>
    </MetadataItem>
  );
};
