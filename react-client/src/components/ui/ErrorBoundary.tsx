"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onCatch?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info);
    this.props.onCatch?.(error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex w-full items-center justify-between border-b border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
          <div className="flex items-center gap-2">
            <svg
              className="size-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
            <span>An issue occurred rendering this product entry.</span>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-[6px] border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
