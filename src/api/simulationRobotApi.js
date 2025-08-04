import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为仿真机器人接口创建独立的axios实例
const simulationRobotAxiosInstance = axios.create({
  baseURL: API_CONFIG.SIMULATION_ROBOT_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加请求拦截器
simulationRobotAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('仿真机器人API请求:', {
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
    console.error('仿真机器人API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
simulationRobotAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('仿真机器人API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    console.error('仿真机器人API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// 仿真机器人接口的http方法
const simulationRobotHttp = {
  get: (url, params = {}, config = {}) => simulationRobotAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => simulationRobotAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => simulationRobotAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => simulationRobotAxiosInstance.delete(url, config),
};

export const simulationRobotApi = {
  // 获取动作列表
  getActions: () => {
    console.log('🤖 获取仿真机器人动作列表');
    return simulationRobotHttp.get('/robot/actions');
  },

  // 获取执行历史
  getActionsHistory: () => {
    console.log('🤖 获取仿真机器人执行历史');
    return simulationRobotHttp.get('/robot/actions/history');
  },

  // 执行动作
  executeAction: (actionName, params = {}) => {
    console.log('🤖 仿真机器人执行动作 - 输入参数:', { actionName, params });

    // 仿真机器人只需要action_name参数
    const payload = {
      action_name: actionName
    };

    console.log('🤖 仿真机器人最终payload:', payload);
    console.log('🔍 仿真机器人请求详情:', {
      method: 'POST',
      url: '/robot/execute',
      baseURL: API_CONFIG.SIMULATION_ROBOT_BASE_URL,
      fullURL: `${API_CONFIG.SIMULATION_ROBOT_BASE_URL}/robot/execute`,
      payload: payload
    });

    return simulationRobotHttp.post('/robot/execute', payload);
  },

  // 执行太极动作
  executeTaijiAction: (params = {}) => {
    // 仿真机器人太极只需要script_path参数
    const payload = {
      script_path: "/home/lab/kuavo-ros-opensource/src/demo/taiji/actions_player.py"
    };

    console.log('🥋 仿真机器人执行太极动作:', payload);
    console.log('🔍 仿真机器人太极请求详情:', {
      method: 'POST',
      url: '/robot/taiji/execute',
      baseURL: API_CONFIG.SIMULATION_ROBOT_BASE_URL,
      fullURL: `${API_CONFIG.SIMULATION_ROBOT_BASE_URL}/robot/taiji/execute`,
      payload: payload
    });

    // 为太极动作设置更长的超时时间（35秒）
    const config = {
      timeout: 35000 // 35秒超时，比动作时间稍长
    };

    return simulationRobotHttp.post('/robot/taiji/execute', payload, config);
  },

  // 检查连接状态 - 使用动作列表接口来检测连接
  checkConnection: async () => {
    try {
      console.log('🤖 检查仿真机器人连接状态');
      const response = await simulationRobotHttp.get('/robot/actions');
      return {
        connected: true,
        status: 'connected',
        data: response
      };
    } catch (error) {
      console.error('🤖 仿真机器人连接检查失败:', error);
      return {
        connected: false,
        status: 'disconnected',
        error: error.message
      };
    }
  },

  // 测试动作执行接口
  testActionExecution: async (actionName = 'wave_hello') => {
    try {
      console.log('🤖 测试仿真机器人动作执行接口');
      console.log('🔍 测试URL:', `${API_CONFIG.SIMULATION_ROBOT_BASE_URL}/robot/execute`);

      const testPayload = {
        action_name: actionName,
        duration: 0.1 // 极短时间，用于测试
      };

      const response = await simulationRobotHttp.post('/robot/execute', testPayload, { timeout: 5000 });
      console.log('✅ 仿真机器人动作执行测试成功:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ 仿真机器人动作执行测试失败:', error);
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }
};
