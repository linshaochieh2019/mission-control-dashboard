import { ReactNode } from 'react'

interface BaseStateProps {
  message: string
  className?: string
}

interface ErrorStateProps extends BaseStateProps {
  onRetry?: () => void
  retryLabel?: string
}

export function LoadingState({ message, className }: BaseStateProps) {
  return <div className={className}>{message}</div>
}

export function EmptyState({ message, className }: BaseStateProps) {
  return <div className={className}>{message}</div>
}

export function ErrorState({ message, className, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="muted">{message}</div>
      {onRetry && (
        <button className="nav-btn" onClick={onRetry} style={{ marginTop: 8 }}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

interface ResourceStateProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
  loadingMessage: string
  errorMessage: (error: string) => string
  emptyMessage: string
  onRetry?: () => void
  loadingClassName?: string
  errorClassName?: string
  emptyClassName?: string
  children: ReactNode
}

export function ResourceState({
  loading,
  error,
  isEmpty,
  loadingMessage,
  errorMessage,
  emptyMessage,
  onRetry,
  loadingClassName,
  errorClassName,
  emptyClassName,
  children,
}: ResourceStateProps) {
  if (loading) {
    return <LoadingState message={loadingMessage} className={loadingClassName} />
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} className={errorClassName} onRetry={onRetry} />
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} className={emptyClassName} />
  }

  return <>{children}</>
}
