import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为语音接口创建独立的axios实例
const voiceAxiosInstance = axios.create({
  baseURL: API_CONFIG.VOICE_BASE_URL,
  timeout: 30000, // 语音合成需要更长时间，设置为30秒
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加响应拦截器
voiceAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('语音API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    // 特殊处理超时错误
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.warn('⏰ 语音API超时 (这是正常现象，机器人可能仍在说话):', {
        url: error.config?.url,
        timeout: '30秒',
        message: '语音合成可能需要更长时间，请耐心等待'
      });

      // 返回一个友好的超时响应而不是错误
      return Promise.resolve({
        success: true,
        message: '语音请求已发送，机器人正在处理中...',
        timeout: true
      });
    }

    console.error('语音API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      code: error.code
    });
    return Promise.reject(error);
  }
);

// 语音接口的http方法
const voiceHttp = {
  get: (url, params = {}, config = {}) => voiceAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => voiceAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => voiceAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => voiceAxiosInstance.delete(url, config),
};

export const voiceApi = {
  // 语音合成（TTS）相关
  synthesizeText: (text, options = {}) => {
    const data = {
      text: text.trim(),
      voice_id: options.voice_id || 'zh-CN',
      format: options.format || 'mp3',
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0
    }
    return voiceHttp.post('/tts/synthesize', data)
  },
  getAvailableVoices: () => voiceHttp.get('/tts/voices'),
  getVoiceTexts: () => voiceHttp.get('/tts/text'),
  saveVoiceText: (voiceData) => voiceHttp.post('/tts/text', voiceData),
  deleteVoiceText: (textId) => voiceHttp.delete(`/tts/text/${textId}`),
  getTTSHistory: () => voiceHttp.get('/tts/history'),
  getTTSFile: (fileId) => voiceHttp.get(`/tts/file/${fileId}`),
  deleteTTSFile: (fileId) => voiceHttp.delete(`/tts/file/${fileId}`),

  // 语音识别（ASR）相关
  submitRecognition: (data) => voiceHttp.post('/voice/recognize', data),
  getRecognitionStatus: (taskId) => voiceHttp.get('/voice/status', { taskId }),
  getRecognitionResult: (taskId) => voiceHttp.get('/voice/result', { taskId }),
  cancelRecognition: (taskId) => voiceHttp.post('/voice/cancel', { taskId }),
  getRecognitionHistory: () => voiceHttp.get('/voice/history'),
  deleteRecognitionHistory: () => voiceHttp.delete('/voice/history'),
  clearRecognitionHistory: () => voiceHttp.delete('/voice/history/clear'),
}
