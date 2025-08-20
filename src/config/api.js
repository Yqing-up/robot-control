// API配置文件

// TTS语音系统服务器选择逻辑
const getTTSTargetHost = () => {
  const ttsUseServer = import.meta.env.VITE_TTS_USE_SERVER;
  const lowerHost = import.meta.env.VITE_ROBOT_LOWER_HOST;
  const upperHost = import.meta.env.VITE_ROBOT_UPPER_HOST;

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

  // 音频流相关接口 - 使用独立的代理前缀
  AUDIO_STREAM_BASE_URL: '/api-audio-stream',

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
    REAL_ROBOT_TARGET: import.meta.env.VITE_ROBOT_LOWER_HOST,
    SIMULATION_ROBOT_TARGET: import.meta.env.VITE_ROBOT_SIMULATION_HOST,
    UPPER_ROBOT_TARGET: import.meta.env.VITE_ROBOT_UPPER_HOST,
    // TTS语音系统目标服务器（动态选择）
    TTS_TARGET: getTTSTargetHost(),
    // 太极音频服务器
    TAIJI_AUDIO_TARGET: import.meta.env.VITE_TAIJI_AUDIO_HOST,
    // 图片分析基础服务器
    IMAGE_ANALYSIS_BASE_TARGET: import.meta.env.VITE_IMAGE_ANALYSIS_BASE_HOST
  },

  // 仿真模式配置（保留向后兼容）
  SIMULATION_CONFIG: {
    REAL_ROBOT_TARGET: import.meta.env.VITE_ROBOT_LOWER_HOST,
    SIMULATION_ROBOT_TARGET: import.meta.env.VITE_ROBOT_SIMULATION_HOST
  },

  // TTS语音系统配置
  TTS_CONFIG: {
    USE_SERVER: import.meta.env.VITE_TTS_USE_SERVER,
    TARGET_HOST: getTTSTargetHost()
  }
};

// 配置验证函数
export const validateAPIConfig = () => {
  const errors = [];
  const warnings = [];

  // 检查必需的环境变量
  const requiredEnvVars = [
    'VITE_ROBOT_LOWER_HOST',
    'VITE_ROBOT_UPPER_HOST',
    'VITE_ROBOT_SIMULATION_HOST',
    'VITE_TTS_USE_SERVER'
  ];

  const optionalEnvVars = [
    'VITE_TAIJI_AUDIO_HOST',
    'VITE_IMAGE_ANALYSIS_BASE_HOST',
    'VITE_IMAGE_ANALYSIS_WORKFLOW_HOST'
  ];

  // 检查必需变量
  requiredEnvVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      errors.push(`缺少必需的环境变量: ${varName}`);
    }
  });

  // 检查可选变量
  optionalEnvVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      warnings.push(`缺少可选的环境变量: ${varName}`);
    }
  });

  // 检查TTS配置
  const ttsUseServer = import.meta.env.VITE_TTS_USE_SERVER;
  if (ttsUseServer && !['upper', 'lower'].includes(ttsUseServer)) {
    errors.push(`VITE_TTS_USE_SERVER 必须是 'upper' 或 'lower'，当前值: ${ttsUseServer}`);
  }

  // 输出验证结果
  if (errors.length > 0) {
    console.error('🚨 API配置错误:', errors);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ API配置警告:', warnings);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ API配置验证通过');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// 开发环境下自动验证配置
if (import.meta.env.DEV) {
  validateAPIConfig();
}
