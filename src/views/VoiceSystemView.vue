<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">语音系统控制中心</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small voice-recognition-btn" @click="openVoiceRecognition">智能语音识别</button>
          <button class="btn btn-small" @click="stopAllVoice">停止播放</button>
          <button class="btn btn-small" @click="exportVoiceData">导出语音库</button>
        </div>
      </div>
    </header>

    <main class="voice-main">
      <!-- 使用左右布局容器 -->
      <div class="voice-layout-container">
        <!-- 左侧语音库管理区 -->
        <div class="voice-left-section">
          <!-- 语音库管理 -->
          <section class="voice-library-section">
            <div class="section-header">
              <h3>语音库管理</h3>
              <div class="voice-status-indicator online"></div>
            </div>
            <div class="library-stats">
              <span>共 {{ voiceLibrary.length }} 条语音</span>
              <button class="btn btn-small btn-primary" @click="showAddDialog">+ 添加语音</button>
            </div>

            <!-- 搜索和筛选 -->
            <div class="voice-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchText" 
                  placeholder="搜索语音内容..."
                  class="search-input"
                >
              </div>
              <div class="filter-controls">
                <select v-model="selectedCategory" class="filter-select">
                  <option value="">所有分类</option>
                  <option value="greeting">问候语</option>
                  <option value="response">回应语</option>
                  <option value="notification">通知语</option>
                  <option value="emotion">情感表达</option>
                  <option value="system">系统提示</option>
                </select>
                <select v-model="selectedLanguage" class="filter-select">
                  <option value="">所有语言</option>
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
            </div>

            <!-- 语音列表 -->
            <div class="voice-list">
              <div 
                class="voice-item" 
                v-for="voice in filteredVoiceLibrary" 
                :key="voice.id"
                :class="{ playing: playingVoiceId === voice.id }"
              >
                <div class="voice-header">
                  <div class="voice-info">
                    <span class="voice-title">{{ voice.title }}</span>
                    <div class="voice-meta">
                      <span class="voice-category">{{ getCategoryName(voice.category) }}</span>
                      <span class="voice-language">{{ voice.language }}</span>
                      <span class="voice-duration">{{ formatDuration(voice.duration) }}s</span>
                    </div>
                  </div>
                  <div class="voice-actions">
                    <button
                      class="btn btn-mini btn-play"
                      @click="playVoice(voice)"
                      :disabled="playingVoiceId === voice.id || isRequestInProgress"
                    >
                      {{ playingVoiceId === voice.id ? '播放中' : (isRequestInProgress ? '请求中' : '播放') }}
                    </button>
                    <button class="btn btn-mini btn-edit" @click="editVoice(voice)">编辑</button>
                    <button class="btn btn-mini btn-danger" @click="deleteVoice(voice.text_id || voice.id)">删除</button>
                  </div>
                </div>
                <div class="voice-content">
                  {{ voice.content }}
                </div>
                <div class="voice-settings" v-if="voice.showSettings">
                  <div class="setting-item">
                    <label>音量:</label>
                    <input type="range" v-model="voice.volume" min="0" max="100" class="volume-slider">
                    <span>{{ voice.volume }}%</span>
                  </div>
                  <div class="setting-item">
                    <label>语速:</label>
                    <input type="range" v-model="voice.speed" min="0.5" max="2" step="0.1" class="speed-slider">
                    <span>{{ voice.speed }}x</span>
                  </div>
                  <div class="setting-item">
                    <label>音调:</label>
                    <input type="range" v-model="voice.pitch" min="0.5" max="2" step="0.1" class="pitch-slider">
                    <span>{{ voice.pitch }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 右侧控制面板区 -->
        <div class="voice-right-section">
          <!-- 播放控制面板 -->
          <section class="playback-section">
            <div class="section-header">
              <h3>播放控制</h3>
              <div class="voice-status-indicator online"></div>
            </div>

            <div class="playback-controls">
              <!-- 当前播放信息 -->
              <div class="current-playing" v-if="currentVoice">
                <h4>正在播放</h4>
                <div class="playing-info">
                  <div class="playing-title">{{ currentVoice.title }}</div>
                  <div class="playing-content">{{ currentVoice.content }}</div>
                  <div class="playing-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: playProgress + '%' }"></div>
                    </div>
                    <div class="progress-time">
                      {{ formatTime(currentTime) }} / {{ formatTime(currentVoice.duration) }}
                    </div>
                  </div>
                </div>
                <div class="playback-buttons">
                  <button class="btn btn-secondary" @click="pauseVoice">暂停</button>
                  <button class="btn btn-danger" @click="stopVoice">停止</button>
                </div>
              </div>

              <!-- 快速播放按钮 -->
              <div class="quick-play">
                <h4>快速播放</h4>
                <div class="quick-buttons">
                  <button
                    class="btn btn-quick"
                    v-for="voice in quickPlayVoices"
                    :key="voice.id"
                    @click="playVoice(voice)"
                    :disabled="isRequestInProgress"
                  >
                    {{ voice.title }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 播放历史 -->
          <section class="history-section">
            <div class="section-header">
              <h3>播放历史</h3>
              <div class="voice-status-indicator online"></div>
            </div>

            <div class="history-list">
              <div v-if="playHistory.length === 0" class="history-empty">
                <p>暂无播放历史</p>
              </div>
              <div v-else class="history-item" v-for="item in playHistory" :key="item.id">
                <div class="history-content">{{ item.content }}</div>
                <div class="history-time">{{ formatTimestamp(item.timestamp) }}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 添加/编辑语音对话框 -->
    <div class="modal" v-if="showDialog" @click="closeDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingVoice ? '编辑语音' : '添加语音' }}</h3>
          <button class="modal-close" @click="closeDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题:</label>
            <input type="text" v-model="dialogForm.title" class="form-input">
          </div>
          <div class="form-group">
            <label>内容:</label>
            <textarea v-model="dialogForm.content" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>分类:</label>
            <select v-model="dialogForm.category" class="form-select">
              <option value="greeting">问候语</option>
              <option value="response">回应语</option>
              <option value="notification">通知语</option>
              <option value="emotion">情感表达</option>
              <option value="system">系统提示</option>
            </select>
          </div>
          <div class="form-group">
            <label>语言:</label>
            <select v-model="dialogForm.language" class="form-select">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="saveVoice">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { voiceApi } from '../api/voiceApi.js'

const router = useRouter()

// 响应式数据
const searchText = ref('')
const selectedCategory = ref('')
const selectedLanguage = ref('')
const playingVoiceId = ref(null)
const playbackStatus = ref('idle')
const playbackStatusText = ref('系统就绪')
const currentVoice = ref(null)
const playProgress = ref(0)
const currentTime = ref(0)

// TTS相关状态
const availableVoices = ref([])
const selectedVoice = ref('')

// 请求管理
const currentAbortController = ref(null)
const isRequestInProgress = ref(false)
const currentProgressTimer = ref(null)




// 对话框相关
const showDialog = ref(false)
const editingVoice = ref(null)
const dialogForm = reactive({
  title: '',
  content: '',
  category: 'greeting',
  language: 'zh-CN'
})

// 语音库数据
const voiceLibrary = ref([
  {
    id: 1,
    title: '欢迎问候',
    content: '您好，欢迎使用机器人系统！',
    category: 'greeting',
    language: 'zh-CN',
    duration: 3.5,
    volume: 80,
    speed: 1.0,
    pitch: 1.0,
    showSettings: false
  },
  {
    id: 2,
    title: '任务完成',
    content: '任务已成功完成，请查看结果。',
    category: 'notification',
    language: 'zh-CN',
    duration: 2.8,
    volume: 85,
    speed: 1.0,
    pitch: 1.0,
    showSettings: false
  },
  {
    id: 3,
    title: '系统错误',
    content: '系统检测到错误，正在尝试修复。',
    category: 'system',
    language: 'zh-CN',
    duration: 3.2,
    volume: 90,
    speed: 0.9,
    pitch: 1.0,
    showSettings: false
  },
  {
    id: 4,
    title: '感谢回应',
    content: '谢谢您的配合，祝您生活愉快！',
    category: 'response',
    language: 'zh-CN',
    duration: 3.0,
    volume: 75,
    speed: 1.1,
    pitch: 1.1,
    showSettings: false
  },
  {
    id: 5,
    title: 'Hello Greeting',
    content: 'Hello! Welcome to the robot control system!',
    category: 'greeting',
    language: 'en-US',
    duration: 4.2,
    volume: 80,
    speed: 1.0,
    pitch: 1.0,
    showSettings: false
  }
])

// 播放历史 - 从API获取真实数据
const playHistory = ref([])

// 快速播放语音
const quickPlayVoices = computed(() => {
  return voiceLibrary.value.filter(voice => 
    ['greeting', 'response', 'notification'].includes(voice.category)
  ).slice(0, 6)
})

// 过滤后的语音库
const filteredVoiceLibrary = computed(() => {
  console.log('🔍 [filteredVoiceLibrary] 计算属性被调用')
  console.log('🔍 [filteredVoiceLibrary] voiceLibrary.value.length:', voiceLibrary.value.length)
  console.log('🔍 [filteredVoiceLibrary] searchText.value:', searchText.value)
  console.log('🔍 [filteredVoiceLibrary] selectedCategory.value:', selectedCategory.value)
  console.log('🔍 [filteredVoiceLibrary] selectedLanguage.value:', selectedLanguage.value)

  const filtered = voiceLibrary.value.filter(voice => {
    const matchesSearch = !searchText.value ||
      voice.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
      voice.content.toLowerCase().includes(searchText.value.toLowerCase())

    const matchesCategory = !selectedCategory.value || voice.category === selectedCategory.value
    const matchesLanguage = !selectedLanguage.value || voice.language === selectedLanguage.value

    return matchesSearch && matchesCategory && matchesLanguage
  })

  console.log('🔍 [filteredVoiceLibrary] 过滤后数量:', filtered.length)
  return filtered
})

// 方法
const goBack = () => {
  router.push('/')
}

const openVoiceRecognition = () => {
  console.log('跳转到智能语音识别页面')
  router.push('/voice-recognition')
}

// 工具函数替代 systemUtils
function getCategoryName(category) {
  const map = {
    greeting: '问候语',
    notification: '通知',
    system: '系统',
    response: '回应'
  }
  return map[category] || category
}
function validateVoiceData(form) {
  const errors = []
  if (!form.title) errors.push('标题不能为空')
  if (!form.content) errors.push('内容不能为空')
  return { valid: errors.length === 0, errors }
}
function formatDuration(duration) {
  const min = Math.floor(duration / 60)
  const sec = Math.floor(duration % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// ==================== TTS API函数 ====================

// 获取TTS历史记录
const fetchTTSHistory = async () => {
  try {
    const response = await voiceApi.getTTSHistory()
    const result = response.data || response
    console.log('TTS历史记录API响应:', result)

    // 兼容新老结构
    let records = []
    if (result && result.success && result.data && Array.isArray(result.data.records)) {
      records = result.data.records
    } else if (Array.isArray(result.records)) {
      records = result.records
    } else if (Array.isArray(result)) {
      records = result
    }

    playHistory.value = records.map(record => ({
      id: record.id,
      title: record.title || record.original_text?.substring(0, 20) || '语音合成',
      content: record.original_text || record.text || '',
      timestamp: new Date(record.created_at || record.timestamp).getTime(),
      voice: record.voice_name || record.voice || '',
      duration: record.duration || 0,
      file_id: record.file_id,
      file_size: record.file_size,
      fileUrl: record.file_path || record.fileUrl
    }))

    console.log(`✅ 成功获取到 ${playHistory.value.length} 条TTS历史记录`)
    return playHistory.value
  } catch (error) {
    console.error('❌ 获取TTS历史记录失败:', error)
    playbackStatusText.value = `获取历史记录失败: ${error.message}`
    playHistory.value = []
    return []
  }
}

// 获取可用发音列表
const fetchAvailableVoices = async () => {
  try {
    const voices = await voiceApi.getAvailableVoices()

    if (voices && voices.length > 0) {
      availableVoices.value = voices
      console.log(`✅ 获取到 ${voices.length} 个可用发音`)

      // 设置默认发音
      if (!selectedVoice.value) {
        selectedVoice.value = voices[0].id || voices[0].name
        console.log('🎵 设置默认发音:', selectedVoice.value)
      }

      return voices
    } else {
      console.log('⚠️ 没有获取到发音列表')
      return []
    }
  } catch (error) {
    console.error('❌ 获取发音列表失败:', error)
    playbackStatusText.value = `获取发音列表失败: ${error.message}`
    return []
  }
}

// ==================== 语音文本管理API ====================

// 获取全部语音文本
const fetchVoiceTexts = async () => {
  try {
    console.log('🔄 [VoiceSystemView] 开始获取语音文本...')
    console.log('🌐 [VoiceSystemView] API端点:', '/api/tts/text')

    const response = await voiceApi.getVoiceTexts()
    const result = response.data || response
    console.log('📚 [VoiceSystemView] API返回的原始数据:', result)

    // 正确处理嵌套的数据结构
    if (result && result.success && result.data && result.data.texts) {
      const texts = result.data.texts
      console.log('📝 [VoiceSystemView] 提取的texts数组:', texts)
      console.log('📊 [VoiceSystemView] texts数组长度:', texts.length)

      // 将服务器数据转换为前端格式
      const serverTexts = texts.map((item, index) => {
        const converted = {
          // 使用正确的字段映射
          id: item.id || item.text_id,  // 优先使用 id，然后是 text_id
          text_id: item.text_id,        // 保留原始 text_id
          title: item.title || `语音文本${item.id || item.text_id}`,
          content: item.content || item.text || '',
          category: item.category || 'custom',
          language: item.language || 'zh-CN',
          created_at: item.created_at,
          updated_at: item.updated_at,
          duration: Math.round(((item.content || item.text || '')?.length || 0) * 0.1 * 10) / 10,
          volume: 80,
          speed: 1.0,
          pitch: 1.0,
          showSettings: false,
          originalData: item  // 保留原始数据用于调试
        }
        console.log(`📝 [VoiceSystemView] 转换第${index + 1}条:`, {
          原始数据: {
            id: item.id,
            text_id: item.text_id,
            title: item.title,
            content: (item.content || '').substring(0, 30) + '...'
          },
          转换后: {
            id: converted.id,
            title: converted.title,
            content: converted.content.substring(0, 30) + '...'
          }
        })
        return converted
      })

      // 强制更新 voiceLibrary
      voiceLibrary.value.splice(0, voiceLibrary.value.length, ...serverTexts)
      console.log('✅ [VoiceSystemView] 语音文本加载成功，共', serverTexts.length, '条')
      console.log('📊 [VoiceSystemView] voiceLibrary.value 更新后长度:', voiceLibrary.value.length)
      console.log('📊 [VoiceSystemView] voiceLibrary.value 内容预览:', voiceLibrary.value.slice(0, 2))

      // 触发响应式更新
      console.log('🔄 [VoiceSystemView] 触发响应式更新...')
      return serverTexts
    } else {
      console.log('ℹ️ [VoiceSystemView] 服务器返回空的语音文本列表或数据结构不正确')
      console.log('ℹ️ [VoiceSystemView] 返回的数据结构:', result)
      console.log('📊 [VoiceSystemView] 保持现有数据，当前 voiceLibrary.value 长度:', voiceLibrary.value.length)
      return []
    }
  } catch (error) {
    console.error('❌ [VoiceSystemView] 获取语音文本失败:', error)
    console.error('❌ [VoiceSystemView] 错误详情:', error.message, error.stack)
    // 不清空现有数据，保持用户体验
    console.log('📊 [VoiceSystemView] 保持现有数据，当前 voiceLibrary.value 长度:', voiceLibrary.value.length)
    return voiceLibrary.value
  }
}

// 保存语音文本（新增或编辑）
const saveVoiceText = async (voiceData) => {
  try {
    const result = await voiceApi.saveVoiceText(voiceData)
    console.log('💾 保存响应:', result)

    if (result.success) {
      // 保存成功后刷新列表
      await fetchVoiceTexts()
      return {
        success: true,
        message: result.message || '语音文本保存成功'
      }
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('❌ 保存语音文本失败:', error)
    return {
      success: false,
      message: `保存失败: ${error.message}`
    }
  }
}

// 删除语音文本
const deleteVoiceText = async (textId) => {
  try {
    console.log('🗑️ 删除语音文本:', textId)

    const result = await voiceApi.deleteVoiceText(textId)
    console.log('🗑️ 删除响应:', result)

    if (result.success) {
      console.log('✅ 语音文本删除成功')
      // 删除成功后刷新列表
      await fetchVoiceTexts()
      return {
        success: true,
        message: '语音文本删除成功'
      }
    } else {
      throw new Error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('❌ 删除语音文本失败:', error)
    return {
      success: false,
      message: `删除失败: ${error.message}`
    }
  }
}

// ==================== 简化的语音播放API ====================




const playVoice = async (voice) => {
  try {
    // 防止重复请求
    if (isRequestInProgress.value) {
      console.log('⚠️ 请求正在进行中，忽略重复点击')
      return
    }

    console.log('🎤 开始播放语音:', voice.title, voice.content)

    // 取消之前的请求
    if (currentAbortController.value) {
      currentAbortController.value.abort()
    }

    // 创建新的AbortController
    currentAbortController.value = new AbortController()
    isRequestInProgress.value = true

    if (playingVoiceId.value) {
      stopVoice()
    }

    playingVoiceId.value = voice.id
    currentVoice.value = voice
    playbackStatus.value = 'playing'
    playbackStatusText.value = '正在播放...'

    // 立即开始进度条动画
    const estimatedDuration = Math.max(voice.content.length * 0.3, 2)
    const updateInterval = 100
    const totalSteps = (estimatedDuration * 1000) / updateInterval
    let currentStep = 0

    // 重置进度
    playProgress.value = 0
    currentTime.value = 0

    // 清理之前的定时器
    if (currentProgressTimer.value) {
      clearInterval(currentProgressTimer.value)
    }

    // 立即开始进度条
    currentProgressTimer.value = setInterval(() => {
      currentStep++
      const progress = (currentStep / totalSteps) * 100
      const currentTimeSeconds = (currentStep * updateInterval) / 1000

      playProgress.value = Math.min(Math.round(progress), 100)
      currentTime.value = Math.min(currentTimeSeconds, estimatedDuration)

      // 播放完成
      if (currentStep >= totalSteps) {
        clearInterval(currentProgressTimer.value)
        currentProgressTimer.value = null
        console.log('🎤 播放完成')
        playbackStatusText.value = '播放完成'
        playingVoiceId.value = null
        currentVoice.value = null
        playProgress.value = 0
        currentTime.value = 0

        // 刷新历史记录
        setTimeout(() => {
          fetchTTSHistory()
        }, 500)
      }
    }, updateInterval)

    // 使用 voiceApi 进行语音合成和播放
    const result = await voiceApi.synthesizeText(voice.content, {
      voice_id: selectedVoice.value || 'default',
      play_immediately: true  // 让后端直接播放
    })

    console.log('🎵 TTS响应:', result)

    if (result.success) {
      console.log('✅ 语音播放成功')
      // 进度条已经在前面启动了，这里只需要记录成功状态
    } else {
      throw new Error(result.message || '语音播放失败')
    }

  } catch (error) {
    // 过滤AbortError，这些是正常的请求取消，不需要显示错误
    if (error.name === 'AbortError') {
      console.log('🔄 请求被取消（正常情况）')
      return
    }

    console.error('❌ 播放语音失败:', error)
    playbackStatusText.value = `播放失败: ${error.message}`
    playingVoiceId.value = null
    currentVoice.value = null
    playbackStatus.value = 'idle'
    playProgress.value = 0
    currentTime.value = 0

    // 清理进度条定时器
    if (currentProgressTimer.value) {
      clearInterval(currentProgressTimer.value)
      currentProgressTimer.value = null
    }
  } finally {
    // 重置请求状态
    isRequestInProgress.value = false
    currentAbortController.value = null
  }
}



const stopVoice = () => {
  try {
    console.log('⏹️ 停止音频播放')

    // 取消正在进行的请求
    if (currentAbortController.value) {
      currentAbortController.value.abort()
      currentAbortController.value = null
    }

    // 重置请求状态
    isRequestInProgress.value = false

    // 清理进度条定时器
    if (currentProgressTimer.value) {
      clearInterval(currentProgressTimer.value)
      currentProgressTimer.value = null
    }

    // 停止Web Speech API（如果有的话）
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }

    // 清理播放状态
    playingVoiceId.value = null
    currentVoice.value = null
    playbackStatus.value = 'idle'
    playbackStatusText.value = '系统就绪'
    playProgress.value = 0
    currentTime.value = 0

    console.log('✅ 播放已完全停止')
  } catch (error) {
    console.error('❌ 停止播放失败:', error)
  }
}

const stopAllVoice = () => {
  console.log('🛑 停止所有语音播放')
  stopVoice()
  const audios = document.querySelectorAll('audio')
  audios.forEach(audio => audio.pause())
}





const showAddDialog = () => {
  editingVoice.value = null
  dialogForm.title = ''
  dialogForm.content = ''
  dialogForm.category = 'greeting'
  dialogForm.language = 'zh-CN'
  showDialog.value = true
}

const editVoice = (voice) => {
  editingVoice.value = voice
  dialogForm.title = voice.title
  dialogForm.content = voice.content
  dialogForm.category = voice.category
  dialogForm.language = voice.language
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingVoice.value = null
}

const saveVoice = async () => {
  // 使用系统工具函数验证数据
  const validation = validateVoiceData(dialogForm)
  if (!validation.valid) {
    alert(validation.errors.join('\n'))
    return
  }

  try {
    // 显示保存状态
    const originalButtonText = '保存'
    // 这里可以添加按钮状态更新逻辑

    console.log('💾 准备保存语音文本...')

    // 准备保存数据
    const voiceData = {
      title: dialogForm.title.trim(),
      content: dialogForm.content.trim(),
      category: dialogForm.category,
      language: dialogForm.language
    }

    // 如果是编辑模式，添加ID
    if (editingVoice.value) {
      voiceData.id = editingVoice.value.id
      console.log('📝 编辑语音文本，ID:', voiceData.id)
    } else {
      console.log('➕ 添加新语音文本')
    }

    // 调用API保存
    const result = await saveVoiceText(voiceData)

    if (result.success) {
      console.log('✅ 语音文本保存成功')

      // 显示成功消息
      alert(result.message)

      // 关闭对话框
      closeDialog()

      // 刷新语音库列表（saveVoiceText函数内部已经调用了fetchVoiceTexts）
      console.log('🔄 语音库列表已自动刷新')
    } else {
      console.error('❌ 保存失败:', result.message)
      alert(result.message)
    }
  } catch (error) {
    console.error('❌ 保存语音文本时发生错误:', error)
    alert(`保存失败: ${error.message}`)
  }
}

const deleteVoice = async (voiceId) => {
  if (!confirm('确定要删除这条语音吗？')) {
    return
  }

  try {
    console.log('🗑️ 准备删除语音文本，ID:', voiceId)

    // 调用API删除
    const result = await deleteVoiceText(voiceId)

    if (result.success) {
      console.log('✅ 语音文本删除成功')

      // 显示成功消息
      alert(result.message)

      // 刷新语音库列表（deleteVoiceText函数内部已经调用了fetchVoiceTexts）
      console.log('🔄 语音库列表已自动刷新')
    } else {
      console.error('❌ 删除失败:', result.message)
      alert(result.message)
    }
  } catch (error) {
    console.error('❌ 删除语音文本时发生错误:', error)
    alert(`删除失败: ${error.message}`)
  }
}

const clearHistory = async () => {
  if (confirm('确定要清空播放历史吗？')) {
    try {
      // 这里可以添加清空服务器端历史记录的API调用
      // const response = await fetch(`${TTS_BASE_URL}/history`, { method: 'DELETE' })

      // 暂时只清空本地显示
      playHistory.value = []
      console.log('✅ 播放历史已清空')
    } catch (error) {
      console.error('❌ 清空历史记录失败:', error)
    }
  }
}

const exportVoiceData = () => {
  const data = {
    voiceLibrary: voiceLibrary.value,
    playHistory: playHistory.value,
    availableVoices: availableVoices.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'voice_data.json'
  a.click()
  URL.revokeObjectURL(url)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - timestamp
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化TTS功能
const initializeTTS = async () => {
  try {
    console.log('🎵 初始化TTS功能...')
    playbackStatusText.value = '正在初始化TTS...'

    // 获取可用发音列表
    const voices = await fetchAvailableVoices()

    if (voices && voices.length > 0) {
      console.log(`✅ TTS初始化完成，可用发音: ${voices.length} 个`)
      playbackStatusText.value = `TTS就绪，可用发音: ${voices.length} 个`
    } else {
      console.log('⚠️ 未获取到可用发音列表')
      playbackStatusText.value = 'TTS就绪，但未获取到发音列表'
    }

  } catch (error) {
    console.error('❌ TTS初始化失败:', error)
    playbackStatusText.value = `TTS初始化失败: ${error.message}`
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 语音系统组件已挂载')

  try {
    // 初始化TTS功能
    await initializeTTS()

    // 获取语音文本列表
    console.log('📚 加载语音文本列表...')
    await fetchVoiceTexts()

    // 获取TTS历史记录
    await fetchTTSHistory()

    // 如果没有错误，设置系统就绪状态
    if (!playbackStatusText.value.includes('失败')) {
      playbackStatusText.value = '系统就绪'
    }

    console.log('✅ 语音系统初始化完成')
  } catch (error) {
    console.error('❌ 语音系统初始化失败:', error)
    playbackStatusText.value = `初始化失败: ${error.message}`
  }
})

onUnmounted(() => {
  console.log('语音系统组件已卸载')

  // 取消所有正在进行的请求
  if (currentAbortController.value) {
    currentAbortController.value.abort()
  }

  stopAllVoice()
})
</script>

<style scoped>
/* 播放历史样式 */

.history-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(25, 118, 210, 0.5);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 6px;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(25, 118, 210, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.history-item:last-child {
  margin-bottom: 0;
}

.history-content {
  color: #e0e0e0;
  line-height: 1.4;
  font-size: 15px;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.history-time {
  font-size: 12px;
  color: #1976d2;
  opacity: 0.9;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.history-list {
  max-height: 600px; /* 增加高度从400px到600px，可以显示更多记录 */
  overflow-y: auto;
  padding-right: 8px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(25, 118, 210, 0.5);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(25, 118, 210, 0.7);
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-style: italic;
}

/* 智能语音识别按钮样式 */
.voice-recognition-btn {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00ccff;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  border: 2px solid rgba(0, 153, 255, 0.4);
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.voice-recognition-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 153, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.voice-recognition-btn:hover {
  color: #ffffff;
  border-color: rgba(0, 153, 255, 0.8);
  box-shadow: 0 0 20px rgba(0, 153, 255, 0.3);
  transform: translateY(-2px);
}

.voice-recognition-btn:hover::before {
  left: 100%;
}

.voice-recognition-btn:active {
  transform: translateY(0);
  box-shadow: 0 0 10px rgba(0, 153, 255, 0.5);
}
</style>
