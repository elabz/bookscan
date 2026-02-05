
import { Link as LinkIcon } from 'lucide-react';
import { Link } from '@/types/book';
import { MetadataItem } from './MetadataItem';

interface LinksItemProps {
  links: Link[];
}

const isSafeUrl = (url: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

export const LinksItem = ({ links }: LinksItemProps) => {
  if (!links || links.length === 0) return null;

  const safeLinks = links.filter(link => isSafeUrl(link.url));
  if (safeLinks.length === 0) return null;

  return (
    <MetadataItem icon={LinkIcon} label="Links" className="col-span-2">
      <div className="flex flex-wrap gap-2 mt-1">
        {safeLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            {link.title}
          </a>
        ))}
      </div>
    </MetadataItem>
  );
};
