/**
 * 舌苔检测相关API接口
 */

// API基础配置
const API_BASE_URL = '/api'
// 舌苔检测API密钥
const TONGUE_ANALYSIS_API_KEY = 'app-iG8gN13CiOL7F8GcT7TMqQpq'

/**
 * 获取指定时间范围内的照片数据
 * @param {number} minutes - 时间范围（分钟）
 * @returns {Promise} 返回照片数据
 */
export const getRecentPhotoData = async (minutes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/photos/recent/${minutes}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`获取照片数据失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 API返回的原始照片数据:', data)

    // 处理API返回的数据结构 {count: number, photos: array}
    const photos = data.photos || []
    console.log('📸 提取的photos数组:', photos)
    console.log('📊 photos数量:', photos.length)

    return {
      success: true,
      data: photos, // 返回photos数组而不是整个data对象
      count: data.count || photos.length,
      message: '照片数据获取成功'
    }
  } catch (error) {
    console.error('获取照片数据错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取照片数据失败，请检查网络连接'
    }
  }
}

/**
 * 获取照片文件数据
 * @param {Array} photoUrls - 照片URL列表
 * @returns {Promise<Array>} 照片文件数据列表
 */
const fetchPhotoFiles = async (photoUrls) => {
  console.log('📥 开始获取照片文件数据...')
  const photoFiles = []

  // 最多处理5张照片
  const urlsToProcess = photoUrls.slice(0, 5)
  console.log(`📊 处理照片数量: ${urlsToProcess.length} (最多5张)`)

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i]
    try {
      console.log(`📷 获取第${i + 1}张照片: ${url}`)

      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`⚠️ 第${i + 1}张照片获取失败: ${response.status}`)
        continue
      }

      const blob = await response.blob()
      const filename = `tongue_photo_${i + 1}.${blob.type.split('/')[1] || 'jpg'}`

      // 创建File对象
      const file = new File([blob], filename, { type: blob.type })

      photoFiles.push({
        file: file,
        filename: filename,
        size: blob.size,
        type: blob.type,
        url: url
      })

      console.log(`✅ 第${i + 1}张照片获取成功: ${filename} (${blob.size} bytes)`)
    } catch (error) {
      console.error(`❌ 第${i + 1}张照片获取失败:`, error)
    }
  }

  console.log(`🎉 成功获取 ${photoFiles.length} 张照片文件`)
  return photoFiles
}

/**
 * 发送数据到工作流进行舌苔检测分析
 * @param {Array} photoUrls - 照片URL列表
 * @param {string} userPrompt - 用户提示词
 * @returns {Promise} 返回分析结果
 */
export const analyzeTongueData = async (photoUrls, userPrompt) => {
  try {
    console.log('🎯 analyzeTongueData 输入参数:')
    console.log('  - photoUrls:', photoUrls)
    console.log('  - photoUrls 类型:', typeof photoUrls)
    console.log('  - photoUrls 是否为数组:', Array.isArray(photoUrls))
    console.log('  - userPrompt:', userPrompt)

    // 获取照片文件数据
    console.log('📥 开始获取照片文件数据...')
    const photoFiles = await fetchPhotoFiles(photoUrls)

    if (photoFiles.length === 0) {
      throw new Error('无法获取任何照片文件数据')
    }

    console.log('🔄 开始处理照片文件...')

    // 准备符合API文档的文件列表格式
    const pictureFileList = []

    for (const photoFile of photoFiles) {
      try {
        // 构建完整的图片URL
        let photoUrl = photoFile.url
        
        // 如果URL是相对路径，构建完整URL
        if (photoUrl.startsWith('/api/')) {
          // 使用摄像头API的目标服务器地址
          photoUrl = `http://192.168.0.119:5001${photoUrl}`
          console.log(`📎 添加第${pictureFileList.length + 1}张照片: ${photoFile.filename} -> ${photoUrl}`)
        } else if (photoUrl.startsWith('http')) {
          // 如果是完整URL，检查是否需要修改域名
          if (photoUrl.includes('blog.u2829437.nyat.app')) {
            // 替换为正确的服务器地址
            photoUrl = photoUrl.replace('https://blog.u2829437.nyat.app:25855', 'http://192.168.0.119:5001')
            console.log(`📎 添加第${pictureFileList.length + 1}张照片: ${photoFile.filename} -> ${photoUrl}`)
          } else {
            console.log(`📎 添加第${pictureFileList.length + 1}张照片: ${photoFile.filename} -> ${photoUrl}`)
          }
        } else {
          console.warn(`⚠️ 无效的照片URL格式: ${photoUrl}`)
          continue
        }

        // 根据API文档格式构建文件对象
        const fileObject = {
          type: 'image', // 文件类型：image
          transfer_method: 'remote_url', // 传递方式：远程URL
          url: photoUrl // 使用相对路径
        }
        pictureFileList.push(fileObject)
      } catch (error) {
        console.error(`❌ 处理照片失败: ${photoFile.filename}`, error)
      }
    }

    // 准备JSON请求数据
    const requestData = {
      inputs: {
        question: userPrompt,
        picture: pictureFileList // 直接使用文件列表格式
      },
      response_mode: 'streaming',
      user: 'abc-123'
    }

    console.log('🚀 发送到舌苔检测工作流的JSON数据:')
    console.log('  - question:', userPrompt)
    console.log('  - picture文件数量:', pictureFileList.length)
    console.log('  - 文件详情:', pictureFileList.map(f => ({ type: f.type, method: f.transfer_method, url: f.url })))
    console.log('📡 请求URL: /v1/workflows/run')
    console.log('🔑 API密钥:', TONGUE_ANALYSIS_API_KEY ? '已设置' : '未设置')

    // 使用舌苔检测工作流接口URL，发送JSON数据
    const response = await fetch('/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TONGUE_ANALYSIS_API_KEY}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API响应错误详情:')
      console.error('   状态码:', response.status)
      console.error('   状态文本:', response.statusText)
      console.error('   响应内容:', errorText)
      console.error('   请求URL:', '/v1/workflows/run')
      console.error('   目标服务器:', 'http://192.168.0.103')
      console.error('   API密钥:', TONGUE_ANALYSIS_API_KEY)
      console.error('   请求数据:', JSON.stringify(requestData, null, 2))
      console.error('   照片文件数量:', pictureFileList.length)

      // 尝试解析错误响应
      try {
        const errorJson = JSON.parse(errorText)
        console.error('   解析后的错误:', errorJson)
      } catch (e) {
        console.error('   无法解析错误响应为JSON')
      }

      throw new Error(`舌苔检测请求失败: ${response.status} ${response.statusText}\n详情: ${errorText}`)
    }

    // 处理流式响应 (Server-Sent Events)
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
      console.warn('⚠️ 未获取到有效的检测结果')
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
          finalAnswer = '检测完成，但未获取到具体内容。请查看控制台日志了解详情。'
        }
      } else {
        finalAnswer = '检测完成，但未获取到具体内容。'
      }
    }

    const finalResult = {
      success: true,
      data: finalAnswer,
      message: '舌苔检测完成'
    }
    console.log('🎯 最终返回结果:', finalResult)
    return finalResult
  } catch (error) {
    console.error('舌苔检测错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '舌苔检测失败，请稍后重试'
    }
  }
}

