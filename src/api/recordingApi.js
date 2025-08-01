import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为录音接口创建独立的axios实例
const recordingAxiosInstance = axios.create({
  baseURL: API_CONFIG.RECORDING_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加响应拦截器
recordingAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('录音API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    console.error('录音API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// 录音接口的http方法
const recordingHttp = {
  get: (url, params = {}, config = {}) => recordingAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => recordingAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => recordingAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => recordingAxiosInstance.delete(url, config),
};

export const recordingApi = {
  // 开始录音
  startRecording: () => recordingHttp.post('/asr/start'),
  // 停止录音
  stopRecording: () => recordingHttp.post('/asr/stop'),
  // 查询录音状态
  getStatus: (enableSync = false) => recordingHttp.get('/asr/status', { enableSync }),
  // 获取最近录音记录 (同时用于获取实时转录文本)
  // minutes: 获取最近几分钟的记录，默认1分钟
  getRecentRecords: (minutes = 1) => recordingHttp.get('/asr/recent', { minutes }),
}
