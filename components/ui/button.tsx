import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button component variants using class-variance-authority (CVA)
 * This creates a type-safe way to manage different button styles and sizes
 * 
 * Includes:
 * - Base styles: positioning, transitions, focus states
 * - Variant styles: different visual appearances
 * - Size options: different dimensions and padding
 * - Accessibility: focus rings, disabled states
 */
const buttonVariants = cva(
    // Base styles applied to all buttons
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
    {
        variants: {
            // Visual style variants
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90", // Primary blue button
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", // Red danger button
                outline: "border border-input bg-card hover:bg-muted/60 hover:text-foreground shadow-sm", // Outlined button
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm", // Secondary gray button
                ghost: "shadow-none hover:bg-accent hover:text-accent-foreground", // Transparent with hover effect
                link: "shadow-none text-primary underline-offset-4 hover:underline", // Text link style
            },
            // Size variants
            size: {
                default: "h-10 px-4 py-2", // Standard size
                sm: "h-9 rounded-md px-3", // Small size
                lg: "h-11 rounded-md px-8", // Large size
                icon: "h-10 w-10", // Square for icon-only buttons
            },
        },
        // Default values when no variant/size specified
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

/**
 * Button component props interface
 * Extends standard HTML button attributes and adds our custom variants
 * 
 * @param asChild - When true, renders as a Slot component (useful for Next.js Link)
 * @param variant - Visual style variant
 * @param size - Size variant
 */
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

/**
 * Reusable Button component built on shadcn/ui principles
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, outline, etc.)
 * - Different sizes (sm, default, lg, icon)
 * - Accessibility features (focus rings, disabled states)
 * - Flexible rendering (can render as child component with asChild)
 * - Type-safe props with TypeScript
 * 
 * @example
 * ```tsx
 * <Button variant="default" size="sm">Click me</Button>
 * <Button variant="outline" size="lg">Outline button</Button>
 * <Button asChild>
 *   <Link href="/page">Link as button</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // Use Slot for composition or standard button element
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
