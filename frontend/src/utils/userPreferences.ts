/**
 * User Preferences Management
 * 用户偏好设置管理工具
 */

export interface UserPreferences {
  // 自动刷新设置
  autoRefresh: boolean;
  refreshInterval: number; // 秒

  // 默认场景
  defaultScenario: string | null;

  // 显示设置
  showCriticalDevicesOnly: boolean;
  defaultPageSize: number;

  // 图表设置
  enableAnimations: boolean;
  chartTheme: 'dark' | 'light';

  // 通知设置
  enableNotifications: boolean;
  notifyOnCritical: boolean;
}

const STORAGE_KEY = 'smart_grid_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  autoRefresh: false,
  refreshInterval: 30,
  defaultScenario: null,
  showCriticalDevicesOnly: false,
  defaultPageSize: 10,
  enableAnimations: true,
  chartTheme: 'dark',
  enableNotifications: true,
  notifyOnCritical: true,
};

/**
 * 获取用户偏好设置
 */
export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并默认值和存储值，确保新增字段有默认值
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
  return DEFAULT_PREFERENCES;
};

/**
 * 保存用户偏好设置
 */
export const saveUserPreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

/**
 * 更新部分用户偏好设置
 */
export const updateUserPreferences = (
  updates: Partial<UserPreferences>
): UserPreferences => {
  const current = getUserPreferences();
  const updated = { ...current, ...updates };
  saveUserPreferences(updated);
  return updated;
};

/**
 * 重置用户偏好设置为默认值
 */
export const resetUserPreferences = (): UserPreferences => {
  saveUserPreferences(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
};

/**
 * 获取特定偏好设置项
 */
export const getPreference = <K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] => {
  const preferences = getUserPreferences();
  return preferences[key];
};

/**
 * 设置特定偏好设置项
 */
export const setPreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void => {
  updateUserPreferences({ [key]: value } as Partial<UserPreferences>);
};

/**
 * 导出用户偏好设置（用于备份）
 */
export const exportPreferences = (): string => {
  const preferences = getUserPreferences();
  return JSON.stringify(preferences, null, 2);
};

/**
 * 导入用户偏好设置（用于恢复）
 */
export const importPreferences = (jsonString: string): boolean => {
  try {
    const preferences = JSON.parse(jsonString);
    // 验证数据结构
    if (typeof preferences === 'object' && preferences !== null) {
      saveUserPreferences({ ...DEFAULT_PREFERENCES, ...preferences });
      return true;
    }
  } catch (error) {
    console.error('Failed to import preferences:', error);
  }
  return false;
};
