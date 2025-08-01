import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为摄像头接口创建独立的axios实例
const cameraAxiosInstance = axios.create({
  baseURL: API_CONFIG.CAMERA_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加请求拦截器
cameraAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('摄像头API请求:', {
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
    console.error('摄像头API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
cameraAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('摄像头API响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('摄像头API响应错误:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// 摄像头接口的http方法
const cameraHttp = {
  get: (url, params = {}, config = {}) => cameraAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => cameraAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => cameraAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => cameraAxiosInstance.delete(url, config),
};

export const cameraApi = {
  // 摄像头相关
  checkCameraStatus: () => cameraHttp.get('/video/camera'),
  getCameraInfo: (fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    return cameraHttp.get('/video/camera', {}, config)
  },
  getRawVideoFeed: () => `${API_CONFIG.CAMERA_BASE_URL}/video/raw_video_feed`,
  getSkeletonVideoFeed: () => `${API_CONFIG.CAMERA_BASE_URL}/video/video_feed`,
  
  // 摄像头连接测试
  testConnection: () => cameraHttp.get('/video/camera'),
  
  // 获取视频流URL
  getStreamUrl: () => `${API_CONFIG.CAMERA_BASE_URL}/video/raw_video_feed`,
  
  // 诊断视频流
  diagnoseVideoStream: () => cameraHttp.get('/video/camera'),

  // 照片相关
  getPhotoList: (fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    return cameraHttp.get('/photos/', {}, config)
  },
  downloadPhoto: (filename) => cameraHttp.get(`/photos/${filename}`),
  getPhotoContent: (filename) => cameraHttp.get(`/photos/${filename}/content`),
  takePhoto: (seconds = null, fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    const params = seconds !== null ? { seconds } : {}
    return cameraHttp.post('/photos/photo', {}, { ...config, params })
  },
  deletePhoto: (filename, fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    return cameraHttp.delete(`/photos/${filename}`, config)
  },
  startContinuousPhoto: (interval = 5, fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    return cameraHttp.post('/photos/continuous', { interval }, config)
  },
  stopContinuousPhoto: (fields = '') => {
    const config = fields ? { headers: { 'X-Fields': fields } } : {}
    return cameraHttp.delete('/photos/continuous', config)
  }
} 