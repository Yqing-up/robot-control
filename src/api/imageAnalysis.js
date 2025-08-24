/**
 * 智能图片分析相关API接口
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api'

// API基础配置
const API_BASE_URL = '/api'
// 视觉（图片分析）API密钥
const WORKFLOW_API_KEY = 'app-oj3AJTDYGkfU2OxyIsY7LR1o'

// 为图片分析接口创建独立的axios实例
const imageAnalysisAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 图片分析需要更长时间
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
});

// 添加请求拦截器
imageAnalysisAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('📸 图片分析API请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url
    });
    return config;
  },
  (error) => {
    console.error('📸 图片分析API请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
imageAnalysisAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('📸 图片分析API响应成功:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('📸 图片分析API响应错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// 图片分析接口的http方法
const imageAnalysisHttp = {
  get: (url, params = {}, config = {}) => imageAnalysisAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => imageAnalysisAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => imageAnalysisAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => imageAnalysisAxiosInstance.delete(url, config),
};



/**
 * 获取指定时间范围内的图片数据
 * @param {number} minutes - 时间范围（分钟）
 * @returns {Promise} 返回图片数据
 */
export const getRecentImageData = async (minutes) => {
  try {
    console.log(`📸 获取最近${minutes}分钟的图片数据...`)

    const response = await imageAnalysisHttp.get(`/photos/recent/${minutes}`)

    const data = response.data
    console.log('📥 API返回的原始图片数据:', data)

    // 处理API返回的数据结构 {count: number, photos: array}
    const photos = data.photos || []
    console.log('📸 提取的photos数组:', photos)
    console.log('📊 photos数量:', photos.length)

    return {
      success: true,
      data: photos, // 返回photos数组而不是整个data对象
      count: data.count || photos.length,
      message: '图片数据获取成功'
    }
  } catch (error) {
    console.error('获取图片数据错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取图片数据失败，请检查网络连接'
    }
  }
}

/**
 * 获取最近的N张图片数据
 * @param {number} count - 图片数量
 * @returns {Promise} 返回图片数据
 */
export const getRecentImagesByCount = async (count = 5) => {
  try {
    console.log(`📸 获取最近的 ${count} 张图片...`)

    const response = await imageAnalysisHttp.get('/photos/')

    const data = response.data
    console.log('📥 API返回的原始图片列表:', data)

    // 处理API返回的数据结构 {count: number, photos: array}
    let photos = data.photos || data || []
    console.log('📸 提取的photos数组:', photos)
    console.log('📊 总图片数量:', photos.length)

    // 按日期排序（最新的在前）并取前N张
    if (Array.isArray(photos)) {
      photos = photos
        .sort((a, b) => new Date(b.date || b.timestamp || 0) - new Date(a.date || a.timestamp || 0))
        .slice(0, count)

      console.log(`✅ 成功获取最近的 ${photos.length} 张图片`)
      console.log('📋 图片详情:', photos.map(p => ({
        filename: p.filename,
        date: p.date,
        url: p.url
      })))
    }

    return {
      success: true,
      data: photos,
      count: photos.length,
      message: `成功获取最近的 ${photos.length} 张图片`
    }
  } catch (error) {
    console.error('获取图片数据错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取图片数据失败，请检查网络连接'
    }
  }
}

/**
 * 获取所有图片数据（用于实时展示）
 * @returns {Promise} 返回所有图片数据
 */
export const getAllImageData = async () => {
  try {
    console.log('📸 获取所有图片数据...')

    const response = await imageAnalysisHttp.get('/photos/')

    const data = response.data
    console.log('📥 API返回的原始图片列表:', data)

    // 处理API返回的数据结构 {count: number, photos: array}
    let photos = data.photos || data || []
    console.log('📸 提取的photos数组:', photos)
    console.log('📊 总图片数量:', photos.length)

    // 按日期排序（最新的在前）
    if (Array.isArray(photos)) {
      photos = photos.sort((a, b) => new Date(b.date || b.timestamp || 0) - new Date(a.date || a.timestamp || 0))

      console.log(`✅ 成功获取所有 ${photos.length} 张图片`)
      console.log('📋 图片详情:', photos.slice(0, 5).map(p => ({
        filename: p.filename,
        date: p.date,
        url: p.url
      })), photos.length > 5 ? `... 还有 ${photos.length - 5} 张图片` : '')
    }

    return {
      success: true,
      data: photos,
      count: photos.length,
      message: `成功获取所有 ${photos.length} 张图片`
    }
  } catch (error) {
    console.error('获取图片数据错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取图片数据失败，请检查网络连接'
    }
  }
}

