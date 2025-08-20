<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">听觉系统控制中心</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn" @click="openVoiceRecognition">智能语音识别</button>
          <button class="btn" @click="exportAudioData">导出音频数据</button>
        </div>
      </div>
    </header>

    <main class="audio-main">
      <!-- API连接状态提示 -->
      <div v-if="connectionStatus === 'error'" class="recognition-banner error">
        <div class="banner-icon">❌</div>
        <div class="banner-text">
          <strong>服务器连接失败</strong>
          <p>{{ apiError || '无法连接到语音转文字服务器，请检查网络连接或联系管理员。' }}</p>
          <div class="debug-info">
            <details>
              <summary>调试信息 (点击展开)</summary>
              <div class="debug-content">
                <p><strong>API基础地址:</strong> {{ API_BASE_URL }}</p>
                <p><strong>开始录音:</strong> {{ API_ENDPOINTS.start }}</p>
                <p><strong>停止录音:</strong> {{ API_ENDPOINTS.stop }}</p>
                <p><strong>状态查询:</strong> {{ API_ENDPOINTS.status }}</p>
                <p><strong>历史记录:</strong> {{ API_ENDPOINTS.recent }}</p>
                <p><strong>连接状态:</strong> {{ connectionStatus }}</p>
                <p><strong>最后调用:</strong> {{ lastApiCall ? new Date(lastApiCall).toLocaleString() : '未调用' }}</p>
                <p><strong>检查清单:</strong></p>
                <ul>
                  <li>✓ 确认上位机服务器运行正常</li>
                  <li>✓ 验证 /api/asr 路径配置正确</li>
                  <li>✓ 检查所有接口都使用HTTP协议</li>
                  <li>✓ 确认CORS跨域设置正确</li>
                  <li>✓ 测试网络连接稳定性</li>
                  <li>✓ 查看控制台详细错误日志</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div v-if="connectionStatus === 'connecting'" class="recognition-banner info">
        <div class="banner-icon">🔄</div>
        <div class="banner-text">
          <strong>正在连接服务器</strong>
          <p>正在建立与语音转文字服务的连接，请稍候...</p>
        </div>
      </div>

      <!-- 浏览器兼容性提示 -->
      <div v-if="!isRecognitionSupported" class="recognition-banner warning">
        <div class="banner-icon">⚠️</div>
        <div class="banner-text">
          <strong>语音识别不可用</strong>
          <p>您的浏览器不支持Web Speech API，请使用Chrome、Edge或Safari等现代浏览器。</p>
        </div>
      </div>



      <!-- 第一层：录音控制板块 -->
      <section class="recording-control-layer">
        <div class="first-layer-container">
          <!-- 左侧：录音控制中心 -->
          <div class="recording-panel">
            <div class="panel-header">
              <h3>录音控制中心</h3>
              <div class="language-selector-top">
                <label>识别语言：</label>
                <select v-model="selectedLanguage">
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
            </div>
            <div class="recording-controls">
              <div class="record-control-group">
                <button
                  class="record-btn"
                  :class="{
                    recording: isRecording,
                    loading: isLoading,
                    disabled: connectionStatus === 'error' || connectionStatus === 'connecting'
                  }"
                  @click="toggleRecording"
                  :disabled="connectionStatus === 'error' || connectionStatus === 'connecting' || isLoading || isToggling"
                >
                  <div class="record-icon">
                    <div v-if="isLoading" class="loading-spinner">⟳</div>
                    <div v-else class="record-dot"></div>
                  </div>
                  <span class="record-text">
                    {{
                      isLoading ? '处理中...' :
                      isToggling ? '操作中...' :
                      (isRecording ? '停止录音' : '开始录音')
                    }}
                  </span>
                </button>
                <div class="record-timer">{{ formatTime(recordTime) }}</div>
              </div>



              <div class="audio-level-group">
                <div class="audio-level">
                  <div class="level-label">音量监测</div>
                  <div class="level-meter">
                    <div class="level-bar" :style="{ width: audioLevel + '%' }"></div>
                  </div>
                  <div class="level-value">{{ audioLevel }}%</div>
                </div>
              </div>


            </div>
          </div>

          <!-- 右侧：语音转文字功能区域 -->
          <div class="speech-to-text-panel">
            <div class="panel-header">
              <h3>语音转文字</h3>
            </div>
            <div class="speech-content">
              <div class="text-display-area">
                <div class="text-output">
                  <div v-if="speechText" class="speech-text">{{ speechText }}</div>
                  <div v-else class="placeholder-text">
                    <p>🎤 开始录音后，语音将实时转换为文字显示在这里</p>
                    <p class="hint-text">支持中文、英文、日文识别</p>
                  </div>
                </div>
              </div>
              <div class="text-actions">
                <button class="btn btn-small" @click="copyText" :disabled="!speechText">
                  <span class="btn-icon">📋</span> 复制文本
                </button>
                <button class="btn btn-small" @click="saveText" :disabled="!speechText">
                  <span class="btn-icon">💾</span> 保存文本
                </button>
                <button class="btn btn-small" @click="clearText" :disabled="!speechText">
                  <span class="btn-icon">🗑️</span> 清空
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 第二层：频谱分析显示区域 -->
      <section class="visualization-layer">
        <div class="viz-panels-container">
          <div class="viz-panel waveform-panel">
            <div class="panel-header">
              <h3>实时波形</h3>
            </div>
            <div class="canvas-container">
              <canvas ref="waveformCanvas" width="400" height="150"></canvas>
            </div>
          </div>

          <div class="viz-panel spectrum-panel">
            <div class="panel-header">
              <h3>频谱分析</h3>
            </div>
            <div class="canvas-container">
              <canvas ref="spectrumCanvas" width="400" height="150"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- 第三层：数据统计和历史记录区域 -->
      <section class="data-layer">
        <div class="data-panels-container">
          <!-- 左侧：系统统计信息 -->
          <div class="stats-panel" style="min-height: 180px !important;">
            <div class="panel-header">
              <h3>系统统计</h3>
            </div>
            <div class="stats-content">
              <div class="stat-item">
                <div class="stat-icon">💾</div>
                <div class="stat-info">
                  <span class="stat-label">存储空间使用</span>
                  <span class="stat-value">{{ storageUsage }}MB</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                  <span class="stat-label">语音识别准确率</span>
                  <span class="stat-value">{{ recognitionAccuracy }}%</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                  <span class="stat-label">文本记录数量</span>
                  <span class="stat-value">{{ textHistory.length }}</span>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon">⏱️</div>
                <div class="stat-info">
                  <span class="stat-label">总录音时长</span>
                  <span class="stat-value">{{ formatTime(totalRecordTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：历史记录 -->
          <div class="history-panel" style="min-height: 180px !important;">
            <div class="panel-header">
              <h3>文本记录</h3>
              <div class="panel-controls">
                <button class="btn btn-small" @click="clearHistory">清空记录</button>
              </div>
            </div>
            <div class="history-content" style="min-height: 530px !important; max-height: 530px !important;">
              <!-- 文本记录内容 -->

              <div class="text-list">
                <div v-if="textHistory.length === 0" class="placeholder">
                  <p>暂无文本记录</p>
                  <p class="hint-text">录音完成后，转录结果将通过API接口自动获取并显示在这里</p>
                </div>
                <div v-else>
                  <div v-for="(record, index) in filteredTextHistory" :key="record.timestamp + index" class="text-item">
                    <div class="text-header">
                      <span class="text-time">{{ formatDateTime(record.timestamp) }}</span>
                    </div>
                    <div class="text-content-row">
                      <div class="text-content">{{ record.text }}</div>
                      <button class="btn btn-copy" @click="copyTextRecord(record)">复制</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { recordingApi } from '../api/recordingApi.js'
import { API_CONFIG } from '../config/api'

// 为缺失的 API 创建本地实现
const transcriptionApi = {
  // 转录相关功能可以后续实现
  transcribeAudio: () => Promise.resolve({ success: false, message: '转录功能待实现' }),
  getCurrentTranscription: () => Promise.resolve({ success: false, message: '获取转录功能待实现' }),
  getRecentRecords: () => Promise.resolve([])
}

const connectionApi = {
  // 连接相关功能可以后续实现
  testConnection: () => Promise.resolve({ success: false, message: '连接测试功能待实现' })
}

const systemUtils = {
  // 系统工具函数可以后续实现
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },
  formatHistoryRecords: (records) => {
    if (!records || !Array.isArray(records)) return []

    console.log('🔧 格式化历史记录，输入数据:', records)

    // 确保每条记录都有必要的字段
    const formattedRecords = records.map((record, index) => {
      // 如果记录已经是正确格式，直接返回
      if (record.text && record.timestamp && record.id) {
        return record
      }

      // 否则进行格式化
      const text = record.text || record.content || record.transcription ||
                  record.transcript || record.result || ''

      let timestamp = Date.now()
      if (record.timestamp) {
        timestamp = new Date(record.timestamp).getTime()
      } else if (record.created_at) {
        timestamp = new Date(record.created_at).getTime()
      } else if (record.time) {
        timestamp = new Date(record.time).getTime()
      }

      const id = record.id || record.uuid || `record_${timestamp}_${index}`

      return {
        text: text.trim(),
        timestamp: timestamp,
        language: record.language || 'zh-CN',
        confidence: parseFloat(record.confidence || record.score || 0.95),
        id: id,
        source: 'api'
      }
    }).filter(record => record.text.length > 0)

    console.log('✅ 格式化完成，输出数据:', formattedRecords)
    return formattedRecords
  },
  exportAudioData: (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audio_data.json'
    a.click()
    URL.revokeObjectURL(url)
  },
  resetSystem: () => {
    console.log('系统重置功能待实现')
  }
}

const router = useRouter()

// 从API模块导入配置用于模板显示
const API_BASE_URL = API_CONFIG.RECORDING_BASE_URL
const API_ENDPOINTS = {
  start: '/asr/start',
  stop: '/asr/stop',
  status: '/asr/status',
  recent: '/asr/recent'
}

// 响应式数据
const isRecording = ref(false)

// 监控录音状态变化，防止频繁切换导致按钮闪烁
let lastStateChangeTime = 0
let stateChangeCount = 0
const STATE_CHANGE_DEBOUNCE = 2000 // 增加到2秒防抖
const MAX_STATE_CHANGES_PER_MINUTE = 5 // 每分钟最多允许5次状态变化

watch(isRecording, (newValue, oldValue) => {
  const now = Date.now()
  console.log(`🎤 录音状态变化: ${oldValue} -> ${newValue}`)

  if (newValue !== oldValue) {
    stateChangeCount++

    // 检查是否变化过于频繁
    if (now - lastStateChangeTime < STATE_CHANGE_DEBOUNCE) {
      console.warn(`⚠️ 状态变化过于频繁！间隔仅${now - lastStateChangeTime}ms，可能导致按钮闪烁`)
      console.warn(`📊 最近状态变化次数: ${stateChangeCount}`)
    }

    lastStateChangeTime = now
    console.log('🔄 按钮状态更新:', newValue ? '录音中' : '已停止')

    // 每分钟重置计数器
    setTimeout(() => {
      if (stateChangeCount > 0) stateChangeCount--
    }, 60000)
  }
})
const recordTime = ref(0)
const audioLevel = ref(0)
const systemStatus = ref('online')
const statusText = ref('系统就绪')
const recordingStatus = ref('系统就绪') // 录音状态文本
const selectedLanguage = ref('zh-CN')
const speechText = ref('')

// API相关状态
const isLoading = ref(false)
const apiError = ref('')
const connectionStatus = ref('disconnected') // disconnected, connecting, connected, error
const lastApiCall = ref(null)

// 新增的监控数据
const recognitionAccuracy = ref(95.8)
const audioQuality = ref('优秀')
const storageUsage = ref(12.5)

const micPermissionGranted = ref(false)
const showMicPermissionDialog = ref(false)

// 历史记录相关
const textHistory = ref([])
const audioHistory = ref([])
const totalRecordTime = ref(0)

// 音频处理相关变量
let audioContext = null
let audioStream = null
let audioSource = null
let audioAnalyser = null
let audioDataArray = null
let mediaRecorder = null
let audioChunks = []
// 语音识别相关变量
let recognition = null
const isRecognitionRunning = ref(false) // 跟踪语音识别是否正在运行
const recognitionPermissionDenied = ref(false) // 跟踪权限是否被拒绝
// Canvas上下文变量
let waveformCtx = null
let spectrumCtx = null
const isRecognitionSupported = ref(true)

// 其他数据
const accuracy = ref(95)

// Canvas引用
const waveformCanvas = ref()
const spectrumCanvas = ref()

// 废弃的API调用函数已删除，现在使用统一的recordingApi模块

// 计算属性
const totalCharacters = computed(() => {
  return textHistory.value.reduce((total, record) => total + record.text.length, 0)
})

const filteredTextHistory = computed(() => {
  return sortedTextHistory.value
})

// 添加排序的计算属性
const sortedTextHistory = computed(() => {
  // 对文本历史记录进行反序排列，最新的在前面
  return [...textHistory.value].sort((a, b) => b.timestamp - a.timestamp)
})



// API接口调用函数
// 录音控制接口 - 重构优化版本
const startRecordingAPI = async () => {
  try {
    isLoading.value = true
    connectionStatus.value = 'connecting'
    statusText.value = '正在启动录音服务...'

    console.log('🎤 调用 /asr/start 接口启动录音服务')
    const result = await recordingApi.startRecording()
    console.log('📥 /asr/start 接口响应:', result)

    if (result && result.success) {
      statusText.value = result.message || '录音服务已启动'
      connectionStatus.value = 'connected'
      console.log('✅ 录音服务启动成功')

      // 启动录音后立即获取一次历史记录
      setTimeout(() => {
        fetchRecentRecords()
      }, 1000)

      return true
    } else {
      const errorMsg = result?.message || result?.error || '启动录音服务失败'
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('❌ 调用 /asr/start 接口失败:', error)
    statusText.value = `启动失败: ${error.message}`
    connectionStatus.value = 'error'
    apiError.value = error.message
    return false
  } finally {
    isLoading.value = false
  }
}

const stopRecordingAPI = async () => {
  try {
    statusText.value = '正在停止录音服务...'

    console.log('🛑 调用 /asr/stop 接口停止录音服务')
    const result = await recordingApi.stopRecording()
    console.log('📥 /asr/stop 接口响应:', result)

    if (result && result.success) {
      statusText.value = result.message || '录音服务已停止'
      console.log('✅ 录音服务停止成功')

      // 停止录音后的处理 - 不自动调用历史记录更新
      setTimeout(() => {
        console.log('🔄 停止录音完成')
        statusText.value = '系统就绪'
        console.log('💡 录音已停止，历史记录定时获取已停止')
      }, 1000)

      return true
    } else {
      const errorMsg = result?.message || result?.error || '停止录音服务失败'
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('❌ 调用 /asr/stop 接口失败:', error)
    statusText.value = `停止失败: ${error.message}`
    return false
  }
}

// 服务器端音频数据获取函数已移除，现在只使用本地麦克风数据

// 获取当前转录文本 - 通过recent接口获取最新记录
const fetchCurrentTranscription = async () => {
  try {
    // 使用 /asr/recent 接口获取最近1分钟的转录文本
    const result = await recordingApi.getRecentRecords(1)
    console.log('📝 获取最新转录文本 (通过recent接口，1分钟范围):', result)

    // 处理 /asr/recent 接口返回的数据格式
    let records = []

    if (result && result.success && result.data && result.data.results && Array.isArray(result.data.results)) {
      records = result.data.results
      console.log(`📊 获取到 ${records.length} 条转录记录 (success格式，来自results数组)`)
    } else if (result && result.success && result.data && Array.isArray(result.data)) {
      records = result.data
      console.log(`📊 获取到 ${records.length} 条转录记录 (success格式，直接数组)`)
    } else if (result && Array.isArray(result)) {
      records = result
      console.log(`📊 获取到 ${records.length} 条转录记录 (直接数组格式)`)
    } else {
      console.log('⚪ 没有获取到有效的转录记录')
      return result
    }

    if (records.length > 0) {
      // 按时间戳排序，获取最新的记录
      const sortedRecords = records.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || a.time || 0).getTime()
        const timeB = new Date(b.timestamp || b.created_at || b.time || 0).getTime()
        return timeB - timeA // 降序排列，最新的在前面
      })

      const latestRecord = sortedRecords[0]
      const currentText = latestRecord.text || latestRecord.content ||
                         latestRecord.transcription || latestRecord.transcript || ''

      console.log('📝 最新记录:', {
        timestamp: latestRecord.timestamp || latestRecord.created_at || latestRecord.time,
        text: currentText,
        confidence: latestRecord.confidence
      })

      if (currentText && currentText !== speechText.value) {
        console.log('🔄 文本更新前:', speechText.value)
        console.log('🔄 服务器返回最新文本:', currentText)
        speechText.value = currentText
        console.log('✅ 更新当前转录文本:', currentText)
        console.log('🎯 语音转文字栏现在显示:', speechText.value)
      } else if (currentText === speechText.value) {
        console.log('⚪ 文本未变化，跳过更新:', currentText)
      } else {
        console.log('⚪ 最新记录为空文本')
      }
    } else {
      console.log('⚪ 没有找到有效的转录记录')
    }
    return result
  } catch (error) {
    console.log('⚠️ 获取当前转录文本失败:', error.message)
    // 不抛出错误，避免影响其他功能
    return null
  }
}

// 实时更新转录文本的函数 - 通过 /asr/recent 接口获取最新记录
const updateTranscriptionText = async () => {
  try {
    console.log('🔄 实时更新转录文本 (通过/asr/recent接口)...')
    console.log('📺 当前语音转文字栏内容:', speechText.value || '(空)')

    const result = await fetchCurrentTranscription()

    // 检查是否获取到转录结果 (统一使用 /asr/recent 接口)
    let hasResults = false
    if (result && result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
      hasResults = true
      console.log('✅ 获取到转录结果，记录数:', result.data.length)
    } else if (result && Array.isArray(result) && result.length > 0) {
      hasResults = true
      console.log('✅ 获取到转录结果，记录数:', result.length)
    } else {
      console.log('⚪ 暂无新的转录结果')
    }

    // 注意：fetchCurrentTranscription 和 fetchRecentRecords 现在都使用同一个接口
    // 所以不需要重复调用来更新历史记录，避免重复请求
    if (hasResults) {
      console.log('📝 转录文本已通过 /asr/recent 接口更新')
    }

    console.log('📺 更新后语音转文字栏内容:', speechText.value || '(空)')
  } catch (error) {
    console.warn('⚠️ 实时更新转录文本失败:', error.message)
  }
}

// 添加状态同步控制标志
let allowStatusSync = true

// 添加状态轮询控制
let statusPollingInterval = null
const STATUS_POLLING_INTERVAL = 3000 // 每3秒检查一次状态

// 历史记录获取控制 - 每秒调用一次
let historyFetchInterval = null
const HISTORY_FETCH_INTERVAL = 1000 // 每1秒获取一次历史记录

// 状态监控接口 - 重构优化版本
const checkStatusAPI = async (enableSync = false) => {
  try {
    console.log('📊 调用 /asr/status 接口查询录音服务状态')
    const result = await recordingApi.getStatus(enableSync)
    console.log('� /asr/status 接口响应:', result)
    console.log('🔍 当前前端录音状态:', isRecording.value ? '录音中' : '已停止')

    if (!enableSync) {
      console.log('🔒 状态同步已禁用，仅查询状态信息')
      return result
    }

    console.log('🔄 开始执行前后端状态同步...')

    // 添加详细的调试信息
    if (result && result.data) {
      console.log('🎤 服务器端录音状态:', result.data.is_running ? '录音中' : '已停止')
      console.log('📊 识别结果总数:', result.data.total_results || 0)
      console.log('📁 CSV文件路径:', result.data.csv_file_path)

      if (result.data.is_running && result.data.total_results === 0) {
        console.warn('⚠️ 服务器正在录音但没有识别结果，可能的原因:')
        console.warn('   1. 机器人麦克风没有音频输入')
        console.warn('   2. 麦克风设备配置问题')
        console.warn('   3. 音频权限问题')
        console.warn('   4. 语音识别引擎问题')
      }
    }

    // 根据API返回的状态更新UI
    if (result) {
      console.log('🔍 API响应详情:', result)

      // 优先检查data.is_running字段
      if (result.data && typeof result.data.is_running === 'boolean') {
        const serverIsRunning = result.data.is_running
        console.log('🎯 服务器is_running状态:', serverIsRunning)
        console.log('🔍 前端录音状态:', isRecording.value ? '录音中' : '已停止')

        if (enableSync) {
          console.log('🔄 执行状态同步')

          if (serverIsRunning) {
            // 服务器正在录音
            if (!isRecording.value) {
              console.log('🎤 检测到服务器正在录音，同步按钮状态')
              isRecording.value = true
              statusText.value = '正在录音...'
              console.log('🤖 使用机器人麦克风录音，启动本地转录文本更新')

              // 启动本地录音功能以支持转录文本更新
              await startRecording()

              // 立即获取一次转录文本，确保显示最新内容
              console.log('🔄 状态同步后立即获取转录文本...')
              setTimeout(async () => {
                await updateTranscriptionText()
                console.log('✅ 状态同步后转录文本获取完成')
              }, 500) // 等待500ms后获取
            } else {
              console.log('✅ 服务器和前端状态一致（都在录音）')
            }
          } else {
            // 服务器已停止录音
            if (isRecording.value) {
              console.log('⏹️ 检测到服务器已停止录音，同步按钮状态')
              isRecording.value = false
              statusText.value = '系统就绪'
              console.log('🤖 机器人麦克风录音已停止，停止本地录音功能')

              // 停止本地录音功能
              stopRecording()
            } else {
              console.log('✅ 服务器和前端状态一致（都已停止）')
            }
          }
        } else {
          console.log('🔒 状态同步已禁用，仅记录服务器状态信息')
          console.log(`📊 服务器状态: ${serverIsRunning ? '录音中' : '已停止'}`)
          console.log(`📊 前端状态: ${isRecording.value ? '录音中' : '已停止'}`)
        }

        return result
      }

      // 如果没有is_running字段，检查传统的status字段作为备用
      if (result.status && typeof result.status === 'string') {
        const serverStatus = result.status.toLowerCase()
        console.log('⚠️ 未找到is_running字段，使用备用status字段:', serverStatus)
        console.log('🔍 前端状态:', isRecording.value ? 'recording' : 'stopped')

        if (serverStatus === 'recording') {
          if (!isRecording.value) {
            console.log('🎤 检测到服务器正在录音 (status: recording)，同步按钮状态')
            isRecording.value = true
            statusText.value = '正在录音...'

            if (!window.recordingTimer) {
              await startRecording()
            }
          }
        } else if (serverStatus === 'stopped' || serverStatus === 'idle') {
          if (isRecording.value) {
            console.log('⏹️ 检测到服务器已停止录音 (status: stopped/idle)，同步按钮状态')
            isRecording.value = false
            statusText.value = '系统就绪'

            if (window.recordingTimer) {
              stopRecording()
            }

            setTimeout(() => {
              fetchRecentRecords()
            }, 1000)
          }
        } else if (serverStatus === 'error') {
          statusText.value = `服务错误: ${result.message || '未知错误'}`
          connectionStatus.value = 'error'
          console.log('❌ 服务器状态：错误')

          if (isRecording.value) {
            isRecording.value = false
            stopRecording()
          }
        }
      } else {
        console.log('⚠️ API响应中既没有is_running字段也没有status字段')

        // 如果没有明确的状态信息，保持当前状态不变
        console.log('🔄 保持当前录音状态不变:', isRecording.value ? '录音中' : '已停止')
      }
    } else {
      console.log('⚠️ API响应为空')
    }

    // 如果返回了其他有用信息，也可以处理
    if (result && result.message) {
      console.log('💬 服务器消息:', result.message)
    }

    console.log('📊 状态检查完成，最终前端状态:', isRecording.value ? '录音中' : '已停止')

    return result
  } catch (error) {
    console.error('❌ 状态查询API失败:', error)
    // 不要因为状态查询失败就设置为错误状态，可能只是网络波动
    if (connectionStatus.value === 'connected') {
      console.log('🔄 状态查询失败，但保持连接状态')
    }
    return null
  }
}

// 添加定期状态检查函数
const startStatusPolling = () => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
  }

  console.log('🔄 启动状态轮询，间隔:', STATUS_POLLING_INTERVAL, 'ms')

  statusPollingInterval = setInterval(async () => {
    try {
      // 只在连接正常时进行状态检查
      if (connectionStatus.value === 'connected') {
        console.log('🔄 定期状态检查...')
        await checkStatusAPI(true) // 启用状态同步
      }
    } catch (error) {
      console.warn('⚠️ 定期状态检查失败:', error.message)
    }
  }, STATUS_POLLING_INTERVAL)
}

