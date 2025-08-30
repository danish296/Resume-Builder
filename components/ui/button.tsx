import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border/40 dark:border-border/30", // ensure border space is always reserved and add a base 1px keyline
  {
    variants: {
      variant: {
        // Filled buttons now have subtle borders so they don't visually "melt" into backgrounds
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30 dark:border-primary/40",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive/30 dark:border-destructive/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary/40 dark:border-secondary/30",
        // Outline keeps clear separation in both themes
        outline: "border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Ghost gets a very light keyline to avoid blending with the page
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground border-border/40 dark:border-border/30",
        // Link remains borderless to behave like text
        link: "border-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
