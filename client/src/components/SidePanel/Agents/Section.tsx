import { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '~/utils';

interface SectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  rightSlot?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export default function Section({
  title,
  description,
  icon,
  badge,
  rightSlot,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  contentClassName,
  children,
}: SectionProps) {
  const reactId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const contentId = `section-${reactId}`;

  return (
    <section className={cn('mb-2 rounded-xl border border-border-light bg-transparent', className)}>
      <header className="flex items-center gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 text-text-tertiary transition-transform motion-reduce:transition-none',
              !open && '-rotate-90',
            )}
            style={{
              transitionDuration: 'var(--resize-dur)',
              transitionTimingFunction: 'var(--resize-ease)',
            }}
            aria-hidden="true"
          />
          {icon && (
            <span className="flex h-4 w-4 items-center justify-center text-text-secondary">
              {icon}
            </span>
          )}
          <span className="truncate text-sm font-medium text-text-primary">{title}</span>
          {badge}
        </button>
        {rightSlot && <div className="flex items-center gap-1">{rightSlot}</div>}
      </header>
      <div
        id={contentId}
        role="region"
        aria-hidden={!open}
        className="grid transition-[grid-template-rows,opacity] motion-reduce:transition-none"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transitionDuration: 'var(--resize-dur)',
          transitionTimingFunction: 'var(--resize-ease)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn('px-3 pb-2.5 pt-0.5', contentClassName)}>
            {description && <p className="mb-2 text-xs text-text-secondary">{description}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
