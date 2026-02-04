import React from 'react';
import { Pencil, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  type?: 'text' | 'textarea' | 'number';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  id,
  label,
  value,
  onChange,
  isLocked,
  onToggleLock,
  type = 'text',
  placeholder,
  className,
  inputClassName,
}) => {
  const hasValue = value.trim().length > 0;

  // If locked with no value, auto-unlock for editing
  const effectivelyLocked = isLocked && hasValue;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={effectivelyLocked}
          className={cn(
            "min-h-[80px] resize-y",
            effectivelyLocked && "bg-muted/50 cursor-default",
            inputClassName
          )}
        />
      );
    }

    return (
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={effectivelyLocked}
        className={cn(
          effectivelyLocked && "bg-muted/50 cursor-default",
          inputClassName
        )}
      />
    );
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-muted-foreground"
        >
          {label}
        </label>
        {hasValue && (
          <button
            type="button"
            onClick={onToggleLock}
            className={cn(
              "p-1 rounded-md transition-colors",
              effectivelyLocked
                ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                : "text-primary hover:bg-primary/10"
            )}
            title={effectivelyLocked ? "Click to edit" : "Field is editable"}
          >
            {effectivelyLocked ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 opacity-50" />
            )}
          </button>
        )}
      </div>
      {renderInput()}
    </div>
  );
};
