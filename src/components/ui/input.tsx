import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-background/80 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm md:h-10 backdrop-blur-sm transition-all duration-200",
          // Default padding that can be overridden
          !className?.includes('pl-') && !className?.includes('px-') && 'pl-4',
          !className?.includes('pr-') && !className?.includes('px-') && 'pr-4',
          className
        )}
        ref={ref}
        onFocus={onFocus}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
