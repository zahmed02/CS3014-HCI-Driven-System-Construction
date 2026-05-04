import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] hover:shadow-lg focus-visible:outline-primary',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] hover:shadow-red-500/50 hover:shadow-lg focus-visible:outline-red-600',
        success:
          'bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] hover:shadow-green-500/50 hover:shadow-lg focus-visible:outline-green-600',
        outline:
          'border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-500 hover:shadow-md',
        ghost:
          'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-sm',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };