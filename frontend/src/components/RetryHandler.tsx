/**
 * Retry Handler Component
 * 重试处理组件 - 提供错误重试功能
 */

import { useState, useEffect } from 'react';
import { Alert, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface RetryHandlerProps {
  error: Error | null;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
  autoRetry?: boolean;
  retryDelay?: number;
}

export const RetryHandler: React.FC<RetryHandlerProps> = ({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  autoRetry = false,
  retryDelay = 3000,
}) => {
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (autoRetry && error && retryCount < maxRetries && countdown === 0) {
      setCountdown(Math.floor(retryDelay / 1000));
    }
  }, [error, retryCount, maxRetries, autoRetry, retryDelay, countdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && autoRetry && error && retryCount < maxRetries) {
      onRetry();
    }
  }, [countdown, autoRetry, error, retryCount, maxRetries, onRetry]);

  if (!error) return null;

  const canRetry = retryCount < maxRetries;

  return (
    <div style={{ padding: '20px 0' }}>
      <Alert
        message="加载失败"
        description={
          <Space direction="vertical" size="small">
            <div>{error.message || '数据加载出现问题，请稍后重试'}</div>
            {retryCount > 0 && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                已重试 {retryCount} 次
              </div>
            )}
            {autoRetry && countdown > 0 && canRetry && (
              <div style={{ fontSize: 12, color: '#1890ff' }}>
                {countdown} 秒后自动重试...
              </div>
            )}
          </Space>
        }
        type="error"
        showIcon
        action={
          canRetry ? (
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRetry}
              loading={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : '重试'}
            </Button>
          ) : (
            <Button size="small" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          )
        }
      />
    </div>
  );
};

export default RetryHandler;
