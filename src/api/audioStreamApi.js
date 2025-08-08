import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为音频流接口创建独立的axios实例
const audioStreamAxiosInstance = axios.create({
  baseURL: API_CONFIG.AUDIO_STREAM_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加请求拦截器
audioStreamAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('🎵 音频流API请求:', {
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
    console.error('🎵 音频流API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
audioStreamAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('🎵 音频流API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    console.error('🎵 音频流API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      code: error.code
    });
    return Promise.reject(error);
  }
);

// 音频流接口的http方法
const audioStreamHttp = {
  get: (url, params = {}, config = {}) => audioStreamAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => audioStreamAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => audioStreamAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => audioStreamAxiosInstance.delete(url, config),
};

export const audioStreamApi = {
  // 开始音频流采集
  startStream: () => {
    console.log('🎵 调用开始音频流接口');
    const audioConfig = {
      sample_rate: 44100,
      channels: 1,
      format: "pcm",
      encoding: "base64",
      chunk_size: 1024
    };
    return audioStreamHttp.post('/audio/microphone/start_stream', audioConfig, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  },

  // 停止指定的音频流
  stopStream: (streamId) => {
    console.log('🎵 调用停止音频流接口:', streamId);
    return audioStreamHttp.post(`/audio/microphone/stop_stream/${streamId}`, {}, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  },

  // 获取所有活跃的音频流信息
  getStreams: () => {
    console.log('🎵 调用获取音频流列表接口');
    return audioStreamHttp.get('/audio/microphone/streams', {}, {
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  // 创建Socket.IO连接用于实时音频播放
  createSocketIOConnection: () => {
    console.log('🎵 创建Socket.IO连接到 /microphone 命名空间');

    // 使用全局的io对象
    const socket = window.io('http://192.168.0.120:5001/microphone', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    console.log('🎵 Socket.IO连接详情:', {
      URL: 'http://192.168.0.120:5001/microphone',
      传输方式: ['websocket', 'polling'],
      超时时间: '10秒'
    });

    return socket;
  }
};