/**
 * 获取图片文件数据
 * @param {Array} imageUrls - 图片URL列表
 * @returns {Promise<Array>} 图片文件数据列表
 */
const fetchImageFiles = async (imageUrls) => {
  console.log('📥 开始获取图片文件数据...')
  const imageFiles = []

  // 最多处理10张图片
  const urlsToProcess = imageUrls.slice(0, 10)
  console.log(`📊 处理图片数量: ${urlsToProcess.length} (最多10张)`)

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i]
    try {
      console.log(`📷 获取第${i + 1}张图片: ${url}`)

      const response = await axios.get(url, { responseType: 'blob' })

      const blob = response.data
      const filename = `image_${i + 1}.${blob.type.split('/')[1] || 'jpg'}`

      // 创建File对象
      const file = new File([blob], filename, { type: blob.type })

      imageFiles.push({
        file: file,
        filename: filename,
        size: blob.size,
        type: blob.type,
        url: url
      })

      console.log(`✅ 第${i + 1}张图片获取成功: ${filename} (${blob.size} bytes)`)
    } catch (error) {
      console.error(`❌ 第${i + 1}张图片获取失败:`, error)
    }
  }

  console.log(`🎉 成功获取 ${imageFiles.length} 张图片文件`)
  return imageFiles
}

/**
 * 发送数据到工作流进行智能分析
 * @param {Array} imageUrls - 图片URL列表
 * @param {string} userRequirement - 用户需求描述
 * @returns {Promise} 返回分析结果
 */
export const analyzeImageData = async (imageUrls, userRequirement) => {
  try {
    console.log('🎯 analyzeImageData 输入参数:')
    console.log('  - imageUrls:', imageUrls)
    console.log('  - imageUrls 类型:', typeof imageUrls)
    console.log('  - imageUrls 是否为数组:', Array.isArray(imageUrls))
    console.log('  - userRequirement:', userRequirement)

    // 获取图片文件数据
    console.log('📥 开始获取图片文件数据...')
    const imageFiles = await fetchImageFiles(imageUrls)

    if (imageFiles.length === 0) {
      throw new Error('无法获取任何图片文件数据')
    }

    // 将完整URL转换为相对路径数组（保留原有的picture参数以兼容）
    const relativePaths = imageUrls.slice(0, 10).map(url => {
      if (typeof url === 'string' && url.includes('/api/photos/')) {
        // 提取相对路径部分
        const match = url.match(/\/api\/photos\/.*/)
        return match ? match[0] : url
      }
      return url
    })

    console.log('🔄 转换后的相对路径数组:', relativePaths)
    const pictureString = JSON.stringify(relativePaths)
    console.log('🔄 picture参数 (兼容性):', pictureString)

    // 准备符合API文档的文件列表格式
    const pictureFileList = []
    // 使用环境变量配置的图片分析基础服务器地址，因为工作流服务器需要能够访问图片
    const BASE_URL = import.meta.env.VITE_ROBOT_UPPER_HOST

    for (const imageFile of imageFiles) {
      try {
        // 确保URL包含完整的域名前缀
        let fullUrl = imageFile.url
        if (fullUrl.startsWith('/')) {
          fullUrl = BASE_URL + fullUrl
        } else if (!fullUrl.startsWith('http')) {
          fullUrl = BASE_URL + '/' + fullUrl
        }

        // 根据API文档格式构建文件对象
        const fileObject = {
          type: 'image', // 文件类型：image
          transfer_method: 'remote_url', // 传递方式：远程URL
          url: fullUrl // 完整的图片URL
        }
        pictureFileList.push(fileObject)
        console.log(`📎 添加第${pictureFileList.length}张图片: ${imageFile.filename} -> ${fullUrl}`)
      } catch (error) {
        console.error(`❌ 处理图片失败: ${imageFile.filename}`, error)
      }
    }

    // 准备JSON请求数据
    const requestData = {
      inputs: {
        question: userRequirement,
        picture: pictureString, // 保留原有参数以兼容
        picturelist: pictureFileList // 使用符合API文档的文件列表格式
      },
      response_mode: 'streaming',
      user: 'abc-123'
    }

    console.log('🚀 发送到工作流的JSON数据:')
    console.log('  - question:', userRequirement)
    console.log('  - picture参数:', pictureString)
    console.log('  - picturelist文件数量:', pictureFileList.length)
    console.log('  - 文件详情:', pictureFileList.map(f => ({ type: f.type, method: f.transfer_method, url: f.url })))
    console.log('📡 请求URL: /v1/workflows/run')
    console.log('🔑 API密钥:', WORKFLOW_API_KEY ? '已设置' : '未设置')

    // 使用新的工作流接口URL，发送JSON数据
    const response = await axios.post('/v1/workflows/run', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKFLOW_API_KEY}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API响应错误详情:')
      console.error('   状态码:', response.status)
      console.error('   状态文本:', response.statusText)
      console.error('   响应内容:', errorText)
      console.error('   请求URL:', '/v1/workflows/run')
      console.error('   目标服务器:', import.meta.env.VITE_ROBOT_SIMULATION_HOST)
      console.error('   API密钥:', WORKFLOW_API_KEY)
      console.error('   请求数据:', JSON.stringify(requestData, null, 2))
      console.error('   图片文件数量:', pictureFileList.length)

      // 尝试解析错误响应
      try {
        const errorJson = JSON.parse(errorText)
        console.error('   解析后的错误:', errorJson)
      } catch (e) {
        console.error('   无法解析错误响应为JSON')
      }

      throw new Error(`图片分析请求失败: ${response.status} ${response.statusText}\n详情: ${errorText}`)
    }

    // 处理流式响应 (Server-Sent Events) - 参考语音分析的实现
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let finalAnswer = ''

    console.log('📡 开始读取流式响应...')

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        // 解析每一行数据
        const lines = chunk.split('\n')
        console.log(`📡 收到 ${lines.length} 行数据`)

        for (const line of lines) {
          if (line.trim() === '') continue // 跳过空行

          console.log('📄 处理行:', line.substring(0, 100) + (line.length > 100 ? '...' : ''))

          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6).trim() // 移除 "data: " 前缀
              if (jsonStr === '' || jsonStr === '[DONE]') {
                console.log('⏹️ 遇到结束标记或空数据')
                continue
              }

              // 检查JSON字符串是否完整
              if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
                console.warn('⚠️ JSON字符串格式异常，跳过:', jsonStr.substring(0, 100) + '...')
                continue
              }

              const data = JSON.parse(jsonStr)
              console.log('📦 解析成功的流式数据块:', {
                event: data.event,
                dataKeys: Object.keys(data.data || {}),
                hasResult: !!(data.data?.result),
                hasAnswer: !!(data.data?.answer),
                fullData: data
              })

              // 检查多种可能的结果事件类型
              if (data.event === 'result' || data.event === 'workflow_finished') {
                console.log('🎯 *** 找到结果事件 ***:', data.event, data)

                // 尝试从多个可能的字段中提取结果
                let extractedResult = null

                if (data.data?.result) {
                  extractedResult = data.data.result
                  console.log('✅ 从data.result提取:', extractedResult.substring(0, 200) + '...')
                } else if (data.data?.answer) {
                  extractedResult = data.data.answer
                  console.log('✅ 从data.answer提取:', extractedResult.substring(0, 200) + '...')
                } else if (data.data?.outputs?.answer) {
                  extractedResult = data.data.outputs.answer
                  console.log('✅ 从data.outputs.answer提取:', extractedResult.substring(0, 200) + '...')
                } else if (data.data?.outputs?.result) {
                  extractedResult = data.data.outputs.result
                  console.log('✅ 从data.outputs.result提取:', extractedResult.substring(0, 200) + '...')
                } else if (typeof data.data === 'string') {
                  extractedResult = data.data
                  console.log('✅ 直接使用data字符串:', extractedResult.substring(0, 200) + '...')
                } else {
                  console.log('⚠️ 结果事件中未找到预期字段')
                  console.log('⚠️ 可用字段:', Object.keys(data.data || {}))
                  console.log('⚠️ 完整数据结构:', JSON.stringify(data, null, 2))

                  // 尝试深度搜索所有字段
                  const searchForAnswer = (obj, path = '') => {
                    if (typeof obj === 'string' && obj.length > 10) {
                      console.log(`🔍 在 ${path} 找到字符串:`, obj.substring(0, 100) + '...')
                      return obj
                    }
                    if (typeof obj === 'object' && obj !== null) {
                      for (const [key, value] of Object.entries(obj)) {
                        const result = searchForAnswer(value, path ? `${path}.${key}` : key)
                        if (result) return result
                      }
                    }
                    return null
                  }

                  extractedResult = searchForAnswer(data.data)
                }

                if (extractedResult) {
                  finalAnswer = extractedResult
                  console.log('✅ *** 成功提取最终结果 ***:', finalAnswer.substring(0, 200) + '...')
                }
              }

              // 收集所有可能包含内容的事件
              if (data.event === 'text_chunk' || data.event === 'llm_chunk' || data.event === 'agent_thought') {
                let chunkContent = null

                if (data.data?.answer) {
                  chunkContent = data.data.answer
                } else if (data.data?.text) {
                  chunkContent = data.data.text
                } else if (data.data?.content) {
                  chunkContent = data.data.content
                } else if (typeof data.data === 'string') {
                  chunkContent = data.data
                }

                if (chunkContent) {
                  console.log(`📝 收集${data.event}内容:`, chunkContent.substring(0, 50) + '...')
                  // 累积所有文本块，最后会被最终结果覆盖（如果有的话）
                  if (!finalAnswer) finalAnswer = ''
                  finalAnswer += chunkContent
                }
              }

              // 检查其他可能的事件类型
              if (data.event && !['result', 'text_chunk', 'workflow_started', 'node_started', 'node_finished'].includes(data.event)) {
                console.log('🔍 发现未知事件类型:', data.event, data)
              }

            } catch (parseError) {
              console.error('❌ 解析流式数据失败:', parseError.message)
              console.error('❌ 原始数据:', line)
              const jsonStr = line.substring(6).trim()
              console.error('❌ JSON字符串长度:', jsonStr.length)
              console.error('❌ JSON字符串开头:', jsonStr.substring(0, 100))
              console.error('❌ JSON字符串结尾:', jsonStr.substring(Math.max(0, jsonStr.length - 100)))

              // 如果是未终止的字符串错误，记录详细信息
              if (parseError.message.includes('Unterminated string')) {
                console.warn('⚠️ 检测到未终止的字符串，可能是数据传输不完整')
                console.warn('⚠️ 这通常是由于网络传输中断或服务器响应被截断导致的')
              }
            }
          } else {
            console.log('⚠️ 非data:行:', line.substring(0, 50))
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    console.log('✅ 流式响应完成')
    console.log('📝 最终答案长度:', finalAnswer.length)
    console.log('📝 最终答案内容:', finalAnswer || '(空)')
    console.log('📝 完整响应长度:', fullResponse.length)
    console.log('📝 完整响应预览:', fullResponse.substring(0, 500) + (fullResponse.length > 500 ? '...' : ''))

    // 检查是否获取到有效结果
    if (!finalAnswer || finalAnswer.trim() === '') {
      console.warn('⚠️ 未获取到有效的分析结果')
      console.warn('📝 完整响应内容:', fullResponse)

      // 尝试从完整响应中提取内容
      if (fullResponse.includes('answer') || fullResponse.includes('result')) {
        console.log('🔍 尝试从完整响应中提取结果...')
        // 尝试简单的正则表达式提取
        const answerMatch = fullResponse.match(/"answer":\s*"([^"]+)"/);
        const resultMatch = fullResponse.match(/"result":\s*"([^"]+)"/);

        if (answerMatch) {
          finalAnswer = answerMatch[1];
          console.log('✅ 通过正则表达式提取到answer:', finalAnswer.substring(0, 100) + '...');
        } else if (resultMatch) {
          finalAnswer = resultMatch[1];
          console.log('✅ 通过正则表达式提取到result:', finalAnswer.substring(0, 100) + '...');
        } else {
          finalAnswer = '分析完成，但未获取到具体内容。请查看控制台日志了解详情。'
        }
      } else {
        finalAnswer = '分析完成，但未获取到具体内容。'
      }
    }

    const finalResult = {
      success: true,
      data: finalAnswer,
      message: '图片分析完成'
    }
    console.log('🎯 最终返回结果:', finalResult)
    return finalResult
  } catch (error) {
    console.error('图片分析错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '图片分析失败，请稍后重试'
    }
  }
}