// 停止状态轮询
const stopStatusPolling = () => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
    console.log('⏹️ 已停止状态轮询')
  }
}

// 启动历史记录定时获取 - 仅在录音时启动
const startHistoryFetching = () => {
  if (historyFetchInterval) {
    clearInterval(historyFetchInterval)
  }

  console.log('🔄 启动历史记录定时获取，间隔:', HISTORY_FETCH_INTERVAL, 'ms (每秒1次)')

  historyFetchInterval = setInterval(async () => {
    try {
      if (isRecording.value) {
        console.log('🔄 定时获取历史记录 (录音中)...')
        await fetchRecentRecords()
      } else {
        console.log('⏸️ 录音已停止，停止历史记录定时获取')
        stopHistoryFetching()
      }
    } catch (error) {
      console.warn('⚠️ 定时获取历史记录失败:', error.message)
    }
  }, HISTORY_FETCH_INTERVAL)
}

// 停止历史记录定时获取
const stopHistoryFetching = () => {
  if (historyFetchInterval) {
    clearInterval(historyFetchInterval)
    historyFetchInterval = null
    console.log('⏹️ 历史记录定时获取已停止')
  }
}

// 从API更新历史记录的辅助函数
const updateHistoryFromAPI = (records) => {
  if (!records || !Array.isArray(records)) {
    console.log('⚠️ updateHistoryFromAPI 收到无效数据:', records)
    return
  }

  console.log('🔄 处理API记录，原始数据:', records)
  console.log('🔄 当前历史记录数量:', textHistory.value.length)

  // 将API返回的记录转换为本地格式
  const newRecords = records.map((record, index) => {
    // 处理CSV解析出来的数据，可能的字段名包括：
    // text, content, transcription, transcript
    // timestamp, created_at, time, date
    // confidence, score

    const text = record.text || record.content || record.transcription ||
                record.transcript || record.result || ''

    // 处理时间戳
    let timestamp = Date.now()
    if (record.timestamp) {
      timestamp = new Date(record.timestamp).getTime()
    } else if (record.created_at) {
      timestamp = new Date(record.created_at).getTime()
    } else if (record.time) {
      timestamp = new Date(record.time).getTime()
    } else if (record.date) {
      timestamp = new Date(record.date).getTime()
    }

    // 处理置信度
    const confidence = parseFloat(record.confidence || record.score || 0.95)

    // 生成唯一ID
    const id = record.id || record.uuid || `csv_${timestamp}_${index}`

    const processedRecord = {
      text: text.trim(),
      timestamp: timestamp,
      language: record.language || selectedLanguage.value,
      confidence: confidence,
      id: id,
      source: 'api' // 标识这是从API获取的记录
    }

    console.log('📝 处理记录:', processedRecord)
    return processedRecord
  }).filter(record => record.text.length > 0) // 过滤掉空文本

  console.log(`🔄 处理后得到 ${newRecords.length} 条有效记录`)
  console.log('🔄 处理后的记录详情:', newRecords)

  // 合并新记录，避免重复（基于ID或时间戳）
  const existingIds = new Set(textHistory.value.map(r => r.id))
  const existingTexts = new Set(textHistory.value.map(r => r.text))

  console.log('🔍 现有记录ID集合:', Array.from(existingIds))
  console.log('🔍 现有记录文本集合:', Array.from(existingTexts))

  const uniqueNewRecords = newRecords.filter(r => {
    const isDuplicateId = existingIds.has(r.id)
    const isDuplicateText = existingTexts.has(r.text)

    if (isDuplicateId) {
      console.log(`⚠️ 跳过重复ID记录: ${r.id}`)
    }
    if (isDuplicateText) {
      console.log(`⚠️ 跳过重复文本记录: ${r.text}`)
    }

    return !isDuplicateId && !isDuplicateText
  })

  console.log(`🔍 过滤后的唯一记录数量: ${uniqueNewRecords.length}`)

  if (uniqueNewRecords.length > 0) {
    console.log('📝 准备添加的新记录:', uniqueNewRecords)
    textHistory.value.push(...uniqueNewRecords)
    console.log(`✅ 成功添加了 ${uniqueNewRecords.length} 条新的API记录`)
    console.log('📊 更新后历史记录总数:', textHistory.value.length)

    // 保存到本地存储
    saveToLocalStorage()
  } else {
    console.log('📝 没有新的记录需要添加（可能是重复数据）')
  }
}

