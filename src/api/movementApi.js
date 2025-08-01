import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 仿真模式状态管理
let isSimulationMode = false;

// 获取仿真模式状态
export const getSimulationMode = () => {
  return isSimulationMode;
};

// 设置仿真模式状态
export const setSimulationMode = (enabled) => {
  isSimulationMode = enabled;
  console.log(`🤖 运动API仿真模式${enabled ? '已启用' : '已禁用'}:`, enabled ? API_CONFIG.MOVEMENT_SIMULATION_BASE_URL : API_CONFIG.MOVEMENT_BASE_URL);

  // 详细的配置验证 - 延迟执行以确保实例已创建
  setTimeout(() => {
    console.log('🔍 API配置验证:', {
      仿真模式: enabled,
      真实机器人baseURL: API_CONFIG.MOVEMENT_BASE_URL,
      仿真机器人baseURL: API_CONFIG.MOVEMENT_SIMULATION_BASE_URL,
      当前使用的baseURL: enabled ? API_CONFIG.MOVEMENT_SIMULATION_BASE_URL : API_CONFIG.MOVEMENT_BASE_URL,
      simulationAxiosInstance_baseURL: simulationAxiosInstance?.defaults?.baseURL,
      movementAxiosInstance_baseURL: movementAxiosInstance?.defaults?.baseURL
    });

    // 强制验证axios实例配置
    console.log('🔍 强制验证axios实例:', {
      simulationAxiosInstance: {
        baseURL: simulationAxiosInstance?.defaults?.baseURL,
        timeout: simulationAxiosInstance?.defaults?.timeout,
        headers: simulationAxiosInstance?.defaults?.headers
      },
      movementAxiosInstance: {
        baseURL: movementAxiosInstance?.defaults?.baseURL,
        timeout: movementAxiosInstance?.defaults?.timeout,
        headers: movementAxiosInstance?.defaults?.headers
      }
    });
  }, 0);
};

// 检测仿真服务器是否可用
export const checkSimulationServerStatus = async () => {
  try {
    console.log('🔍 检测仿真服务器状态...')
    console.log('🔍 测试地址:', API_CONFIG.MOVEMENT_SIMULATION_BASE_URL)
    console.log('🔍 完整URL:', `${API_CONFIG.MOVEMENT_SIMULATION_BASE_URL}/robot/actions`)

    // 测试动作列表接口
    const response = await simulationAxiosInstance.get('/robot/actions')
    console.log('✅ 仿真服务器可用，响应:', response)
    return { available: true, response }
  } catch (error) {
    console.warn('❌ 仿真服务器不可用:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`
    })
    return { available: false, error }
  }
};

// 测试所有可能的仿真服务器接口
export const testSimulationServerEndpoints = async () => {
  const testEndpoints = [
    // 标准路径
    '/robot/actions',
    '/robot/execute',

    // 带api前缀
    '/api/robot/actions',
    '/api/robot/execute',

    // 可能的仿真专用路径
    '/simulation/actions',
    '/simulation/execute',
    '/sim/actions',
    '/sim/execute',

    // 动作相关路径
    '/actions',
    '/execute',
    '/action/list',
    '/action/execute',

    // 机器人相关路径
    '/robot/action/list',
    '/robot/action/execute',
    '/robot_actions',
    '/robot_execute',

    // 系统路径
    '/',
    '/health',
    '/status',
    '/info',
    '/ping'
  ]

  console.log('🧪 测试仿真服务器所有可能的接口...')
  const results = {}

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔍 测试接口: ${endpoint}`)
      const response = await simulationAxiosInstance.get(endpoint)
      results[endpoint] = { success: true, status: response.status || 200, data: response }
      console.log(`✅ ${endpoint} - 成功`)
    } catch (error) {
      results[endpoint] = {
        success: false,
        status: error.response?.status || 'NETWORK_ERROR',
        error: error.message
      }
      console.log(`❌ ${endpoint} - 失败:`, error.response?.status || error.message)
    }
  }

  console.log('🧪 仿真服务器接口测试结果:', results)
  return results
};

// 简单的网络连接测试
export const testSimulationServerConnection = async () => {
  console.log('🌐 测试仿真服务器基础连接...')

  try {
    // 创建一个简单的axios实例，不使用拦截器
    const testInstance = axios.create({
      baseURL: API_CONFIG.MOVEMENT_SIMULATION_BASE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 尝试最基础的连接
    const response = await testInstance.get('/')
    console.log('✅ 基础连接成功:', response.status)
    return { success: true, status: response.status, data: response.data }
  } catch (error) {
    console.log('❌ 基础连接失败:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    })
    return { success: false, error }
  }
};

// 测试指定的接口路径
export const testSpecificEndpoint = async (endpoint, method = 'GET', data = null) => {
  try {
    console.log(`🔍 测试指定接口: ${method} ${endpoint}`)

    let response
    if (method.toUpperCase() === 'GET') {
      response = await simulationAxiosInstance.get(endpoint)
    } else if (method.toUpperCase() === 'POST') {
      response = await simulationAxiosInstance.post(endpoint, data || {})
    }

    console.log(`✅ ${endpoint} 测试成功:`, response)
    return { success: true, data: response, status: response.status || 200 }
  } catch (error) {
    console.log(`❌ ${endpoint} 测试失败:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    return { success: false, error, status: error.response?.status }
  }
};

