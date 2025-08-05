// API配置文件

// TTS语音系统服务器选择逻辑
const getTTSTargetHost = () => {
  const ttsUseServer = import.meta.env.VITE_TTS_USE_SERVER || 'upper';
  const lowerHost = import.meta.env.VITE_ROBOT_LOWER_HOST || 'http://192.168.0.117:5001';
  const upperHost = import.meta.env.VITE_ROBOT_UPPER_HOST || 'http://192.168.0.119:5001';
  
  return ttsUseServer === 'lower' ? lowerHost : upperHost;
};

export const API_CONFIG = {
  // 运动相关接口 - 使用独立的代理前缀（保留用于腿部系统）
  MOVEMENT_BASE_URL: '/api-move',

  // 仿真运动相关接口 - 使用独立的代理前缀（保留用于腿部系统）
  MOVEMENT_SIMULATION_BASE_URL: '/api-move-sim',

  // 机器人代理接口 - 新的标准化代理
  REAL_ROBOT_BASE_URL: '/api-robot-real',
  SIMULATION_ROBOT_BASE_URL: '/api-robot-sim',

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

  // 机器人服务器配置 - 使用环境变量
  ROBOT_CONFIG: {
    REAL_ROBOT_TARGET: import.meta.env.VITE_ROBOT_LOWER_HOST || 'http://192.168.0.117:5001',
    SIMULATION_ROBOT_TARGET: import.meta.env.VITE_ROBOT_SIMULATION_HOST || 'http://192.168.0.103:5001',
    UPPER_ROBOT_TARGET: import.meta.env.VITE_ROBOT_UPPER_HOST || 'http://192.168.0.119:5001',
    // TTS语音系统目标服务器（动态选择）
    TTS_TARGET: getTTSTargetHost()
  },

  // 仿真模式配置（保留向后兼容）
  SIMULATION_CONFIG: {
    REAL_ROBOT_TARGET: import.meta.env.VITE_ROBOT_LOWER_HOST || 'http://192.168.0.117:5001',
    SIMULATION_ROBOT_TARGET: import.meta.env.VITE_ROBOT_SIMULATION_HOST || 'http://192.168.0.103:5001'
  },

  // TTS语音系统配置
  TTS_CONFIG: {
    USE_SERVER: import.meta.env.VITE_TTS_USE_SERVER || 'upper',
    TARGET_HOST: getTTSTargetHost()
  }
};
