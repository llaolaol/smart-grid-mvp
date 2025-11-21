/**
 * Empty State Component
 * 空状态组件 - 提供友好的空数据提示
 */

import { Empty, Button } from 'antd';
import { InboxOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  type?: 'no-data' | 'no-device' | 'no-result' | 'error';
  title?: string;
  description?: string;
  showAction?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  showAction = true,
  actionText,
  onAction,
}) => {
  const configs = {
    'no-data': {
      image: Empty.PRESENTED_IMAGE_SIMPLE,
      defaultTitle: '暂无数据',
      defaultDescription: '当前没有可显示的数据',
      defaultActionText: '刷新数据',
      icon: <ReloadOutlined />,
    },
    'no-device': {
      image: Empty.PRESENTED_IMAGE_DEFAULT,
      defaultTitle: '暂无设备',
      defaultDescription: '当前场景下没有设备，请选择其他场景或添加设备',
      defaultActionText: '添加设备',
      icon: <PlusOutlined />,
    },
    'no-result': {
      image: Empty.PRESENTED_IMAGE_SIMPLE,
      defaultTitle: '无搜索结果',
      defaultDescription: '未找到符合条件的数据，请调整筛选条件',
      defaultActionText: '重置筛选',
      icon: <ReloadOutlined />,
    },
    'error': {
      image: Empty.PRESENTED_IMAGE_DEFAULT,
      defaultTitle: '加载失败',
      defaultDescription: '数据加载出现问题，请稍后重试',
      defaultActionText: '重新加载',
      icon: <ReloadOutlined />,
    },
  };

  const config = configs[type];

  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <Empty
        image={config.image}
        imageStyle={{ height: 120 }}
        description={
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              {title || config.defaultTitle}
            </div>
            <div style={{ fontSize: 14, color: '#8c8c8c' }}>
              {description || config.defaultDescription}
            </div>
          </div>
        }
      >
        {showAction && onAction && (
          <Button
            type="primary"
            icon={config.icon}
            onClick={onAction}
          >
            {actionText || config.defaultActionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
