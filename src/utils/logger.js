/**
 * 环境感知的日志系统
 * 在生产环境中禁用调试日志，保留错误和警告日志
 */

const isDevelopment = import.meta.env.MODE === 'development'

/**
 * 日志级别
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

/**
 * 当前环境的日志级别
 * 开发环境：显示所有日志
 * 生产环境：只显示警告和错误
 */
const currentLogLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 消息
 * @param {...any} args - 额外参数
 */
const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level}]`
  return [prefix, message, ...args]
}

/**
 * 日志工具类
 */
export const logger = {
  /**
   * 调试日志 - 仅在开发环境显示
   * @param {string} message - 消息
   * @param {...any} args - 额外参数
   */
  debug: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log(...formatMessage('DEBUG', message, ...args))
    }
  },

  /**
   * 信息日志 - 仅在开发环境显示
   * @param {string} message - 消息
   * @param {...any} args - 额外参数
   */
  info: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(...formatMessage('INFO', message, ...args))
    }
  },

  /**
   * 警告日志 - 在所有环境显示
   * @param {string} message - 消息
   * @param {...any} args - 额外参数
   */
  warn: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(...formatMessage('WARN', message, ...args))
    }
  },

  /**
   * 错误日志 - 在所有环境显示
   * @param {string} message - 消息
   * @param {...any} args - 额外参数
   */
  error: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(...formatMessage('ERROR', message, ...args))
    }
  },

  /**
   * 条件日志 - 根据条件决定是否输出
   * @param {boolean} condition - 条件
   * @param {string} level - 日志级别 ('debug', 'info', 'warn', 'error')
   * @param {string} message - 消息
   * @param {...any} args - 额外参数
   */
  conditional: (condition, level, message, ...args) => {
    if (condition && logger[level]) {
      logger[level](message, ...args)
    }
  },

  /**
   * 性能日志 - 仅在开发环境显示
   * @param {string} label - 性能标签
   * @param {Function} fn - 要执行的函数
   */
  performance: async (label, fn) => {
    if (isDevelopment) {
      console.time(label)
      try {
        const result = await fn()
        console.timeEnd(label)
        return result
      } catch (error) {
        console.timeEnd(label)
        throw error
      }
    } else {
      return await fn()
    }
  },

  /**
   * API调用日志 - 仅在开发环境显示详细信息
   * @param {string} method - HTTP方法
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {any} response - 响应数据
   */
  api: (method, url, data = null, response = null) => {
    if (isDevelopment) {
      const logData = {
        method: method?.toUpperCase(),
        url,
        timestamp: new Date().toISOString()
      }
      
      if (data) logData.requestData = data
      if (response) logData.responseData = response
      
      console.group(`🌐 API ${method?.toUpperCase()} ${url}`)
      console.table(logData)
      console.groupEnd()
    }
  },

  /**
   * 组件生命周期日志 - 仅在开发环境显示
   * @param {string} componentName - 组件名称
   * @param {string} lifecycle - 生命周期名称
   * @param {any} data - 额外数据
   */
  lifecycle: (componentName, lifecycle, data = null) => {
    if (isDevelopment) {
      const message = `🔄 ${componentName} - ${lifecycle}`
      if (data) {
        console.log(message, data)
      } else {
        console.log(message)
      }
    }
  }
}

/**
 * 兼容性方法 - 逐步替换现有的console.log调用
 */
export const log = logger.debug
export const logInfo = logger.info
export const logWarn = logger.warn
export const logError = logger.error

export default logger
