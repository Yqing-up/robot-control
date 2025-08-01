import axios from 'axios';
import { API_CONFIG } from '../config/api'

// 为语音接口创建独立的axios实例
const voiceAxiosInstance = axios.create({
  baseURL: API_CONFIG.VOICE_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

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