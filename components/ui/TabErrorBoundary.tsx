'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName?: string;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Inline error boundary for analytics tab content.
 * Catches rendering errors within a single tab so other tabs remain functional.
 */
export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[TabErrorBoundary] ${this.props.tabName ?? 'Tab'} crashed:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <div className="p-4 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {this.props.tabName ? `${this.props.tabName} failed to load` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            An error occurred while rendering this section. Other tabs are unaffected.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleReset}
            className="text-muted-foreground hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
