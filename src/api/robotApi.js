import { realRobotApi } from './realRobotApi.js';
import { simulationRobotApi } from './simulationRobotApi.js';
import { API_CONFIG } from '../config/api.js';

// 机器人模式管理
let currentMode = 'real'; // 'real' 或 'simulation'

// 获取当前模式
export const getCurrentMode = () => {
  return currentMode;
};

// 设置机器人模式
export const setRobotMode = (mode) => {
  if (mode !== 'real' && mode !== 'simulation') {
    throw new Error('机器人模式必须是 "real" 或 "simulation"');
  }

  const oldMode = currentMode;
  currentMode = mode;

  console.log(`🔄 机器人模式切换: ${oldMode} -> ${mode}`);
  console.log(`📡 当前使用: ${mode === 'real' ? `真实机器人 (${API_CONFIG.ROBOT_CONFIG.REAL_ROBOT_TARGET})` : `仿真机器人 (${API_CONFIG.ROBOT_CONFIG.SIMULATION_ROBOT_TARGET})`}`);

  return currentMode;
};

// 获取当前活动的机器人API
const getCurrentRobotApi = () => {
  return currentMode === 'real' ? realRobotApi : simulationRobotApi;
};

// 统一的机器人API接口
export const robotApi = {
  // 模式管理
  getCurrentMode,
  setRobotMode,

  // 获取当前模式的显示名称
  getCurrentModeLabel: () => {
    return currentMode === 'real' ? '真实机器人' : '仿真机器人';
  },

  // 获取当前模式的服务器地址
  getCurrentServerAddress: () => {
    return currentMode === 'real'
      ? `${API_CONFIG.ROBOT_CONFIG.REAL_ROBOT_TARGET}/api`
      : `${API_CONFIG.ROBOT_CONFIG.SIMULATION_ROBOT_TARGET}/api`;
  },

  // 动作相关接口
  getActions: () => {
    console.log(`📋 获取${robotApi.getCurrentModeLabel()}动作列表`);
    return getCurrentRobotApi().getActions();
  },

  getActionsHistory: () => {
    console.log(`📜 获取${robotApi.getCurrentModeLabel()}执行历史`);
    return getCurrentRobotApi().getActionsHistory();
  },

  executeAction: (actionName, params = {}) => {
    console.log(`🎬 ${robotApi.getCurrentModeLabel()}执行动作: ${actionName}`);
    return getCurrentRobotApi().executeAction(actionName, params);
  },

  // 执行太极动作
  executeTaijiAction: (params = {}) => {
    console.log(`🥋 ${robotApi.getCurrentModeLabel()}执行太极动作`);
    return getCurrentRobotApi().executeTaijiAction(params);
  },

  // 连接检查接口
  checkConnection: () => {
    console.log(`🔗 检查${robotApi.getCurrentModeLabel()}连接`);
    return getCurrentRobotApi().checkConnection();
  },

  // 双模式操作 - 同时检查两个机器人的状态
  checkBothConnections: async () => {
    console.log('🔗 检查真实机器人和仿真机器人连接状态');

    try {
      const [realStatus, simStatus] = await Promise.allSettled([
        realRobotApi.checkConnection(),
        simulationRobotApi.checkConnection()
      ]);

      return {
        real: realStatus.status === 'fulfilled' ? realStatus.value : {
          connected: false,
          error: realStatus.reason?.message || '连接失败'
        },
        simulation: simStatus.status === 'fulfilled' ? simStatus.value : {
          connected: false,
          error: simStatus.reason?.message || '连接失败'
        }
      };
    } catch (error) {
      console.error('🔗 检查机器人连接状态时发生错误:', error);
      return {
        real: { connected: false, error: '检查失败' },
        simulation: { connected: false, error: '检查失败' }
      };
    }
  },

  // 智能模式切换 - 根据连接状态自动选择可用的机器人
  autoSelectMode: async () => {
    console.log('🤖 智能模式选择：检查机器人可用性');

    const connections = await robotApi.checkBothConnections();

    if (connections.simulation.connected && connections.real.connected) {
      // 两个都可用，保持当前模式
      console.log('✅ 真实机器人和仿真机器人都可用，保持当前模式:', currentMode);
      return {
        mode: currentMode,
        reason: '两个机器人都可用，保持当前模式',
        available: { real: true, simulation: true }
      };
    } else if (connections.simulation.connected) {
      // 只有仿真机器人可用
      setRobotMode('simulation');
      console.log('🤖 自动切换到仿真机器人模式');
      return {
        mode: 'simulation',
        reason: '只有仿真机器人可用',
        available: { real: false, simulation: true }
      };
    } else if (connections.real.connected) {
      // 只有真实机器人可用
      setRobotMode('real');
      console.log('🦾 自动切换到真实机器人模式');
      return {
        mode: 'real',
        reason: '只有真实机器人可用',
        available: { real: true, simulation: false }
      };
    } else {
      // 两个都不可用
      console.warn('❌ 真实机器人和仿真机器人都不可用');
      return {
        mode: currentMode,
        reason: '两个机器人都不可用，保持当前模式',
        available: { real: false, simulation: false }
      };
    }
  }
};

// 默认导出
export default robotApi;
