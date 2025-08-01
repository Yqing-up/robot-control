// API配置文件
export const API_CONFIG = {
  // 运动相关接口 - 使用独立的代理前缀
  MOVEMENT_BASE_URL: '/api-move',

  // 仿真运动相关接口 - 使用独立的代理前缀
  MOVEMENT_SIMULATION_BASE_URL: '/api-move-sim',

  // 摄像头相关接口 - 使用独立的代理前缀
  CAMERA_BASE_URL: '/api-cam',

  // 语音相关接口 - 使用独立的代理前缀
  VOICE_BASE_URL: '/api-voice',

  // 录音相关接口 - 使用独立的代理前缀
  RECORDING_BASE_URL: '/api-rec',

  // 保留原有的通用BASE_URL，用于其他接口
  BASE_URL: '/api',

  // 超时时间（毫秒）
  TIMEOUT: 10000,

  // 默认请求头
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },

  // 仿真模式配置
  SIMULATION_CONFIG: {
    REAL_ROBOT_TARGET: 'http://192.168.0.117:5001/api',
    SIMULATION_ROBOT_TARGET: 'http://192.168.0.103:5001/api'
  }
};