// CSV解析函数
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  if (lines.length <= 1) {
    console.log('📝 CSV文件为空或只有标题行')
    return []
  }

  // 获取标题行
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  console.log('� CSV标题行:', headers)

  // 解析数据行
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 简单的CSV解析（处理逗号分隔）
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))

    if (values.length >= headers.length) {
      const record = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })
      records.push(record)
    }
  }

  console.log(`📝 解析CSV得到 ${records.length} 条记录`)
  return records
}

// 历史记录获取接口 - 重构优化版本
const fetchRecentRecords = async () => {
  try {
    console.log('📋 调用 /asr/recent 接口获取转录记录 (最近1分钟)...')

    // 调用 /asr/recent 接口获取最近1分钟的记录
    const result = await recordingApi.getRecentRecords(1)
    console.log('📥 /asr/recent 接口响应 (1分钟范围):', result)
    console.log('📥 API返回数据类型:', typeof result)
    console.log('📥 API返回数据结构:', JSON.stringify(result, null, 2))

    let records = []
    if (result && result.success && result.data && result.data.results && Array.isArray(result.data.results)) {
      records = result.data.results
      console.log(`📊 获取到 ${records.length} 条记录 (success格式，来自results数组)`)
    } else if (result && result.success && result.data && Array.isArray(result.data)) {
      records = result.data
      console.log(`📊 获取到 ${records.length} 条记录 (success格式，直接数组)`)
    } else if (result && Array.isArray(result)) {
      records = result
      console.log(`📊 获取到 ${records.length} 条记录 (直接数组格式)`)
    } else {
      console.log('📝 没有获取到转录记录')
      console.log('📝 数据结构:', result)
      return []
    }

    if (records.length > 0) {
      console.log(`📊 开始处理 ${records.length} 条记录`)

      // 1. 更新历史记录显示
      const formattedRecords = systemUtils.formatHistoryRecords(records)
      console.log(`📋 格式化后得到 ${formattedRecords.length} 条记录`)

      updateHistoryFromAPI(formattedRecords)
      console.log(`✅ 历史记录面板已更新，当前总记录数: ${textHistory.value.length}`)

      // 2. 更新语音转文字框 - 显示最新的一条转录文本（替换模式）
      const sortedRecords = records.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || a.time || 0).getTime()
        const timeB = new Date(b.timestamp || b.created_at || b.time || 0).getTime()
        return timeB - timeA // 降序排列，最新的在前面
      })

      const latestRecord = sortedRecords[0]
      const currentText = latestRecord.text || latestRecord.content ||
                         latestRecord.transcription || latestRecord.transcript || ''

      console.log('📝 最新记录详情:', {
        timestamp: latestRecord.timestamp,
        text: currentText,
        originalRecord: latestRecord
      })

      // 语音转文字框：替换模式 - 每次只显示最新记录，旧内容被新内容替换
      if (currentText) {
        if (currentText !== speechText.value) {
          console.log('🔄 语音转文字框更新 (替换模式):', currentText)
          speechText.value = currentText // 替换显示最新文本
          console.log('✅ 语音转文字框已更新为最新转录文本')
        } else {
          console.log('⚪ 语音转文字框内容未变化 (已是最新)')
        }
      } else {
        console.log('⚠️ 最新记录文本为空，保持当前显示')
      }

      // 3. 验证界面显示状态
      console.log('📊 界面显示状态检查:')
      console.log('  - 历史记录面板记录数:', textHistory.value.length)
      console.log('  - 语音转文字框内容:', speechText.value || '(空)')
      console.log('  - 过滤后历史记录数:', filteredTextHistory.value.length)

      return formattedRecords
    } else {
      console.log('📝 没有获取到转录记录')
      console.log('📊 当前界面状态:')
      console.log('  - 历史记录面板记录数:', textHistory.value.length)
      console.log('  - 语音转文字框内容:', speechText.value || '(空)')
      return []
    }
  } catch (error) {
    console.error('❌ 获取历史记录API失败:', error)
    return []
  }
}





