'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';
import { ColorTheme } from '@/lib/types';
import { THEMES } from '@/lib/themes';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  colorTheme?: ColorTheme;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, colorTheme = 'mint', indicatorClassName, ...props }, ref) => {
  const progressValue = value || 0;
  
  const theme = THEMES[colorTheme] || THEMES.mint;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out", indicatorClassName)}
        style={{ 
            transform: `translateX(-${100 - (progressValue || 0)}%)`,
            background: colorTheme ? theme.gradient : undefined,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
