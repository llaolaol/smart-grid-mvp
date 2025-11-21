/**
 * Loading Skeleton Component
 * 骨架屏组件 - 提供优雅的加载状态反馈
 */

import { Card, Skeleton, Space } from 'antd';

interface LoadingSkeletonProps {
  type?: 'table' | 'detail' | 'card' | 'list';
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  rows = 3,
}) => {
  if (type === 'table') {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (type === 'detail') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </Space>
    );
  }

  if (type === 'list') {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Card key={index} size="small">
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </Space>
    );
  }

  // Default: card
  return (
    <Card>
      <Skeleton active paragraph={{ rows }} />
    </Card>
  );
};

export default LoadingSkeleton;
