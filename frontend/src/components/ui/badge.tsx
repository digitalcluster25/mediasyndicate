import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-gray-900 text-white',
    secondary: 'bg-gray-100 text-gray-700',
    outline: 'border border-gray-200 text-gray-700',
  };
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  );
}

export { Badge };
