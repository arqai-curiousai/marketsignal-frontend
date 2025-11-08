// import React, { forwardRef } from 'react';
// import { cva, type VariantProps } from 'class-variance-authority';
// import { cn } from '@/lib/utils/cn';

// const inputVariants = cva(
//   'flex w-full rounded-xl border bg-transparent px-3 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-purple-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
//   {
//     variants: {
//       variant: {
//         default: 'border-purple-700/50 bg-purple-950/30 backdrop-blur-sm text-purple-100 focus-visible:border-purple-500 focus-visible:ring-purple-500/20',
//         ghost: 'border-transparent bg-purple-900/20 hover:bg-purple-900/30 focus-visible:bg-purple-900/40',
//         outline: 'border-purple-500/50 bg-transparent hover:border-purple-400 focus-visible:border-purple-400',
//       },
//       size: {
//         default: 'h-10 px-3',
//         sm: 'h-9 px-2 text-xs',
//         lg: 'h-11 px-4',
//       },
//     },
//     defaultVariants: {
//       variant: 'default',
//       size: 'default',
//     },
//   }
// );

// export interface InputProps
//   extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
//     VariantProps<typeof inputVariants> {
//   label?: string;
//   error?: string;
//   helperText?: string;
// }

// const Input = forwardRef<HTMLInputElement, InputProps>(
//   ({ className, variant, size, label, error, helperText, id, ...props }, ref) => {
//     const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

//     return (
//       <div className="space-y-1">
//         {label && (
//           <label
//             htmlFor={inputId}
//             className="text-sm font-medium text-purple-200"
//           >
//             {label}
//           </label>
//         )}
//         <input
//           id={inputId}
//           className={cn(
//             inputVariants({ variant, size }),
//             error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
//             className
//           )}
//           ref={ref}
//           {...props}
//         />
//         {error && (
//           <p className="text-sm text-red-400">{error}</p>
//         )}
//         {helperText && !error && (
//           <p className="text-sm text-purple-400/70">{helperText}</p>
//         )}
//       </div>
//     );
//   }
// );

// Input.displayName = 'Input';

// export { Input, inputVariants }; 

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  hint?: string;
  error?: string;
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

// if you have inputVariants, keep using them—omitted here for brevity
// import { inputVariants } from './input.variants';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, labelClassName, wrapperClassName, hint, error, className, variant = 'outline', size = 'md', ...props },
  ref
) {
  // ✅ stable across SSR/CSR
  const autoId = React.useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className={cn('block text-sm text-zinc-300', labelClassName)}>
          {label}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        // className={cn(
        //   // inputVariants({ variant, size }),
        //   'flex w-full rounded-xl border py-2 transition-all',
        //   className
        // )}

        className={cn(
          'flex w-full rounded-xl border border-purple-700/60 bg-purple-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
});
