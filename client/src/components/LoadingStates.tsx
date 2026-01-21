import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Comprehensive Loading State Components
 *
 * Provides skeleton screens for all major data loading scenarios.
 * Implements accessibility best practices with ARIA labels and live regions.
 */

interface LoadingStateProps {
  className?: string;
  count?: number;
}

export function GameCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4", className)} aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-24 h-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right space-y-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)} role="status" aria-label="Loading dashboard">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="w-6 h-6 rounded" />
                    <div className="space-y-2 min-w-0">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard data...</span>
    </div>
  );
}

export function LeadCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)} aria-busy="true">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}

export function LeadsGridSkeleton({ count = 9, className }: LoadingStateProps) {
  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}
      role="status"
      aria-label="Loading leads"
    >
      {Array.from({ length: count }).map((_, i) => (
        <LeadCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading leads data...</span>
    </div>
  );
}

export function SearchResultSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4 cursor-pointer", className)} aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="w-20 h-8 rounded-md" />
      </div>
    </Card>
  );
}

export function SearchResultsSkeleton({ count = 5, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading search results">
      {Array.from({ length: count }).map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
      <span className="sr-only">Loading search results...</span>
    </div>
  );
}

export function TableSkeleton({ rows = 10, cols = 5, className }: LoadingStateProps & { cols?: number }) {
  return (
    <div className={cn("rounded-md border", className)} role="status" aria-label="Loading table">
      <div className="p-4 border-b">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

export function DetailsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} role="status" aria-label="Loading details">
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <span className="sr-only">Loading details...</span>
    </div>
  );
}

export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin mx-auto"
            style={{ animationDuration: '1s', animationDirection: 'reverse' }}
          />
        </div>
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
}

export function InlineLoader({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div className="flex items-center gap-3" role="status" aria-label={message || 'Loading'}>
      <div className={cn(
        "border-primary/20 border-t-primary rounded-full animate-spin",
        sizeClasses[size]
      )} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <span className="sr-only">{message || 'Loading'}</span>
    </div>
  );
}

export function ButtonLoader() {
  return (
    <div
      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
