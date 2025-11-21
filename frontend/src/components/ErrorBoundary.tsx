/**
 * Error Boundary Component
 * 错误边界组件 - 捕获组件错误，防止应用崩溃
 */

import { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '40px', minHeight: '400px' }}>
          <Result
            status="error"
            icon={<BugOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
            title="页面出现错误"
            subTitle={
              <div>
                <p>很抱歉，页面加载时遇到了问题。</p>
                {this.state.error && (
                  <details style={{ marginTop: 16, textAlign: 'left' }}>
                    <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                      查看错误详情
                    </summary>
                    <pre
                      style={{
                        marginTop: 8,
                        padding: 12,
                        background: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        fontSize: 12,
                        overflow: 'auto',
                        maxHeight: 300,
                      }}
                    >
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
              >
                刷新页面
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
