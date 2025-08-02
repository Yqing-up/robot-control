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

  // 执行动作
  executeAction: (actionName, params = {}) => {
    const payload = {
      action_name: actionName,
      duration: params.duration || 3.0,
      file_path: params.filePath || null,
      ...params
    };

    // 清理空值
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log('🤖 仿真机器人执行动作:', actionName, payload);
    return simulationRobotHttp.post('/robot/execute', payload);
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
  }
};