// 检查麦克风权限状态
const checkMicrophonePermission = async () => {
  try {
    // 检查浏览器是否支持权限API
    if (!navigator.permissions) {
      console.warn('⚠️ 此浏览器不支持权限API，将尝试直接请求麦克风权限')
      return null // 无法确定权限状态，需要直接尝试
    }

    const permission = await navigator.permissions.query({ name: 'microphone' })
    console.log('🎤 麦克风权限状态:', permission.state)

    if (permission.state === 'denied') {
      statusText.value = '麦克风权限被拒绝'
      recordingStatus.value = '请在浏览器设置中允许麦克风访问'
      return false
    } else if (permission.state === 'granted') {
      console.log('✅ 麦克风权限已授予')
      return true
    }

    return null // 权限状态为 'prompt'，需要请求权限
  } catch (error) {
    console.warn('⚠️ 无法检查麦克风权限状态:', error)
    return null
  }
}

// 请求麦克风权限
const requestMicrophonePermission = async () => {
  try {
    // 检查浏览器是否支持 getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = '此浏览器不支持麦克风访问功能，但服务器端录音仍可正常使用'
      recordingStatus.value = errorMsg
      console.warn('⚠️', errorMsg)
      return false // 返回 false 而不是抛出错误
    }

    console.log('🎤 正在请求麦克风权限...')
    recordingStatus.value = '正在请求麦克风权限，请在浏览器弹窗中点击"允许"'

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    micPermissionGranted.value = true
    audioStream = stream
    setupAudioContext(stream)
    initSpeechRecognition() // 初始化语音识别
    statusText.value = '系统就绪，麦克风已连接'
    recordingStatus.value = '麦克风权限已获取，系统就绪'
    console.log('✅ 麦克风权限获取成功')
    return true
  } catch (error) {
    console.warn('⚠️ 获取麦克风权限失败:', error.message)
    micPermissionGranted.value = false

    // 根据错误类型提供不同的提示信息
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      statusText.value = '麦克风权限被拒绝'
      recordingStatus.value = '请点击浏览器地址栏的麦克风图标，允许麦克风访问后刷新页面'
    } else if (error.name === 'NotFoundError') {
      statusText.value = '未找到麦克风设备'
      recordingStatus.value = '请检查麦克风是否正确连接'
    } else if (error.name === 'NotReadableError') {
      statusText.value = '麦克风被其他应用占用'
      recordingStatus.value = '请关闭其他使用麦克风的应用后重试'
    } else {
      statusText.value = '麦克风初始化失败'
      recordingStatus.value = '请检查麦克风设备和浏览器设置'
    }

    return false
  }
}

