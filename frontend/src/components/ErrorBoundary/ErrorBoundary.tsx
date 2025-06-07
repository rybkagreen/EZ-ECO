import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo
        });

        // Отправляем ошибку в callback если он предоставлен
        this.props.onError?.(error, errorInfo);

        // Логирование ошибки
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Если предоставлен custom fallback, используем его
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Стандартный fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">⚠️</div>
                        <h2>Что-то пошло не так</h2>
                        <p>Произошла неожиданная ошибка в приложении.</p>
                        
                        <div className="error-actions">
                            <button 
                                className="retry-button"
                                onClick={this.handleRetry}
                            >
                                Попробовать снова
                            </button>
                            <button 
                                className="reload-button"
                                onClick={() => window.location.reload()}
                            >
                                Перезагрузить страницу
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Детали ошибки (только для разработки)</summary>
                                <pre className="error-stack">
                                    {this.state.error.stack}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre className="error-component-stack">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
