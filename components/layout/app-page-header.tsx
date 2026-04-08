import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppPageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Extra controls shown beside the title block (e.g. schedule date navigation). */
  toolbar?: ReactNode;
  /** Right-aligned actions (e.g. primary buttons). */
  actions?: ReactNode;
  /** `module`: full-width app section with bottom rule. `minimal`: title stack only (e.g. auth card). */
  variant?: "module" | "minimal";
  className?: string;
};

/**
 * Consistent page title region for authenticated modules and optional auth surfaces.
 * Matches docs/highLevelDesign typography and spacing (4px scale, clear hierarchy).
 */
export function AppPageHeader({
  title,
  description,
  toolbar,
  actions,
  variant = "module",
  className,
}: AppPageHeaderProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("space-y-2", className)}>
        <h1 className="ergon-page-title">{title}</h1>
        {description != null && (
          <div className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </div>
        )}
      </div>
    );
  }

  return (
    <header className={cn("border-b border-border pb-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 space-y-2">
            <h1 className="ergon-page-title">{title}</h1>
            {description != null && (
              <div className="ergon-muted">{description}</div>
            )}
          </div>
          {toolbar ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {toolbar}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-0.5">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
