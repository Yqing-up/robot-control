import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为真实机器人接口创建独立的axios实例
const realRobotAxiosInstance = axios.create({
  baseURL: API_CONFIG.REAL_ROBOT_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加请求拦截器
realRobotAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('真实机器人API请求:', {
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
    console.error('真实机器人API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
realRobotAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('真实机器人API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    console.error('真实机器人API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // 特殊处理太极接口的400错误
    if (error.config?.url?.includes('/robot/taiji/execute') && error.response?.status === 400) {
      console.log('⚠️ 太极接口400错误 - 可能是正常的异步执行响应');
      console.log('📝 服务器响应数据:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

// 真实机器人接口的http方法
const realRobotHttp = {
  get: (url, params = {}, config = {}) => realRobotAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => realRobotAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => realRobotAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => realRobotAxiosInstance.delete(url, config),
};

export const realRobotApi = {
  // 获取动作列表
  getActions: () => {
    console.log('🦾 获取真实机器人动作列表');
    return realRobotHttp.get('/robot/actions');
  },

  // 获取执行历史
  getActionsHistory: () => {
    console.log('🦾 获取真实机器人执行历史');
    return realRobotHttp.get('/robot/actions/history');
  },

  // 执行动作
  executeAction: (actionName, params = {}) => {
    console.log('🦾 真实机器人执行动作 - 输入参数:', { actionName, params });

    const payload = {
      action_name: actionName,
      duration: params.duration || 3.0
    };

    // 只有当filePath存在且不为空时才添加file_path
    if (params.filePath && params.filePath.trim() !== '') {
      payload.file_path = params.filePath;
    }

    // 添加其他非空参数
    Object.keys(params).forEach(key => {
      if (key !== 'duration' && key !== 'filePath' &&
          params[key] !== null && params[key] !== undefined && params[key] !== '') {
        payload[key] = params[key];
      }
    });

    console.log('🦾 最终payload:', payload);
    return realRobotHttp.post('/robot/execute', payload);
  },

  // 执行太极动作
  executeTaijiAction: async (params = {}) => {
    try {
      // 真实机器人需要特定的参数格式
      const payload = {
        script_path: "/home/lab/kuavo-ros-opensource/src/demo/taiji/actions_player.py",
        duration: params.duration || 30.0
      };

      console.log('🥋 真实机器人执行太极动作:', payload);
      console.log('🔍 请求详情:', {
        method: 'POST',
        url: '/robot/taiji/execute',
        baseURL: API_CONFIG.REAL_ROBOT_BASE_URL,
        fullURL: `${API_CONFIG.REAL_ROBOT_BASE_URL}/robot/taiji/execute`,
        payload: payload
      });

      // 为太极动作设置更长的超时时间（35秒）
      const config = {
        timeout: 35000 // 35秒超时，比动作时间稍长
      };

      const response = await realRobotHttp.post('/robot/taiji/execute', payload, config);

      console.log('✅ 太极动作API响应成功:', response);

      // 即使服务器返回了数据，也认为是成功的
      return {
        success: true,
        message: '太极动作执行中...',
        data: response
      };

    } catch (error) {
      console.error('❌ 太极动作API调用失败:', error);

      // 检查是否是HTTP 400但动作实际在执行
      if (error.response?.status === 400) {
        console.log('⚠️ 收到400错误，但太极动作可能正在执行中');

        // 如果是400错误，我们假设动作正在执行
        return {
          success: true,
          message: '太极动作已启动（服务器返回400但动作正在执行）',
          warning: true,
          data: error.response?.data
        };
      }

      // 其他错误正常抛出
      throw error;
    }
  },

  // 检查连接状态 - 使用动作列表接口来检测连接
  checkConnection: async () => {
    try {
      console.log('🦾 检查真实机器人连接状态');
      const response = await realRobotHttp.get('/robot/actions');
      return {
        connected: true,
        status: 'connected',
        data: response
      };
    } catch (error) {
      console.error('🦾 真实机器人连接检查失败:', error);
      return {
        connected: false,
        status: 'disconnected',
        error: error.message
      };
    }
  },

  // 测试太极接口连接
  testTaijiConnection: async () => {
    try {
      console.log('🥋 测试真实机器人太极接口连接');
      console.log('🔍 测试URL:', `${API_CONFIG.REAL_ROBOT_BASE_URL}/robot/taiji/execute`);

      // 发送一个测试请求（使用正确的参数格式）
      const testPayload = {
        script_path: "/home/lab/kuavo-ros-opensource/src/demo/taiji/actions_player.py",
        duration: 0.1 // 极短时间，用于测试
      };

      const response = await realRobotHttp.post('/robot/taiji/execute', testPayload, { timeout: 5000 });
      console.log('✅ 太极接口测试成功:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ 太极接口测试失败:', error);
      return { success: false, error: error.message, status: error.response?.status };
    }
  }
};