// 设置音频上下文
const setupAudioContext = (stream) => {
  // 创建音频上下文
  audioContext = new (window.AudioContext || window.webkitAudioContext)()

  // 创建音频源和分析器
  audioSource = audioContext.createMediaStreamSource(stream)
  audioAnalyser = audioContext.createAnalyser()

  // 配置分析器
  audioAnalyser.fftSize = 2048
  const bufferLength = audioAnalyser.frequencyBinCount
  audioDataArray = new Uint8Array(bufferLength)

  // 连接音频节点
  audioSource.connect(audioAnalyser)
}

// 重置语音识别状态（用于权限问题解决后重新初始化）
const resetSpeechRecognition = () => {
  console.log('🔄 重置语音识别状态')
  isRecognitionRunning.value = false
  recognitionPermissionDenied.value = false
  recognition = null
}

// 重置麦克风权限状态（用于重新请求权限）
const resetMicrophonePermission = async () => {
  console.log('🔄 重置麦克风权限状态')
  micPermissionGranted.value = false
  recognitionPermissionDenied.value = false

  // 停止现有的音频流
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop())
    audioStream = null
  }

  // 重置音频上下文
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  // 重置语音识别
  resetSpeechRecognition()

  recordingStatus.value = '权限状态已重置，点击"请求麦克风权限"重新授权'

  // 重新检查权限状态
  setTimeout(async () => {
    const permissionStatus = await checkMicrophonePermission()
    if (permissionStatus === true) {
      console.log('✅ 检测到权限已授予，自动初始化')
      try {
        await requestMicrophonePermission()
      } catch (error) {
        console.warn('⚠️ 自动初始化失败:', error)
      }
    }
  }, 500)
}

// 初始化语音识别
const initSpeechRecognition = () => {
  // 重置语音识别状态
  isRecognitionRunning.value = false

  // 检查浏览器支持
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    isRecognitionSupported.value = false
    console.warn('⚠️ 此浏览器不支持语音识别API')
    recordingStatus.value = '语音识别不支持，但录音功能仍可用'
    return
  }

  recognition = new SpeechRecognition()
  console.log('✅ 语音识别对象已创建')

  // 配置语音识别
  recognition.continuous = true       // 持续识别
  recognition.interimResults = true   // 返回临时结果
  recognition.maxAlternatives = 1     // 返回最可能的识别结果

  // 设置语言
  recognition.lang = selectedLanguage.value

  // 监听识别结果
  recognition.onresult = (event) => {
    let interimTranscript = ''
    let finalTranscript = ''

    console.log('收到语音识别结果:', event.results.length, '个结果')

    // 处理识别结果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      console.log('转写结果:', i, transcript, '是否最终:', event.results[i].isFinal)

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '

        // 更新识别准确度
        accuracy.value = Math.round(event.results[i][0].confidence * 100)

        // 不再将本地识别结果添加到历史记录
        // 只通过API接口获取转录结果
        if (transcript.trim()) {
          console.log('本地识别结果:', transcript.trim(), '(不保存到历史记录，等待API结果)')
        }
      } else {
        interimTranscript += transcript
      }
    }

    // 本地识别结果仅用于调试，不更新界面文本显示
    if (finalTranscript) {
      console.log('🎤 本地最终识别结果 (仅调试，不显示):', finalTranscript)
      // 注意：不更新 speechText.value，界面只显示服务器端API返回的结果
    } else if (interimTranscript) {
      console.log('🎤 本地临时识别结果 (仅调试，不显示):', interimTranscript)
      // 注意：不创建临时显示元素，界面只显示服务器端API返回的结果
    }
  }

  recognition.onstart = () => {
    isRecognitionRunning.value = true
    console.log('🎤 语音识别已启动')
  }

  recognition.onerror = (event) => {
    console.warn('⚠️ 语音识别错误:', event.error)
    isRecognitionRunning.value = false

    // 如果是权限被拒绝或不允许，标记权限被拒绝状态
    if (event.error === 'not-allowed' || event.error === 'permission-denied') {
      console.warn('🚫 语音识别权限被拒绝，将不再尝试启动语音识别')
      recognitionPermissionDenied.value = true
      recordingStatus.value = '语音识别权限被拒绝，请在浏览器设置中允许麦克风访问'

      // 停止尝试重启语音识别，但不影响服务器端录音功能
      console.log('ℹ️ 服务器端录音功能仍然可用，仅本地语音识别功能不可用')
      return
    }

    // 如果是网络错误或服务不可用，也停止录音
    if (event.error === 'network' || event.error === 'service-not-allowed') {
      console.warn('⚠️ 语音识别服务不可用')
      recordingStatus.value = '语音识别服务暂时不可用'
      return
    }

    // 其他错误才尝试重启识别（但不影响录音状态）
    if (isRecording.value && !recognitionPermissionDenied.value &&
        (event.error === 'aborted' || event.error === 'audio-capture')) {
      setTimeout(() => {
        if (isRecording.value && recognition && !isRecognitionRunning.value && !recognitionPermissionDenied.value) {
          try {
            recognition.start()
          } catch (e) {
            console.log('重启识别失败', e)
          }
        }
      }, 1000)
    }
  }

  recognition.onend = () => {
    isRecognitionRunning.value = false
    console.log('🎤 语音识别已结束')

    // 只有在录音状态且权限未被拒绝时才重启识别
    if (isRecording.value && !recognitionPermissionDenied.value) {
      setTimeout(() => {
        if (isRecording.value && recognition && !isRecognitionRunning.value && !recognitionPermissionDenied.value) {
          try {
            recognition.start()
          } catch (e) {
            console.log('重启识别失败', e)
            // 不再强制停止录音，因为服务器端录音可以独立工作
          }
        }
      }, 100) // 减少延迟时间
    }
  }
}

// 方法
const goBack = () => {
  router.push('/')
}

const openVoiceRecognition = () => {
  console.log('跳转到智能语音识别页面')
  router.push('/voice-recognition')
}

// 测试API连接
const testConnection = async () => {
  try {
    statusText.value = '正在测试连接...'

    const result = await connectionApi.testConnection()

    if (result.success) {
      await initializeAPI()
      statusText.value = 'API连接测试成功 ✅'
      console.log('✅ 连接测试完成')
    } else {
      throw new Error(result.error || '连接测试失败')
    }

  } catch (error) {
    console.error('❌ 连接测试失败:', error)
    statusText.value = `连接测试失败: ${error.message}`
    console.log('- 浏览器用户代理:', navigator.userAgent)
    console.log('- 当前时间:', new Date().toISOString())
  }
}

