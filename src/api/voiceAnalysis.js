/**
 * 智能语音分析相关API接口
 */

// API基础配置
const API_BASE_URL = '/api'
// 听觉（语音分析）API密钥
const WORKFLOW_API_KEY = 'app-h6jzZoq3N4iLNrS2dWbCFe74'

/**
 * 获取指定时间范围内的语音识别数据
 * @param {number} minutes - 时间范围（分钟）
 * @returns {Promise} 返回语音识别数据
 */
export const getRecentVoiceData = async (minutes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asr/recent?minutes=${minutes}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`获取语音数据失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 API返回的原始语音数据:', data)

    // 处理API返回的数据结构，提取results数组
    const voiceResults = data.data?.results || data.results || data.data || []
    console.log('🎤 提取的语音结果:', voiceResults)

    return {
      success: true,
      data: voiceResults, // 返回results数组而不是整个data对象
      count: voiceResults.length,
      message: data.message || '语音数据获取成功'
    }
  } catch (error) {
    console.error('获取语音数据错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取语音数据失败，请检查网络连接'
    }
  }
}

/**
 * 发送数据到工作流进行智能分析
 * @param {string} voiceText - 语音识别文本
 * @param {string} userRequirement - 用户需求描述
 * @returns {Promise} 返回分析结果
 */
export const analyzeVoiceData = async (voiceText, userRequirement) => {
  try {
    // 组合分析数据 - 按照新的接口格式
    const analysisData = {
      inputs: {
        question: userRequirement,
        conversation: voiceText // 语音文本（如果是多段文本，应该用逗号分隔）
      },
      response_mode: "streaming",
      user: "abc-123"
    }

    console.log('🚀 发送到语音工作流的数据:', JSON.stringify(analysisData, null, 2))
    console.log('📡 请求URL: /v1/workflows/run')
    console.log('🔑 API密钥:', WORKFLOW_API_KEY ? '已设置' : '未设置')

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
      console.error('❌ 语音分析API响应错误详情:')
      console.error('   状态码:', response.status)
      console.error('   状态文本:', response.statusText)
      console.error('   响应内容:', errorText)
      console.error('   请求URL:', '/v1/workflows/run')
      console.error('   目标服务器:', import.meta.env.VITE_ROBOT_SIMULATION_HOST)
      console.error('   API密钥:', WORKFLOW_API_KEY)
      console.error('   请求数据:', JSON.stringify(analysisData, null, 2))

      // 尝试解析错误响应
      try {
        const errorJson = JSON.parse(errorText)
        console.error('   解析后的错误:', errorJson)
      } catch (e) {
        console.error('   无法解析错误响应为JSON')
      }

      throw new Error(`语音分析请求失败: ${response.status} ${response.statusText}\n详情: ${errorText}`)
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

    if (!finalAnswer.trim()) {
      console.warn('⚠️ 未获取到有效的分析结果，尝试从完整响应中提取')
      // 尝试从完整响应中提取内容
      const lines = fullResponse.split('\n')
      for (const line of lines) {
        if (line.includes('"event":"result"')) {
          try {
            const jsonStr = line.substring(6).trim() // 移除 "data: " 前缀
            const data = JSON.parse(jsonStr)
            if (data.data?.result) {
              finalAnswer = data.data.result
              console.log('🔄 从完整响应中提取到result:', finalAnswer.substring(0, 100) + '...')
              break
            } else if (data.data?.answer) {
              finalAnswer = data.data.answer
              console.log('🔄 从完整响应中提取到answer:', finalAnswer.substring(0, 100) + '...')
              break
            }
          } catch (e) {
            console.warn('提取result失败:', e)
          }
        } else if (line.includes('"answer"')) {
          try {
            const match = line.match(/"answer":"([^"]*)"/)
            if (match && match[1]) {
              finalAnswer += match[1]
            }
          } catch (e) {
            console.warn('提取答案失败:', e)
          }
        }
      }
    }

    const result = {
      answer: finalAnswer || '分析完成，但未获取到具体内容',
      fullResponse: fullResponse
    }

    const finalResult = {
      success: true,
      data: result,
      message: '语音分析完成'
    }
    console.log('🎯 最终返回结果:', finalResult)
    return finalResult
  } catch (error) {
    console.error('语音分析错误:', error)
    return {
      success: false,
      data: null,
      message: error.message || '语音分析失败，请稍后重试'
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
 * 格式化语音数据用于显示
 * @param {Array} voiceData - 原始语音数据
 * @returns {string} 格式化后的文本
 */
export const formatVoiceDataForDisplay = (voiceData) => {
  console.log('🔧 formatVoiceDataForDisplay 输入数据:', voiceData)
  console.log('🔧 数据类型:', typeof voiceData, '是否为数组:', Array.isArray(voiceData))

  if (!voiceData || !Array.isArray(voiceData)) {
    console.log('⚠️ 语音数据无效或不是数组')
    return '暂无语音数据'
  }

  if (voiceData.length === 0) {
    console.log('⚠️ 语音数据数组为空')
    return '选定时间范围内暂无语音识别记录'
  }

  console.log(`📝 开始格式化 ${voiceData.length} 条语音记录`)

  const formattedText = voiceData.map((item, index) => {
    console.log(`🎤 处理第${index + 1}条记录:`, item)

    const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN') : '未知时间'
    const text = item.text || item.content || '无文本内容'
    const confidence = item.confidence ? `(置信度: ${(item.confidence * 100).toFixed(1)}%)` : ''

    const formatted = `[${index + 1}] ${timestamp}\n${text} ${confidence}\n`
    console.log(`✨ 格式化结果:`, formatted)
    return formatted
  }).join('\n')

  console.log('🎯 最终格式化文本:', formattedText)
  return formattedText
}

/**
 * 格式化分析结果用于显示
 * @param {Object} analysisResult - 分析结果数据
 * @returns {string} 格式化后的结果文本
 */
export const formatAnalysisResult = (analysisResult) => {
  if (!analysisResult) {
    return '分析结果为空'
  }

  try {
    // 如果结果是字符串，直接返回
    if (typeof analysisResult === 'string') {
      return analysisResult
    }

    // 如果结果是对象，尝试格式化
    if (typeof analysisResult === 'object') {
      console.log('🔍 分析结果对象字段:', Object.keys(analysisResult))

      // 优先检查 answer 字段（新的流式响应格式）
      if (analysisResult.answer) {
        console.log('✅ 找到answer字段:', analysisResult.answer.substring(0, 100) + '...')
        return analysisResult.answer
      }

      // 检查其他常见的结果字段
      if (analysisResult.result) {
        return analysisResult.result
      }
      if (analysisResult.analysis) {
        return analysisResult.analysis
      }
      if (analysisResult.content) {
        return analysisResult.content
      }
      if (analysisResult.message) {
        return analysisResult.message
      }

      // 如果没有明确的结果字段，格式化整个对象
      console.warn('⚠️ 未找到预期的结果字段，返回JSON格式')
      return JSON.stringify(analysisResult, null, 2)
    }

    return String(analysisResult)
  } catch (error) {
    console.error('格式化分析结果错误:', error)
    return '分析结果格式化失败'
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
