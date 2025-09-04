import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType: 'wallet' | 'postMessage' | 'serialization' | 'general';
}

class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorType: 'general' 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Classify error types for better handling
    let errorType: State['errorType'] = 'general';
    
    if (error.name === 'DataCloneError' || 
        error.message?.includes('postMessage') ||
        error.message?.includes('cloning')) {
      errorType = 'postMessage';
    } else if (error.message?.includes('serialization') ||
               error.message?.includes('JSON')) {
      errorType = 'serialization';
    } else if (error.message?.toLowerCase().includes('wallet') ||
               error.message?.includes('WalletConnect')) {
      errorType = 'wallet';
    }
    
    return { 
      hasError: true, 
      error,
      errorType 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WalletErrorBoundary caught an error:', error, errorInfo);
    this.setState({ 
      error, 
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { errorType, error } = this.state;
      
      // Customize error messages based on error type
      let title = "Wallet Connection Error";
      let description = "An unexpected error occurred with the wallet connection.";
      let suggestion = "Please try again or refresh the page.";
      
      switch (errorType) {
        case 'postMessage':
          title = "Browser Communication Error";
          description = "Failed to communicate with wallet due to browser security restrictions.";
          suggestion = "This usually resolves with a page refresh. Try disabling ad blockers if the issue persists.";
          break;
        case 'serialization':
          title = "Data Serialization Error";
          description = "Failed to process wallet data due to serialization issues.";
          suggestion = "Try refreshing the page or using a different browser.";
          break;
        case 'wallet':
          title = "Wallet Connection Failed";
          description = "Unable to establish connection with your wallet.";
          suggestion = "Ensure your wallet is unlocked and try connecting again.";
          break;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-red-800">{title}</h4>
                    <p className="text-sm text-red-700 mt-1">{description}</p>
                  </div>
                  
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    <strong>Suggestion:</strong> {suggestion}
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Debug Details
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded font-mono text-xs">
                        <div><strong>Error:</strong> {error?.message}</div>
                        <div><strong>Type:</strong> {errorType}</div>
                        {error?.stack && (
                          <div className="mt-1">
                            <strong>Stack:</strong>
                            <pre className="whitespace-pre-wrap text-xs">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry} 
                variant="default"
                className="flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleRefresh} 
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;