// 新增的方法
const exportAudioData = () => {
  const data = {
    textHistory: textHistory.value,
    speechText: speechText.value,
    isRecording: isRecording.value,
    connectionStatus: connectionStatus.value,
    statusText: statusText.value
  }

  systemUtils.exportAudioData(data)
}

const resetSystem = () => {
  console.log('重置系统')
  // 停止录音
  if (isRecording.value) {
    toggleRecording()
  }
  // 清空数据
  speechText.value = ''
  recordTime.value = 0
  audioLevel.value = 0
  statusText.value = '系统已重置'

  // 调用系统工具函数
  systemUtils.resetSystem()
}

// 按钮防抖控制
const isToggling = ref(false)
const BUTTON_DEBOUNCE_TIME = 1000 // 1秒防抖

const toggleRecording = async () => {
  // 防止频繁点击
  if (isToggling.value) {
    console.warn('⚠️ 按钮操作进行中，请稍候...')
    return
  }

  if (isLoading.value) {
    console.warn('⚠️ 系统正在处理中，请稍候...')
    return
  }

  isToggling.value = true
  console.log('🎤 录音控制 - 使用服务器端麦克风（机器人麦克风）')

  try {
    if (isRecording.value) {
      // 停止录音 - 调用服务器API并停止本地计时器
      console.log('⏹️ 停止服务器端录音...')
      const success = await stopRecordingAPI()
      if (success) {
        isRecording.value = false
        stopRecording() // 停止本地计时器和语音识别
        stopHistoryFetching() // 停止历史记录定时获取
        console.log('✅ 服务器端录音已停止，历史记录定时获取已停止')
      }
    } else {
      // 开始录音前先请求麦克风权限（必须在用户交互事件中触发）
      console.log('🎤 开始录音前检查麦克风权限...')

      // 如果还没有麦克风权限，先请求权限（但不阻止服务器端录音）
      if (!micPermissionGranted.value) {
        console.log('🔐 请求麦克风权限（用户交互触发）...')
        try {
          const permissionGranted = await requestMicrophonePermission()
          if (!permissionGranted) {
            console.warn('⚠️ 麦克风权限被拒绝，但服务器端录音仍可继续')
            recordingStatus.value = '麦克风权限被拒绝，本地可视化不可用，但服务器端录音正常'
            // 不要 return，继续执行服务器端录音
          }
        } catch (error) {
          console.warn('⚠️ 请求麦克风权限失败，但服务器端录音仍可继续:', error.message)
          recordingStatus.value = '本地麦克风不可用，但服务器端录音正常'
          // 不要 return，继续执行服务器端录音
        }
      }

      // 开始录音 - 调用服务器API并启动本地计时器
      console.log('🎙️ 开始服务器端录音...')
      const success = await startRecordingAPI()
      if (success) {
        isRecording.value = true
        await startRecording() // 启动本地计时器和语音识别
        startHistoryFetching() // 启动历史记录定时获取（每分钟2次）
        console.log('✅ 服务器端录音已开始，历史记录定时获取已启动')
      }
    }
  } finally {
    // 设置防抖延迟
    setTimeout(() => {
      isToggling.value = false
      console.log('🔓 按钮防抖解除')
    }, BUTTON_DEBOUNCE_TIME)
  }
}

const startRecording = async () => {
  console.log('🎙️ 开始录音 - 使用服务器端语音转文本')
  recordTime.value = 0
  statusText.value = '正在录音...'

  // 清空转录文本显示
  speechText.value = ''
  console.log('🧹 已清空转录文本显示')

  // 立即获取一次历史记录，显示最新的转录文本
  setTimeout(async () => {
    console.log('🔄 录音开始后立即获取最新转录文本...')
    await updateTranscriptionText()
  }, 1000) // 等待1秒后开始

  // 确保音频上下文已初始化（用于可视化）
  if (!audioAnalyser || !audioContext) {
    console.log('🎤 音频上下文未初始化，尝试请求麦克风权限...')
    try {
      await requestMicrophonePermission()
      console.log('✅ 音频上下文初始化成功')
    } catch (error) {
      console.warn('⚠️ 音频上下文初始化失败，可视化功能将不可用:', error)
    }
  }

  audioChunks = []

  // 启用本地语音识别仅用于音频可视化（频谱分析和波形显示）
  // 注意：本地识别结果不会显示在界面上，界面只显示服务器端API返回的转录结果
  if (recognition && isRecognitionSupported.value && !recognitionPermissionDenied.value && !isRecognitionRunning.value) {
    // 更新语言设置
    recognition.lang = selectedLanguage.value

    try {
      console.log('🎤 启动本地语音识别用于音频可视化（不用于文本显示）...')
      recognition.start()
      console.log('✅ 本地语音识别已启动（仅用于可视化）')
    } catch (e) {
      console.warn('⚠️ 启动本地语音识别失败:', e.message)
      if (e.message && e.message.includes('already started')) {
        console.log('🎤 语音识别已在运行中')
        isRecognitionRunning.value = true
      }
    }
  } else {
    console.warn('⚠️ 本地语音识别不可用', {
      isSupported: isRecognitionSupported.value,
      hasRecognitionObj: !!recognition,
      permissionDenied: recognitionPermissionDenied.value,
      isRunning: isRecognitionRunning.value
    })

    // 如果识别不可用且权限未被拒绝，尝试重新初始化
    if (!recognition && isRecognitionSupported.value && !recognitionPermissionDenied.value) {
      console.log('🔄 尝试重新初始化语音识别（仅用于可视化）...')
      initSpeechRecognition()

      // 如果初始化成功，延迟启动识别
      if (recognition && !isRecognitionRunning.value) {
        setTimeout(() => {
          try {
            recognition.start()
            console.log('✅ 延迟启动语音识别成功（仅用于可视化）')
          } catch (e) {
            console.warn('⚠️ 延迟启动语音识别失败:', e.message)
          }
        }, 500)
      }
    }
  }

  // 开始本地录音（仅用于可视化，可选功能）
  if (audioStream) {
    mediaRecorder = new MediaRecorder(audioStream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.start()
    console.log('✅ 本地MediaRecorder已启动（用于可视化）')
  } else {
    console.warn('⚠️ 本地audioStream不存在，本地可视化功能不可用，但服务器端录音正常')
  }

  // 录音计时器
  const recordingTimer = setInterval(async () => {
    recordTime.value++

    // 使用本地麦克风数据更新音频电平
    if (audioAnalyser && audioDataArray) {
      audioAnalyser.getByteTimeDomainData(audioDataArray)

      // 计算音频电平
      let sum = 0
      for (let i = 0; i < audioDataArray.length; i++) {
        const value = (audioDataArray[i] - 128) / 128
        sum += value * value
      }

      const rms = Math.sqrt(sum / audioDataArray.length)
      audioLevel.value = Math.min(100, Math.round(rms * 100 * 3))
    }

    // 录音期间通过定时器自动获取历史记录，每秒1次
  }, 1000)

  // 转录文本更新定时器 - 降低频率，减少服务器压力
  const transcriptionTimer = setInterval(async () => {
    console.log('🔄 更新转录文本...')
    await updateTranscriptionText()
  }, 2000) // 改为每2秒调用一次，减少频率

  // 存储计时器ID以便停止时清除
  window.recordingTimer = recordingTimer
  window.transcriptionTimer = transcriptionTimer
}

const stopRecording = () => {
  console.log('停止录音')
  statusText.value = '系统就绪'

  // 停止本地语音识别（仅用于可视化）
  if (recognition && isRecognitionSupported.value && isRecognitionRunning.value) {
    try {
      console.log('⏹️ 停止本地语音识别（仅用于可视化）')
      recognition.stop()
      isRecognitionRunning.value = false
    } catch (e) {
      console.warn('⚠️ 停止语音识别失败:', e.message)
      isRecognitionRunning.value = false
    }
  }

  // 重置语音识别状态
  isRecognitionRunning.value = false

  // 停止录音
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()

    // 确保录音数据被处理
    mediaRecorder.onstop = async (event) => {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)

        console.log('录音已结束，blob大小:', audioBlob.size, '字节')

        // 计算录音大小（MB）
        const audioSize = audioBlob.size / (1024 * 1024)
        storageUsage.value += parseFloat(audioSize.toFixed(2))

        // 保存录音记录
        if (recordTime.value > 0) {
          const timestamp = Date.now()

          console.log('录音完成, 时长:', recordTime.value, '秒')

          // 注意：speechText.value 现在只包含服务器端API返回的转录结果
          // 本地语音识别结果不会更新到 speechText.value
          if (speechText.value.trim()) {
            console.log('当前显示的转录文本（来自服务器端API）:', speechText.value.trim())
          } else {
            console.log('当前无转录文本显示，等待服务器端API返回结果')
          }

          totalRecordTime.value += recordTime.value

          // 立即保存到本地存储
          saveToLocalStorage()
        }

        audioChunks = []
      } catch (error) {
        console.error('处理录音数据时出错:', error)
      }
    }
  }

  // 清除录音计时器
  if (window.recordingTimer) {
    clearInterval(window.recordingTimer)
    window.recordingTimer = null
  }

  // 清除高频转录文本更新定时器
  if (window.transcriptionTimer) {
    clearInterval(window.transcriptionTimer)
    window.transcriptionTimer = null
    console.log('⏹️ 已停止高频转录文本更新定时器')
  }

  audioLevel.value = 0
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const clearText = () => {
  speechText.value = ''
}