/**
 * 验证用户输入
 * @param {string} userPrompt - 用户提示词
 * @param {Array} selectedPhotos - 选中的照片
 * @returns {Object} 验证结果
 */
export const validateTongueInput = (userPrompt, selectedPhotos) => {
  const errors = []

  if (!userPrompt || userPrompt.trim().length === 0) {
    errors.push('请输入提示词')
  }

  if (!selectedPhotos || selectedPhotos.length === 0) {
    errors.push('请选择至少一张舌苔照片')
  }

  if (userPrompt && userPrompt.trim().length > 500) {
    errors.push('提示词不能超过500个字符')
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

/**
 * 格式化照片数据用于显示
 * @param {Array} photoData - 原始照片数据
 * @returns {Object} 格式化后的数据
 */
export const formatPhotoDataForDisplay = (photoData) => {
  if (!photoData || !Array.isArray(photoData)) {
    return {
      displayText: '暂无照片数据',
      photoUrls: [],
      count: 0
    }
  }

  if (photoData.length === 0) {
    return {
      displayText: '暂无照片记录',
      photoUrls: [],
      count: 0
    }
  }

  console.log('🔧 formatPhotoDataForDisplay 输入数据:', photoData)

  const photoUrls = photoData.map((item, index) => {
    console.log(`📷 处理第${index + 1}张照片:`, item)

    // 处理不同的数据结构
    if (typeof item === 'string') {
      console.log(`✅ 第${index + 1}张照片是字符串URL:`, item)
      return item // 直接是URL字符串
    }

    // 根据API返回的数据结构，使用url字段（照片内容URL）
    let url = item.url || item.image_url || item.path || item.src || ''
    console.log(`🔗 第${index + 1}张照片原始URL:`, url)

    // 如果是相对路径，保持相对路径使用代理
    if (url && url.startsWith('/api/')) {
      // 保持相对路径，通过代理访问避免CORS问题
      console.log(`🌐 第${index + 1}张照片代理URL:`, url)
    }

    return url
  }).filter(url => url) // 过滤空值

  console.log('✨ 最终提取的照片URLs:', photoUrls)

  const displayText = photoData.map((item, index) => {
    // 处理API返回的日期格式 (ISO格式)
    const timestamp = item.date ? new Date(item.date).toLocaleString() : '未知时间'
    const filename = item.filename || item.name || `照片${index + 1}`
    const size = item.size ? formatFileSize(item.size) : ''
    const sizeKb = item.size_kb ? `${item.size_kb.toFixed(2)} KB` : ''

    let info = `[${index + 1}] ${timestamp}\n文件名: ${filename}`
    if (size) info += `\n大小: ${size}`
    if (sizeKb && !size) info += `\n大小: ${sizeKb}` // 如果没有字节大小，显示KB大小
    if (item.url) info += `\n照片URL: ${item.url}`

    return info
  }).join('\n\n')

  return {
    displayText: displayText,
    photoUrls: photoUrls,
    count: photoData.length
  }
}

/**
 * 格式化检测结果用于显示
 * @param {Object} analysisResult - 检测结果数据
 * @returns {string} 格式化后的结果文本
 */
export const formatTongueAnalysisResult = (analysisResult) => {
  console.log('🔧 formatTongueAnalysisResult 输入:', analysisResult)
  console.log('🔧 输入类型:', typeof analysisResult)

  if (!analysisResult) {
    console.log('⚠️ 检测结果为空')
    return '检测结果为空'
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
    console.error('❌ 格式化检测结果时出错:', error)
    return '结果格式化失败，请查看控制台获取详细信息'
  }
}

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
    return '检测结果内容较短或格式异常，请查看原始响应'
  }

  return cleanText
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
 * 提取照片URL列表用于分析
 * @param {Array} photoData - 照片数据
 * @returns {Array} URL列表
 */
export const extractPhotoUrls = (photoData) => {
  console.log('🎯 extractPhotoUrls 输入数据:', photoData)

  if (!photoData || !Array.isArray(photoData)) {
    console.log('⚠️ 输入数据无效或不是数组')
    return []
  }

  const urls = photoData.map((item, index) => {
    console.log(`🔍 提取第${index + 1}张照片URL:`, item)

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
 * 验证照片URL是否有效
 * @param {string} url - 照片URL
 * @returns {Promise<boolean>} 是否有效
 */
export const validatePhotoUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok && response.headers.get('content-type')?.startsWith('image/')
  } catch (error) {
    return false
  }
}

/**
 * 批量验证照片URL
 * @param {Array} urls - URL列表
 * @returns {Promise<Array>} 验证结果
 */
export const validatePhotoUrls = async (urls) => {
  const results = await Promise.allSettled(
    urls.map(url => validatePhotoUrl(url))
  )

  return results.map((result, index) => ({
    url: urls[index],
    isValid: result.status === 'fulfilled' && result.value
  }))
} 