import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResourceState } from './resourceStates'

describe('ResourceState', () => {
  const baseProps = {
    loadingMessage: 'Loading records…',
    errorMessage: (error: string) => `Failed: ${error}`,
    emptyMessage: 'No records available.',
    children: <div>Loaded content</div>,
  }

  it('renders loading state when loading is true', () => {
    render(<ResourceState {...baseProps} loading error={null} isEmpty={false} />)
    expect(screen.getByText('Loading records…')).toBeInTheDocument()
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
  })

  it('renders error state and retry action when error exists', () => {
    const onRetry = vi.fn()

    render(<ResourceState {...baseProps} loading={false} error="Network down" isEmpty={false} onRetry={onRetry} />)

    expect(screen.getByText('Failed: Network down')).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders empty state when empty and no loading/error', () => {
    render(<ResourceState {...baseProps} loading={false} error={null} isEmpty />)
    expect(screen.getByText('No records available.')).toBeInTheDocument()
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
  })

  it('renders children when data is available', () => {
    render(<ResourceState {...baseProps} loading={false} error={null} isEmpty={false} />)
    expect(screen.getByText('Loaded content')).toBeInTheDocument()
  })

  it('prioritizes loading over error and empty states', () => {
    render(<ResourceState {...baseProps} loading error="Some error" isEmpty />)

    expect(screen.getByText('Loading records…')).toBeInTheDocument()
    expect(screen.queryByText('Failed: Some error')).not.toBeInTheDocument()
    expect(screen.queryByText('No records available.')).not.toBeInTheDocument()
  })
})
