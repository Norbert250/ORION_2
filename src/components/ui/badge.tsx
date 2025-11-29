import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-base border px-3 py-1 text-small font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border-neutral-border bg-neutral-light text-primary hover:bg-neutral-border",
        destructive:
          "border-accent-red/20 bg-accent-red/10 text-accent-red hover:bg-accent-red/20",
        outline: "border-neutral-border text-primary hover:bg-neutral-light",
        success:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        warning:
          "border-light-blue/20 bg-light-blue/10 text-light-blue hover:bg-light-blue/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }