/**
 * 智能图片分析相关API接口
 */

// API基础配置
const API_BASE_URL = '/api'
// 视觉（图片分析）API密钥
const WORKFLOW_API_KEY = 'app-oj3AJTDYGkfU2OxyIsY7LR1o'

/**
 * 获取指定时间范围内的图片数据
 * @param {number} minutes - 时间范围（分钟）
 * @returns {Promise} 返回图片数据
 */
export const getRecentImageData = async (minutes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/photos/recent/${minutes}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`获取图片数据失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
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

    // 将完整URL转换为相对路径数组
    const relativePaths = imageUrls.map(url => {
      if (typeof url === 'string' && url.includes('/api/photos/')) {
        // 提取相对路径部分
        const match = url.match(/\/api\/photos\/.*/)
        return match ? match[0] : url
      }
      return url
    })

    console.log('🔄 转换后的相对路径数组:', relativePaths)
    console.log('🔄 relativePaths 类型:', typeof relativePaths)
    console.log('🔄 relativePaths 是否为数组:', Array.isArray(relativePaths))
    console.log('🔄 relativePaths 长度:', relativePaths.length)

    // 组合分析数据 - 将数组转换为字符串格式
    console.log('🔄 图片路径数组（JSON格式）:', relativePaths)

    // 测试 JSON.stringify 行为
    console.log('🧪 测试 JSON.stringify 行为:')
    const testArray = ["/api/photos/test1.jpg/content", "/api/photos/test2.jpg/content"]
    const testStringified = JSON.stringify(testArray)
    console.log('  - 测试数组:', testArray)
    console.log('  - JSON.stringify 结果:', testStringified)
    console.log('  - 结果类型:', typeof testStringified)

    // 确保数组格式正确，然后转换为字符串
    let pictureString

    // 多重验证确保正确的JSON数组格式
    if (Array.isArray(relativePaths)) {
      pictureString = JSON.stringify(relativePaths)
    } else {
      console.error('❌ relativePaths 不是数组:', relativePaths)
      // 如果不是数组，尝试修复
      const fixedArray = Array.isArray(relativePaths) ? relativePaths : [relativePaths].filter(Boolean)
      pictureString = JSON.stringify(fixedArray)
    }

    // 额外验证：确保结果是正确的JSON数组格式
    if (!pictureString.startsWith('[') || !pictureString.endsWith(']')) {
      console.error('❌ JSON.stringify 结果格式不正确:', pictureString)
      // 强制修复格式
      try {
        const parsed = JSON.parse(pictureString)
        if (Array.isArray(parsed)) {
          pictureString = JSON.stringify(parsed)
        } else {
          pictureString = JSON.stringify([parsed])
        }
      } catch (e) {
        console.error('❌ 无法修复格式，使用原始数组:', e)
        pictureString = JSON.stringify(relativePaths)
      }
    }
    console.log('🔄 转换为字符串格式的图片路径:', pictureString)
    console.log('🔄 pictureString 类型:', typeof pictureString)
    console.log('🔄 pictureString 长度:', pictureString.length)
    console.log('🔄 pictureString 是否以[开头:', pictureString.startsWith('['))
    console.log('🔄 pictureString 是否以]结尾:', pictureString.endsWith(']'))

    // 验证是否与测试结果一致
    console.log('🔍 验证结果格式:')
    console.log('  - 期望格式: ["path1","path2"]')
    console.log('  - 实际格式:', pictureString)
    console.log('  - 格式正确:', pictureString.startsWith('[') && pictureString.endsWith(']'))

    const analysisData = {
      inputs: {
        question: userRequirement,
        picture: pictureString // 使用字符串格式，后端期望字符串
      },
      response_mode: "streaming",
      user: "abc-123"
    }

    console.log('🚀 发送到工作流的数据:', JSON.stringify(analysisData, null, 2))
    console.log('📡 请求URL: /v1/workflows/run')
    console.log('🔑 API密钥:', WORKFLOW_API_KEY ? '已设置' : '未设置')

    // 额外验证发送的数据
    const requestBody = JSON.stringify(analysisData)
    console.log('📦 实际发送的请求体:', requestBody)
    console.log('📦 请求体中的picture字段:', analysisData.inputs.picture)
    console.log('📦 picture字段类型:', typeof analysisData.inputs.picture)

    // 使用新的工作流接口URL
    const response = await fetch('/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKFLOW_API_KEY}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(analysisData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API响应错误详情:')
      console.error('   状态码:', response.status)
      console.error('   状态文本:', response.statusText)
      console.error('   响应内容:', errorText)
      console.error('   请求URL:', '/v1/workflows/run')
      console.error('   目标服务器:', 'http://192.168.0.103')
      console.error('   API密钥:', WORKFLOW_API_KEY)
      console.error('   请求数据:', JSON.stringify(analysisData, null, 2))

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
              console.error('❌ JSON字符串:', line.substring(6).trim())
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

    // 如果是相对路径，转换为完整URL
    if (url && url.startsWith('/api/')) {
      // 使用实际的后端服务器地址构建完整URL
      url = `http://192.168.0.119:5001${url}`
      console.log(`🌐 第${index + 1}张图片完整URL:`, url)
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

    // 如果是相对路径，转换为完整URL
    if (url && url.startsWith('/api/')) {
      // 使用实际的后端服务器地址构建完整URL
      url = `http://192.168.0.119:5001${url}`
      console.log(`🌍 第${index + 1}张完整URL:`, url)
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
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok && response.headers.get('content-type')?.startsWith('image/')
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