// 独立的仿真服务器测试 - 不依赖任何配置
export const testSimulationServerDirect = async () => {
  console.log('🧪 独立测试仿真服务器连接...')

  try {
    // 创建完全独立的axios实例
    const directTestInstance = axios.create({
      baseURL: '/api-move-sim',  // 使用正确的代理路径
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    });

    console.log('🔍 独立测试实例配置:', {
      baseURL: directTestInstance.defaults.baseURL,
      timeout: directTestInstance.defaults.timeout
    });

    // 测试动作列表接口
    const response = await directTestInstance.get('/robot/actions');
    console.log('✅ 独立测试成功:', response);
    return { success: true, data: response };
  } catch (error) {
    console.log('❌ 独立测试失败:', {
      message: error.message,
      status: error.response?.status,
      config: error.config
    });
    return { success: false, error };
  }
};

// 为运动接口创建独立的axios实例
const movementAxiosInstance = axios.create({
  baseURL: API_CONFIG.MOVEMENT_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 强制创建仿真运动接口的axios实例
const createSimulationAxiosInstance = () => {
  console.log('🔧 强制创建新的仿真axios实例...');

  const instance = axios.create({
    baseURL: '/api-move-sim',  // 强制使用正确的baseURL
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
  });

  console.log('✅ 新仿真axios实例创建完成:', {
    baseURL: instance.defaults.baseURL,
    timeout: instance.defaults.timeout,
    headers: instance.defaults.headers
  });

  return instance;
};

const simulationAxiosInstance = createSimulationAxiosInstance();



// 添加请求拦截器 - 仿真机器人
simulationAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('🤖 仿真机器人API请求拦截器:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('🤖 仿真机器人API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器 - 真实机器人
movementAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('真实机器人API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });

    // 包装响应数据为统一格式
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  },
  (error) => {
    console.error('真实机器人API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // 返回错误格式的响应
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
);

// 添加响应拦截器 - 仿真机器人
simulationAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('仿真机器人API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });

    // 包装响应数据为统一格式
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  },
  (error) => {
    console.error('仿真机器人API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // 返回错误格式的响应
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
);



// 运动接口的http方法 - 默认使用真实机器人实例
const movementHttp = {
  get: (url, params = {}, config = {}) => movementAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => movementAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => movementAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => movementAxiosInstance.delete(url, config),
};



export const movementApi = {
  // 获取真实机器人动作列表
  getRobotActions: () => movementHttp.get('/robot/actions'),

  // 获取仿真机器人动作列表
  getSimulationActions: () => simulationAxiosInstance.get('/robot/actions'),

  // 获取动作库列表（兼容性函数） - 根据仿真模式动态选择
  getActionList: () => {
    if (isSimulationMode) {
      console.log('🤖 获取仿真机器人动作列表，使用实例:', {
        baseURL: simulationAxiosInstance.defaults.baseURL,
        完整URL: simulationAxiosInstance.defaults.baseURL + '/robot/actions'
      });

      // 强制验证并重新创建实例（如果需要）
      if (simulationAxiosInstance.defaults.baseURL !== '/api-move-sim') {
        console.warn('⚠️ 检测到baseURL不正确，重新创建实例');
        const newInstance = createSimulationAxiosInstance();
        return newInstance.get('/robot/actions');
      }

      return simulationAxiosInstance.get('/robot/actions')
    } else {
      console.log('🦾 获取真实机器人动作列表')
      return movementAxiosInstance.get('/robot/actions')
    }
  },

  // 执行指定的机器人动作 - 始终使用真实机器人（通用方法）
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

  // 执行动作（兼容性函数） - 始终使用真实机器人（用于综合管理页面）
  executeAction: (action) => {
    return movementHttp.post('/robot/execute', {
      action_name: action.name,
      duration: action.duration || 3.0,
      category: action.category
    })
  },

  // 机器人移动控制 - 始终使用真实机器人（这个主要用于腿部系统）
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

  // 刷新所有系统状态 - 始终使用真实机器人
  refreshAllStatus: () => movementHttp.get('/robot/status'),

  // 紧急停止所有系统 - 始终使用真实机器人
  emergencyStopAll: () => movementHttp.post('/robot/emergency_stop'),

  // 紧急停止单个操作 - 始终使用真实机器人
  emergencyStop: () => movementHttp.post('/robot_movement/cancel'),

  // 导出所有数据 - 始终使用真实机器人
  exportAllData: () => movementHttp.get('/robot/export'),

  // 手臂系统专用：支持仿真模式的动作执行
  executeArmAction: (actionName, params = {}) => {
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

    if (isSimulationMode) {
      console.log(`🤖 手臂动作执行 [仿真模式]:`, actionName, '目标: 仿真机器人')
      return simulationAxiosInstance.post('/robot/execute', payload)
    } else {
      console.log(`🦾 手臂动作执行 [真实模式]:`, actionName, '目标: 真实机器人')
      return movementAxiosInstance.post('/robot/execute', payload)
    }
  },

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
