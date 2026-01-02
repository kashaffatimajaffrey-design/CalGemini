import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  /**
   * Children are optional to prevent issues with React versions that don't implicitly include them.
   */
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch and handle runtime errors gracefully.
 */
// Fix: Explicitly extend React.Component to ensure inheritance of setState, state, and props in TypeScript
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  // Updates state when an error is caught by the boundary.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Metabolic Crash Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.href = '/';
  };

  public render() {
    // Access state inherited via Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-[32px] flex items-center justify-center mb-8 border border-rose-500/50">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl font-black tracking-tightest leading-none">Metabolic Crash.</h1>
            <p className="text-slate-400 font-bold text-sm leading-relaxed">
              The AI encountered a synchronization error with your biology. Don't panic, your progress is likely safe.
            </p>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono text-rose-400 overflow-x-auto text-left whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown Protocol Error'}
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <button 
                // Fix: Correctly access setState inherited from the React.Component base class
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-4 bg-emerald-500 text-slate-950 rounded-[18px] font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all"
              >
                <RefreshCw className="w-4 h-4" /> REBOOT APP
              </button>
              <button 
                onClick={this.handleReset}
                className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-[18px] font-black text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> RETURN TO VAULT
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Correctly access props inherited from the React.Component base class
    return this.props.children || null;
  }
}