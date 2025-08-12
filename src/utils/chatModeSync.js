/**
 * 聊天模式跨页面同步工具
 * 用于在远程交互中心和机器人聊天交互页面之间同步模式状态
 */

// 模式常量
export const CHAT_MODES = {
  INTERACTION: 'interaction', // 人机交互模式（默认）
  ROBOT_MANAGEMENT: 'robot_management' // 机器人管理模式
}

// localStorage键名
const CHAT_MODE_KEY = 'chat_mode_state'

// 事件名称
const MODE_CHANGE_EVENT = 'chat_mode_changed'

/**
 * 获取当前聊天模式
 * @returns {string} 当前模式
 */
export function getCurrentChatMode() {
  const savedMode = localStorage.getItem(CHAT_MODE_KEY)
  return savedMode || CHAT_MODES.INTERACTION // 默认为人机交互模式
}

/**
 * 设置聊天模式
 * @param {string} mode 要设置的模式
 */
export function setChatMode(mode) {
  if (!Object.values(CHAT_MODES).includes(mode)) {
    console.warn('无效的聊天模式:', mode)
    return
  }

  const oldMode = getCurrentChatMode()
  if (oldMode !== mode) {
    localStorage.setItem(CHAT_MODE_KEY, mode)
    
    // 触发自定义事件通知其他页面
    const event = new CustomEvent(MODE_CHANGE_EVENT, {
      detail: { oldMode, newMode: mode }
    })
    window.dispatchEvent(event)
    
    console.log('🔄 聊天模式已切换:', oldMode, '->', mode)
  }
}

/**
 * 监听模式变化
 * @param {Function} callback 模式变化时的回调函数
 * @returns {Function} 取消监听的函数
 */
export function onChatModeChange(callback) {
  const handler = (event) => {
    callback(event.detail.newMode, event.detail.oldMode)
  }
  
  window.addEventListener(MODE_CHANGE_EVENT, handler)
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener(MODE_CHANGE_EVENT, handler)
  }
}

/**
 * 检查是否为人机交互模式
 * @returns {boolean}
 */
export function isInteractionMode() {
  return getCurrentChatMode() === CHAT_MODES.INTERACTION
}

/**
 * 检查是否为机器人管理模式
 * @returns {boolean}
 */
export function isRobotManagementMode() {
  return getCurrentChatMode() === CHAT_MODES.ROBOT_MANAGEMENT
}

/**
 * 切换到人机交互模式
 */
export function switchToInteractionMode() {
  setChatMode(CHAT_MODES.INTERACTION)
}

/**
 * 切换到机器人管理模式
 */
export function switchToRobotManagementMode() {
  setChatMode(CHAT_MODES.ROBOT_MANAGEMENT)
}

/**
 * 切换模式（在两种模式之间切换）
 */
export function toggleChatMode() {
  const currentMode = getCurrentChatMode()
  const newMode = currentMode === CHAT_MODES.INTERACTION 
    ? CHAT_MODES.ROBOT_MANAGEMENT 
    : CHAT_MODES.INTERACTION
  setChatMode(newMode)
}

/**
 * 获取模式显示名称
 * @param {string} mode 模式
 * @returns {string} 显示名称
 */
export function getModeDisplayName(mode) {
  switch (mode) {
    case CHAT_MODES.INTERACTION:
      return '交互模式'
    case CHAT_MODES.ROBOT_MANAGEMENT:
      return '机器人模式'
    default:
      return '未知模式'
  }
}
