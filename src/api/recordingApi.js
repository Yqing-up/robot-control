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
  getStatus: () => recordingHttp.get('/asr/status'),
  // 获取当前转录文本
  getCurrentTranscription: () => recordingHttp.get('/asr/current'),
  // 获取最近录音记录
  getRecentRecords: () => recordingHttp.get('/asr/recent'),
} 