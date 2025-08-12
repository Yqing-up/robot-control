import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为聊天接口创建独立的axios实例
const chatAxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
});

// 请求拦截器
chatAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('🗨️ 聊天API请求:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('🗨️ 聊天API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
chatAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('🗨️ 聊天API响应:', response.status, response.config.url, response.data);
    return response.data;
  },
  (error) => {
    console.error('🗨️ 聊天API响应错误:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const chatApi = {
  // 发送消息给机器人（管理页面使用）
  sendMessage: (message) => {
    console.log('🗨️ 发送消息给机器人:', message);
    // 尝试不同的参数格式
    const payload = {
      text: message,  // 尝试使用 text 而不是 message
      content: message, // 备选字段
      message: message  // 原始字段
    };
    console.log('🗨️ 发送的payload:', payload);
    return chatAxiosInstance.post('/conversation/robot/send', payload);
  },

  // 发送人类消息（远程交互页面使用）
  sendHumanMessage: (message) => {
    console.log('🗨️ 发送人类消息:', message);
    const payload = {
      text: message,
      content: message,
      message: message
    };
    console.log('🗨️ 发送的payload:', payload);
    return chatAxiosInstance.post('/conversation/human/send', payload);
  },

  // 获取聊天历史记录
  getChatHistory: (limit = 50, offset = 0) => {
    console.log('🗨️ 获取聊天历史记录, limit:', limit, 'offset:', offset);
    return chatAxiosInstance.get('/conversation/history', {
      params: {
        limit: limit,
        offset: offset
      }
    });
  },

  // 获取人机聊天历史记录（新接口）
  getHumanRobotChatHistory: (limit = 50, offset = 0) => {
    console.log('🗨️ 获取人机聊天历史记录, limit:', limit, 'offset:', offset);
    return chatAxiosInstance.get('/human_robot_chat/history', {
      params: {
        limit: limit,
        offset: offset
      }
    });
  },

  // 发送机器人消息到人机聊天（新接口）
  sendRobotMessageToHumanRobotChat: (message) => {
    console.log('🗨️ 发送机器人消息到人机聊天:', message);
    const payload = {
      text: message,
      content: message,
      message: message
    };
    console.log('🗨️ 发送的payload:', payload);
    return chatAxiosInstance.post('/human_robot_chat/robot/send', payload);
  },

  // 发送人类消息到人机聊天（新接口）
  sendHumanMessageToHumanRobotChat: (message) => {
    console.log('🗨️ 发送人类消息到人机聊天:', message);
    const payload = {
      text: message,
      content: message,
      message: message
    };
    console.log('🗨️ 发送的payload:', payload);
    return chatAxiosInstance.post('/human_robot_chat/human/send', payload);
  }
};
