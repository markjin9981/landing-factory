import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });

        // Auto-reload on Chunk Load Error
        // This usually happens when a new version is deployed and the browser tries to fetch old chunks.
        if (
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Importing a module script failed')
        ) {
            const storageKey = 'reload_on_chunk_error';
            const hasReloaded = sessionStorage.getItem(storageKey);

            if (!hasReloaded) {
                console.log('Chunk load error detected. Reloading page...');
                sessionStorage.setItem(storageKey, 'true');
                window.location.reload();
            } else {
                // Already reloaded once and failed again? Clean up so we don't loop forever,
                // but show the error UI.
                sessionStorage.removeItem(storageKey);
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h1 style={{ color: '#e11d48' }}>Something went wrong.</h1>
                    <p style={{ color: '#4b5563' }}>Application crashed. Please check the console for details.</p>
                    {this.state.error && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.5rem',
                            textAlign: 'left',
                            overflowX: 'auto',
                            maxWidth: '800px',
                            margin: '1rem auto'
                        }}>
                            <p style={{ fontWeight: 'bold', color: '#dc2626' }}>{this.state.error.toString()}</p>
                            {this.state.errorInfo && (
                                <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
