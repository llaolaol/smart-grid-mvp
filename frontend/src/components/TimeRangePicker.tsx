/**
 * 时间范围选择器组件
 *
 * 提供快捷时间范围选项和自定义时间选择功能
 * 用于历史数据查询、趋势分析等需要时间范围筛选的场景
 */

import React from 'react';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { TimeRangeQuery } from '../types';

const { RangePicker } = DatePicker;

interface TimeRangePickerProps {
  value?: TimeRangeQuery;                      // 当前选中的时间范围
  onChange?: (value: TimeRangeQuery) => void;  // 时间范围变化回调
  showTime?: boolean;                          // 是否显示时间选择
  placeholder?: [string, string];              // 占位符文本
  disabled?: boolean;                          // 是否禁用
}

/**
 * 时间范围选择器组件
 *
 * @example
 * ```tsx
 * const [timeRange, setTimeRange] = useState<TimeRangeQuery>({});
 * <TimeRangePicker value={timeRange} onChange={setTimeRange} />
 * ```
 */
export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  showTime = true,
  placeholder = ['开始时间', '结束时间'],
  disabled = false,
}) => {
  /**
   * 处理时间范围变化
   * 将 dayjs 对象转换为 ISO 8601 格式的字符串
   */
  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      // 清空选择
      onChange?.({});
      return;
    }

    // 转换为 ISO 8601 格式
    onChange?.({
      start_time: dates[0].toISOString(),
      end_time: dates[1].toISOString(),
    });
  };

  /**
   * 将当前 value 转换为 dayjs 对象（用于回显）
   */
  const currentValue: [Dayjs, Dayjs] | null =
    value?.start_time && value?.end_time
      ? [dayjs(value.start_time), dayjs(value.end_time)]
      : null;

  return (
    <RangePicker
      value={currentValue}
      showTime={showTime}
      format={showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
      style={{ width: '100%' }}
      ranges={{
        '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
        '最近7天': [dayjs().subtract(7, 'days').startOf('day'), dayjs().endOf('day')],
        '最近30天': [dayjs().subtract(30, 'days').startOf('day'), dayjs().endOf('day')],
        '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
        '上月': [
          dayjs().subtract(1, 'month').startOf('month'),
          dayjs().subtract(1, 'month').endOf('month'),
        ],
      }}
    />
  );
};

export default TimeRangePicker;