/**
 * 验证用户输入
 * @param {string} userRequirement - 用户需求描述
 * @param {number} timeRange - 时间范围
 * @returns {Object} 验证结果
 */
export const validateInput = (userRequirement, timeRange) => {
  const errors = []

  if (!userRequirement || userRequirement.trim().length === 0) {
    errors.push('请输入需求描述')
  }

  if (!timeRange || timeRange <= 0) {
    errors.push('请选择有效的时间范围')
  }

  if (userRequirement && userRequirement.trim().length > 1000) {
    errors.push('需求描述不能超过1000个字符')
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 格式化图片数据用于显示
 * @param {Array} imageData - 原始图片数据
 * @returns {Object} 格式化后的数据
 */
export const formatImageDataForDisplay = (imageData) => {
  if (!imageData || !Array.isArray(imageData)) {
    return {
      displayText: '暂无图片数据',
      imageUrls: [],
      count: 0
    }
  }

  if (imageData.length === 0) {
    return {
      displayText: '选定时间范围内暂无图片记录',
      imageUrls: [],
      count: 0
    }
  }

  console.log('🔧 formatImageDataForDisplay 输入数据:', imageData)

  const imageUrls = imageData.map((item, index) => {
    console.log(`📷 处理第${index + 1}张图片:`, item)

    // 处理不同的数据结构
    if (typeof item === 'string') {
      console.log(`✅ 第${index + 1}张图片是字符串URL:`, item)
      return item // 直接是URL字符串
    }

    // 根据API返回的数据结构，使用url字段（图片内容URL）
    let url = item.url || item.image_url || item.path || item.src || ''
    console.log(`🔗 第${index + 1}张图片原始URL:`, url)

    // 如果是相对路径，保持相对路径使用代理
    if (url && url.startsWith('/api/')) {
      // 保持相对路径，通过代理访问避免CORS问题
      console.log(`🌐 第${index + 1}张图片代理URL:`, url)
    }

    return url
  }).filter(url => url) // 过滤空值

  console.log('✨ 最终提取的图片URLs:', imageUrls)

  const displayText = imageData.map((item, index) => {
    // 处理API返回的日期格式 (ISO格式)
    const timestamp = item.date ? new Date(item.date).toLocaleString() : '未知时间'
    const filename = item.filename || item.name || `图片${index + 1}`
    const size = item.size ? formatFileSize(item.size) : ''
    const sizeKb = item.size_kb ? `${item.size_kb.toFixed(2)} KB` : ''

    let info = `[${index + 1}] ${timestamp}\n文件名: ${filename}`
    if (size) info += `\n大小: ${size}`
    if (sizeKb && !size) info += `\n大小: ${sizeKb}` // 如果没有字节大小，显示KB大小
    if (item.url) info += `\n图片URL: ${item.url}`

    return info
  }).join('\n\n')

  return {
    displayText: displayText,
    imageUrls: imageUrls,
    count: imageData.length
  }
}

/**
 * 格式化分析结果用于显示
 * @param {Object} analysisResult - 分析结果数据
 * @returns {string} 格式化后的结果文本
 */
/**
 * 清理和格式化文本内容
 * @param {string} text - 原始文本
 * @returns {string} 清理后的文本
 */
const cleanAndFormatText = (text) => {
  if (!text || typeof text !== 'string') {
    return '无有效内容'
  }

  // 移除HTML标签
  let cleanText = text.replace(/<[^>]*>/g, '')

  // 移除多余的空白字符
  cleanText = cleanText.replace(/\s+/g, ' ').trim()

  // 如果内容过长，截取前2000个字符
  if (cleanText.length > 2000) {
    cleanText = cleanText.substring(0, 2000) + '\n\n... (内容过长，已截取前2000字符)'
  }

  // 如果内容为空或只包含特殊字符，返回提示
  if (!cleanText || cleanText.length < 10) {
    return '分析结果内容较短或格式异常，请查看原始响应'
  }

  return cleanText
}

export const formatAnalysisResult = (analysisResult) => {
  console.log('🔧 formatAnalysisResult 输入:', analysisResult)
  console.log('🔧 输入类型:', typeof analysisResult)

  if (!analysisResult) {
    console.log('⚠️ 分析结果为空')
    return '分析结果为空'
  }

  try {
    // 如果结果是字符串，清理后返回
    if (typeof analysisResult === 'string') {
      console.log('📝 处理字符串类型结果')
      const cleaned = cleanAndFormatText(analysisResult)
      console.log('✨ 清理后的字符串结果:', cleaned.substring(0, 100) + '...')
      return cleaned
    }

    // 如果结果是对象，尝试格式化
    if (typeof analysisResult === 'object') {
      console.log('📦 处理对象类型结果')
      console.log('🔍 对象键:', Object.keys(analysisResult))

      // 检查常见的结果字段
      if (analysisResult.answer) {
        console.log('✅ 找到 answer 字段')
        return cleanAndFormatText(analysisResult.answer)
      }
      if (analysisResult.result) {
        console.log('✅ 找到 result 字段')
        return cleanAndFormatText(analysisResult.result)
      }
      if (analysisResult.analysis) {
        console.log('✅ 找到 analysis 字段')
        return cleanAndFormatText(analysisResult.analysis)
      }
      if (analysisResult.content) {
        console.log('✅ 找到 content 字段')
        return cleanAndFormatText(analysisResult.content)
      }
      if (analysisResult.message) {
        console.log('✅ 找到 message 字段')
        return cleanAndFormatText(analysisResult.message)
      }

      // 如果没有明确的结果字段，格式化整个对象
      console.log('⚠️ 未找到标准字段，格式化整个对象')
      const jsonString = JSON.stringify(analysisResult, null, 2)
      return cleanAndFormatText(jsonString)
    }

    console.log('🔄 转换为字符串处理')
    const stringResult = cleanAndFormatText(String(analysisResult))
    console.log('✨ 最终格式化结果:', stringResult.substring(0, 100) + '...')
    return stringResult
  } catch (error) {
    console.error('❌ 格式化分析结果时出错:', error)
    return '结果格式化失败，请查看控制台获取详细信息'
  }
}

/**
 * 获取时间范围选项
 * @returns {Array} 时间范围选项数组
 */
export const getTimeRangeOptions = () => {
  return [
    { value: 1, label: '1分钟' },
    { value: 5, label: '5分钟' },
    { value: 10, label: '10分钟' },
    { value: 15, label: '15分钟' },
    { value: 30, label: '30分钟' },
    { value: 60, label: '1小时' }
  ]
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 提取图片URL列表用于分析
 * @param {Array} imageData - 图片数据
 * @returns {Array} URL列表
 */
export const extractImageUrls = (imageData) => {
  console.log('🎯 extractImageUrls 输入数据:', imageData)

  if (!imageData || !Array.isArray(imageData)) {
    console.log('⚠️ 输入数据无效或不是数组')
    return []
  }

  const urls = imageData.map((item, index) => {
    console.log(`🔍 提取第${index + 1}张图片URL:`, item)

    if (typeof item === 'string') {
      console.log(`✅ 第${index + 1}张是字符串URL:`, item)
      return item
    }

    // 根据API返回的数据结构，使用url字段
    let url = item.url || item.image_url || item.path || item.src || ''
    console.log(`📎 第${index + 1}张原始URL:`, url)

    // 如果是相对路径，保持相对路径使用代理
    if (url && url.startsWith('/api/')) {
      // 保持相对路径，通过代理访问避免CORS问题
      console.log(`🌍 第${index + 1}张代理URL:`, url)
    }

    return url
  }).filter(url => url && url.trim() !== '')

  console.log('🎉 最终提取的URLs用于分析:', urls)
  return urls
}

/**
 * 验证图片URL是否有效
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>} 是否有效
 */
export const validateImageUrl = async (url) => {
  try {
    const response = await axios.head(url)
    return response.status === 200 && response.headers['content-type']?.startsWith('image/')
  } catch (error) {
    return false
  }
}

/**
 * 批量验证图片URL
 * @param {Array} urls - URL列表
 * @returns {Promise<Array>} 验证结果
 */
export const validateImageUrls = async (urls) => {
  const results = await Promise.allSettled(
    urls.map(url => validateImageUrl(url))
  )

  return results.map((result, index) => ({
    url: urls[index],
    isValid: result.status === 'fulfilled' && result.value
  }))
}


