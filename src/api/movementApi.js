import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为运动接口创建独立的axios实例
const movementAxiosInstance = axios.create({
  baseURL: API_CONFIG.MOVEMENT_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 运动接口的http方法
const movementHttp = {
  get: (url, params = {}, config = {}) => movementAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => movementAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => movementAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => movementAxiosInstance.delete(url, config),
};

export const movementApi = {
  // 获取所有可用的机器人动作列表
  getRobotActions: () => movementHttp.get('/robot/actions'),
  
  // 获取动作库列表（兼容性函数）
  getActionList: () => movementHttp.get('/robot/actions'),

  // 执行指定的机器人动作
  executeRobotAction: (actionName, params = {}) => {
    const payload = {
      action_name: actionName,
      duration: params.duration || 3.0,
      file_path: params.filePath || null,
      ...params
    }
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key]
      }
    })
    return movementHttp.post('/robot/execute', payload)
  },

  // 执行动作（兼容性函数）
  executeAction: (action) => {
    return movementHttp.post('/robot/execute', {
      action_name: action.name,
      duration: action.duration || 3.0,
      category: action.category
    })
  },

  // 机器人移动控制 - 更新为新的接口路径
  executeMovement: (direction) => {
    let endpoint = ''
    switch (direction) {
      case 'forward': endpoint = '/robot_movement/continuous_walk/forward'; break
      case 'backward': endpoint = '/robot_movement/continuous_walk/backward'; break
      case 'left-move': endpoint = '/robot_movement/continuous_walk/left'; break
      case 'right-move': endpoint = '/robot_movement/continuous_walk/right'; break
      case 'left': endpoint = '/robot_movement/continuous_walk/turn_left'; break
      case 'right': endpoint = '/robot_movement/continuous_walk/turn_right'; break
      case 'stop': endpoint = '/robot_movement/cancel'; break
      default: return Promise.resolve({ success: false, error: '未知方向' })
    }
    return movementHttp.post(endpoint, {})
  },

  // 刷新所有系统状态
  refreshAllStatus: () => movementHttp.get('/robot/status'),

  // 紧急停止所有系统
  emergencyStopAll: () => movementHttp.post('/robot/emergency_stop'),

  // 紧急停止单个操作 - 更新为新的接口路径
  emergencyStop: () => movementHttp.post('/robot_movement/cancel'),

  // 导出所有数据
  exportAllData: () => movementHttp.get('/robot/export'),

  // 获取移动标签
  getMovementLabel: (direction) => {
    const labels = {
      'forward': '前进',
      'backward': '后退',
      'left-move': '左移',
      'right-move': '右移',
      'left': '左转',
      'right': '右转',
      'stop': '停止'
    }
    return labels[direction] || '未知动作'
  },

  // 获取分类名称
  getCategoryName: (category) => {
    const categories = {
      'greeting': '问候语',
      'response': '回应语',
      'notification': '通知语',
      'emotion': '情感表达',
      'system': '系统提示'
    }
    return categories[category] || category
  },

  // 获取动作分类名称
  getActionCategoryName: (category) => {
    const categories = {
      'basic': '基础动作',
      'gesture': '手势动作',
      'manipulation': '操作动作',
      'expression': '表达动作'
    }
    return categories[category] || category
  }
} 