const copyText = () => {
  if (speechText.value) {
    navigator.clipboard.writeText(speechText.value)
    console.log('文本已复制')
  }
}

const saveText = () => {
  // 注意：speechText.value 现在只包含服务器端API返回的转录结果
  // 历史记录通过API接口自动获取，不需要手动保存
  if (speechText.value) {
    console.log('当前显示的转录文本（来自服务器端API）:', speechText.value)
    console.log('历史记录将通过API接口自动获取，无需手动保存')
  }
}

const editText = () => {
  console.log('编辑文本')
}











const clearHistory = () => {
  textHistory.value = []
  console.log('📝 所有文本记录已清空')
  saveToLocalStorage() // 保存清空状态
}

// 清空所有旧的本地记录
const clearAllOldRecords = () => {
  const oldCount = textHistory.value.length
  textHistory.value = [] // 清空所有记录
  console.log(`🧹 已清空所有旧记录: ${oldCount} 条`)
  saveToLocalStorage() // 保存清空状态

  // 重新获取API记录
  fetchRecentRecords()
}

const playRecord = (record) => {
  if (record.url) {
    // 创建一个新的音频元素进行播放
    const audio = new Audio(record.url)
    audio.play()
    console.log('播放录音:', record)
  } else {
    console.log('无法播放录音，URL不存在')
  }
}



const viewTextDetail = (record) => {
  console.log('查看文本详情:', record)
  // 这里可以打开模态框显示详细信息
}

// 添加下载录音功能
const downloadRecord = (record) => {
  if (!record.blob || !record.url) {
    console.error('录音数据不存在')
    return
  }

  // 创建下载链接
  const downloadLink = document.createElement('a')
  downloadLink.href = record.url

  // 格式化时间作为文件名
  const date = new Date(record.timestamp)
  const fileName = `录音_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}${date.getSeconds().toString().padStart(2,'0')}.webm`

  downloadLink.download = fileName
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  console.log('下载录音:', fileName)
}



// 调整canvas尺寸以适应容器
const resizeCanvas = () => {
  if (waveformCanvas.value && spectrumCanvas.value) {
    const waveformContainer = waveformCanvas.value.parentElement
    const spectrumContainer = spectrumCanvas.value.parentElement

    if (waveformContainer && spectrumContainer) {
      const containerWidth = waveformContainer.clientWidth - 20 // 减去padding
      const containerHeight = 150

      // 设置canvas的实际尺寸
      waveformCanvas.value.width = containerWidth
      waveformCanvas.value.height = containerHeight
      spectrumCanvas.value.width = containerWidth
      spectrumCanvas.value.height = containerHeight

      // 设置canvas的显示尺寸
      waveformCanvas.value.style.width = containerWidth + 'px'
      waveformCanvas.value.style.height = containerHeight + 'px'
      spectrumCanvas.value.style.width = containerWidth + 'px'
      spectrumCanvas.value.style.height = containerHeight + 'px'
    }
  }
}

// 初始化音频可视化
const initializeAudioVisualization = () => {
  // 延迟执行以确保DOM已渲染
  setTimeout(() => {
    // 首先调整canvas尺寸
    resizeCanvas()

    // 启动可视化
    initVisualization()
  }, 100)
}

// 初始化可视化
const initVisualization = () => {
  console.log('初始化可视化...')
  waveformCtx = waveformCanvas.value && waveformCanvas.value.getContext('2d')
  spectrumCtx = spectrumCanvas.value && spectrumCanvas.value.getContext('2d')

  console.log('Canvas上下文:', { waveformCtx, spectrumCtx })

  if (waveformCtx && spectrumCtx) {
    console.log('开始动画循环...')
    // 绘制波形 - 优先使用服务器端数据
    const drawWaveform = () => {
      if (!waveformCanvas.value) return

      const canvas = waveformCanvas.value
      const width = canvas.width
      const height = canvas.height

      waveformCtx.clearRect(0, 0, width, height)
      waveformCtx.strokeStyle = '#00ffff'
      waveformCtx.lineWidth = 2
      waveformCtx.beginPath()

      // 使用本地麦克风数据绘制波形
      let waveformData = null
      if (audioAnalyser && audioDataArray) {
        audioAnalyser.getByteTimeDomainData(audioDataArray)
        waveformData = Array.from(audioDataArray)
      }

      if (waveformData && waveformData.length > 0) {
        const sliceWidth = width / waveformData.length
        let x = 0

        for (let i = 0; i < waveformData.length; i++) {
          const v = waveformData[i] / 128.0 // 归一化到 0-2
          const y = v * (height / 2) + (height / 2) // 缩放到画布高度

          if (i === 0) {
            waveformCtx.moveTo(x, y)
          } else {
            waveformCtx.lineTo(x, y)
          }

          x += sliceWidth
        }

        waveformCtx.stroke()
      } else {
        // 如果没有数据，绘制静态波形
        drawStaticWaveform()
      }
    }

    // 绘制频谱 - 优先使用服务器端数据
    const drawSpectrum = () => {
      if (!spectrumCanvas.value) return

      const canvas = spectrumCanvas.value
      const width = canvas.width
      const height = canvas.height

      // 清除画布
      spectrumCtx.clearRect(0, 0, width, height)

      // 使用本地麦克风数据绘制频谱
      let frequencyData = null
      if (audioAnalyser) {
        const localFrequencyData = new Uint8Array(audioAnalyser.frequencyBinCount)
        audioAnalyser.getByteFrequencyData(localFrequencyData)
        frequencyData = Array.from(localFrequencyData)
      }

      if (frequencyData && frequencyData.length > 0) {
        spectrumCtx.fillStyle = '#00ffff'

        // 计算合适的条数和宽度
        const numBars = Math.min(64, frequencyData.length) // 限制条数
        const barWidth = (width / numBars) * 0.8 // 留一些间隙
        const barSpacing = (width / numBars) * 0.2

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * frequencyData.length)
          const barHeight = (frequencyData[dataIndex] / 255) * height * 0.9 // 留一些顶部空间
          const x = i * (barWidth + barSpacing)

          spectrumCtx.fillRect(x, height - barHeight, barWidth, barHeight)
        }
      } else {
        // 如果没有数据，显示静态频谱
        drawStaticSpectrum(width, height)
      }
    }

    // 绘制静态频谱（当没有音频输入时）
    const drawStaticSpectrum = (width, height) => {
      spectrumCtx.fillStyle = 'rgba(0, 255, 255, 0.3)'
      const numBars = 32
      const barWidth = (width / numBars) * 0.8
      const barSpacing = (width / numBars) * 0.2

      for (let i = 0; i < numBars; i++) {
        // 创建一些随机的静态高度
        const barHeight = Math.random() * height * 0.3 + 10
        const x = i * (barWidth + barSpacing)

        spectrumCtx.fillRect(x, height - barHeight, barWidth, barHeight)
      }
    }

    // 动画循环
    const animate = () => {
      // 始终绘制频谱
      drawSpectrum()

      // 录音时绘制实时波形，否则绘制静态波形
      if (isRecording.value) {
        drawWaveform() // 现在会自动选择服务器端或本地数据
      } else {
        // 没有录音时绘制静态波形
        drawStaticWaveform()
      }

      requestAnimationFrame(animate)
    }

    // 绘制静态波形（当没有音频输入时）
    const drawStaticWaveform = () => {
      if (!waveformCanvas.value) return

      const canvas = waveformCanvas.value
      const width = canvas.width
      const height = canvas.height

      waveformCtx.clearRect(0, 0, width, height)
      waveformCtx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
      waveformCtx.lineWidth = 2
      waveformCtx.beginPath()

      // 绘制一条平直的线表示静默状态
      const centerY = height / 2
      waveformCtx.moveTo(0, centerY)
      waveformCtx.lineTo(width, centerY)
      waveformCtx.stroke()
    }

    animate()
  }
}

