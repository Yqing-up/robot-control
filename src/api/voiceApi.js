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

// 为语音库管理创建独立的axios实例 - 使用通用API代理
const sceneActionsAxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,  // 使用 /api 代理
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.DEFAULT_HEADERS,
    'ngrok-skip-browser-warning': 'true'
  },
});

// 为语音库管理添加请求拦截器
sceneActionsAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('语音库管理API请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('语音库管理API请求错误:', error);
    return Promise.reject(error);
  }
);

// 为语音库管理添加响应拦截器
sceneActionsAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('语音库管理API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // 直接返回data部分
  },
  (error) => {
    console.error('语音库管理API错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// 语音库管理接口的http方法
const sceneActionsHttp = {
  get: (url, params = {}, config = {}) => sceneActionsAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => sceneActionsAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => sceneActionsAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => sceneActionsAxiosInstance.delete(url, config),
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
  // 语音库管理接口 - 根据调用方式自动选择正确的接口
  getVoiceTexts: (sceneId = null) => {
    if (sceneId !== null && sceneId !== undefined) {
      // 机器人综合管理中心调用 - 使用 scene_actions 接口
      console.log('🔍 API调用: GET /api/scene_actions with params:', { scene_id: sceneId })
      return sceneActionsHttp.get('/scene_actions', { scene_id: sceneId })
    } else {
      // 语音系统控制中心调用 - 使用 TTS 文本接口
      console.log('🔍 API调用: GET /tts/text (获取语音文本列表)')
      return voiceHttp.get('/tts/text')
    }
  },
  saveVoiceText: (voiceData) => {
    // 根据数据结构判断使用哪个接口
    if (voiceData.scene_id || voiceData.action_type) {
      // 机器人综合管理中心 - 使用 scene_actions 接口
      console.log('📤 创建语音文本 POST /api/scene_actions:', voiceData)
      return sceneActionsHttp.post('/scene_actions', voiceData)
    } else {
      // 语音系统控制中心 - 使用 TTS 文本接口
      console.log('📤 创建语音文本 POST /tts/text:', voiceData)
      return voiceHttp.post('/tts/text', voiceData)
    }
  },
  updateVoiceText: (id, voiceData) => {
    // 根据数据结构判断使用哪个接口
    if (voiceData.scene_id || voiceData.action_type || voiceData.action_id) {
      // 机器人综合管理中心 - 使用 scene_actions 接口
      console.log('📤 更新语音文本 PUT /api/scene_actions/' + id + ':', voiceData)
      return sceneActionsHttp.put(`/scene_actions/${id}`, voiceData)
    } else {
      // 语音系统控制中心 - 使用 TTS 文本接口
      console.log('📤 更新语音文本 PUT /tts/text/' + id + ':', voiceData)
      return voiceHttp.put(`/tts/text/${id}`, voiceData)
    }
  },
  deleteVoiceText: (id, isSceneAction = false) => {
    if (isSceneAction) {
      // 机器人综合管理中心 - 使用 scene_actions 接口
      console.log('🗑️ 删除语音文本 DELETE /api/scene_actions/' + id)
      return sceneActionsHttp.delete(`/scene_actions/${id}`)
    } else {
      // 语音系统控制中心 - 使用 TTS 文本接口
      console.log('🗑️ 删除语音文本 DELETE /tts/text/' + id)
      return voiceHttp.delete(`/tts/text/${id}`)
    }
  },
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