// 保存到本地存储（只保存API获取的数据）
const saveToLocalStorage = () => {
  const data = {
    audioHistory: audioHistory.value,
    textHistory: textHistory.value, // 现在只包含从API获取的记录
    totalRecordTime: totalRecordTime.value,
    selectedLanguage: selectedLanguage.value
  }
  localStorage.setItem('audioSystemData', JSON.stringify(data))
  console.log('💾 保存数据到本地存储，文本记录数:', textHistory.value.length)
}

// 清理旧的本地记录（只保留API记录）
const cleanupOldLocalRecords = () => {
  // 过滤掉没有API标识的旧记录
  const apiRecords = textHistory.value.filter(record => {
    // 如果记录有id字段或者是最近通过API添加的，则保留
    return record.id || record.source === 'api'
  })

  if (apiRecords.length !== textHistory.value.length) {
    console.log(`🧹 清理旧记录: ${textHistory.value.length - apiRecords.length} 条本地记录已移除`)
    textHistory.value = apiRecords
    saveToLocalStorage() // 保存清理后的数据
  }
}

// 从本地存储加载（只加载API获取的历史数据）
const loadFromLocalStorage = () => {
  const savedData = localStorage.getItem('audioSystemData')
  if (savedData) {
    try {
      const data = JSON.parse(savedData)
      audioHistory.value = data.audioHistory || []
      textHistory.value = data.textHistory || [] // 只包含从API获取的记录
      totalRecordTime.value = data.totalRecordTime || 0
      selectedLanguage.value = data.selectedLanguage || 'zh-CN'
      console.log('📂 从本地存储加载数据，文本记录数:', textHistory.value.length)

      // 清理旧的本地记录
      cleanupOldLocalRecords()
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }
}

// 复制文本记录
const copyTextRecord = (record) => {
  if (record.text) {
    navigator.clipboard.writeText(record.text)
    console.log('文本已复制:', record.text)
    // 可以在这里添加一个提示，告诉用户复制成功
  }
}

// 窗口大小变化处理函数
const handleResize = () => {
  setTimeout(resizeCanvas, 100) // 延迟执行以确保DOM更新完成
}

// 状态轮询已移除 - 只在页面初始化时调用一次状态查询

// 页面初始化API连接 - 重构优化版本
const initializeAPI = async () => {
  try {
    statusText.value = '正在连接服务器...'
    connectionStatus.value = 'connecting'

    console.log('🚀 页面初始化开始...')

    // 1. 页面初始化/刷新时必须调用状态接口，获取服务器端的真实状态
    console.log('� 步骤1: 调用 /asr/status 接口获取服务器真实状态')
    await checkStatusAPI(true) // 启用状态同步，确保前端按钮状态与后端服务状态一致

    // 2. 获取历史记录（初始化时获取一次）
    console.log('📋 步骤2: 获取历史记录')
    await fetchRecentRecords()

    // 3. 根据同步后的状态设置界面
    if (isRecording.value) {
      statusText.value = '正在录音...'
      console.log('🎤 检测到服务器正在录音，前端状态已同步')
      // 如果服务器正在录音，启动历史记录定时获取
      startHistoryFetching()
    } else {
      statusText.value = '系统就绪'
      console.log('⏹️ 服务器未在录音，前端状态已同步')
    }

    connectionStatus.value = 'connected'

    console.log('✅ 页面初始化完成')
    console.log('📊 当前录音状态:', isRecording.value ? '录音中' : '已停止')
    console.log('� 前后端状态已同步，按钮显示与服务状态一致')

  } catch (error) {
    console.error('❌ 页面初始化失败:', error)
    statusText.value = '服务器连接失败，请检查网络连接'
    connectionStatus.value = 'error'
  }
}



// 在setup函数顶层注册生命周期钩子，避免在异步操作后注册
const saveInterval = ref(null)

onMounted(async () => {
  console.log('听觉系统组件已挂载')

  try {
    // 检查浏览器兼容性
    console.log('🔍 检查浏览器兼容性...')

    // 检查基本的Web API支持
    if (!navigator.mediaDevices) {
      console.error('❌ 此浏览器不支持 MediaDevices API')
      statusText.value = '浏览器不兼容'
      recordingStatus.value = '请使用现代浏览器（Chrome、Firefox、Safari等）'
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
      console.error('❌ 此浏览器不支持 Web Audio API')
    }

    console.log('✅ 浏览器兼容性检查完成')

    loadFromLocalStorage()
    initializeAudioVisualization()

    // 确保canvas尺寸正确
    setTimeout(resizeCanvas, 100)

    // 添加窗口大小变化监听器
    window.addEventListener('resize', handleResize)

    // 定期保存数据
    saveInterval.value = setInterval(saveToLocalStorage, 30000)

    // 只检查权限状态，不自动请求权限（权限请求需要在用户交互中触发）
    console.log('🎤 检查麦克风权限状态...')
    const permissionStatus = await checkMicrophonePermission()

    if (permissionStatus === false) {
      console.warn('⚠️ 麦克风权限被拒绝，需要用户手动允许')
      recordingStatus.value = '点击录音按钮时将请求麦克风权限'
    } else if (permissionStatus === true) {
      console.log('✅ 麦克风权限已授予')
      recordingStatus.value = '系统就绪'
      // 如果权限已授予，可以初始化音频可视化
      try {
        await requestMicrophonePermission()
        console.log('✅ 音频可视化已准备就绪')
      } catch (error) {
        console.warn('⚠️ 音频可视化初始化失败:', error)
      }
    } else {
      console.log('🎤 麦克风权限状态未知，将在用户点击录音时请求')
      recordingStatus.value = '点击录音按钮开始使用'
    }

    // 初始化API连接
    await initializeAPI()

    console.log('✅ 听觉系统组件初始化完成')
  } catch (error) {
    console.error('❌ 听觉系统组件初始化失败:', error)
    statusText.value = '系统初始化失败，请刷新页面重试'
    connectionStatus.value = 'error'
  }
})

onUnmounted(() => {
  console.log('听觉系统组件已卸载')

  // 如果正在录音，先停止
  if (isRecording.value) {
    stopRecordingAPI()
  }

  // 停止历史记录定时获取
  stopHistoryFetching()

  // 清理定时器
  if (saveInterval.value) {
    clearInterval(saveInterval.value)
  }
  if (window.recordingTimer) {
    clearInterval(window.recordingTimer)
  }
  if (window.transcriptionTimer) {
    clearInterval(window.transcriptionTimer)
  }

  // 移除事件监听器
  window.removeEventListener('resize', handleResize)

  // 清理音频资源
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop())
  }
  if (audioSource) {
    audioSource.disconnect()
  }
  if (audioContext) {
    audioContext.close()
  }

  saveToLocalStorage() // 最后保存一次
  console.log('✅ 听觉系统资源已清理')
})
</script>

<style scoped>
@import '../assets/audio-system.css';
</style>

<style>
/* 状态显示样式 */
.status-display {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0;
  font-size: 13px;
}

.status-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.status-value {
  color: #fff;
  font-weight: 600;
}

.status-value.status-error {
  color: #ff6b6b;
}

.status-value.status-warning {
  color: #ffd93d;
}

.status-value.status-success {
  color: #51cf66;
}



/* 强制缩小听觉系统面板高度 */
.stats-panel {
    min-height: 180px !important;
}

.history-panel {
    min-height: 180px !important;
}

.history-content {
    min-height: 530px !important;
    max-height: 530px !important;
}

/* 听觉系统响应式设计补充 */
@media (max-width: 768px) {
  .header-buttons {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .header-buttons .btn {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }

  .recognition-banner {
    padding: 12px;
    margin: 8px 0;
  }

  .debug-info {
    margin-top: 8px;
  }

  .debug-content {
    font-size: 12px;
    padding: 8px;
  }

  /* 录音控制按钮优化 */
  .main-controls .btn {
    min-height: 48px;
    min-width: 48px;
    padding: 14px 18px;
    font-size: 16px;
    touch-action: manipulation;
  }

  /* 面板内按钮优化 */
  .panel-controls .btn,
  .viz-controls .btn {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }
}

@media (max-width: 480px) {
  .header-buttons .btn {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
  }

  .main-controls {
    padding: 16px 12px;
  }

  .main-controls .btn {
    min-height: 52px;
    padding: 16px 20px;
    font-size: 18px;
  }

  .recognition-banner {
    padding: 10px;
    margin: 6px 0;
  }

  .banner-text {
    font-size: 14px;
  }

  .debug-content {
    font-size: 11px;
  }
}
</style>
