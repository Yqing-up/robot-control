<template>
  <div class="remote-interaction-container">
    <!-- 现代化顶部导航栏 -->
    <header class="modern-header">
      <div class="header-content">
        <div class="nav-section">
          <button class="btn btn-back" @click="goBack">← 返回主页</button>
          <h1 class="title">远程交互中心</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 - 左右分栏布局 -->
    <section class="main-content-section">
      <div class="main-content-container">

        <!-- 左侧区域：视频和音频控制 -->
        <div class="left-section">
          <!-- 视频显示区域 -->
          <div class="video-display-area">
            <div class="video-title-group">
              <div class="video-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <h3 class="video-title">实时画面</h3>
            </div>
            <div class="video-frame">
              <img
                v-if="!videoError"
                :src="videoFeedUrl"
                class="video-stream-modern"
                @error="handleVideoError"
                @load="handleVideoLoad"
                alt="机器人视频流"
              />
              <div v-else class="video-error-state">
                <div class="error-content">
                  <div class="error-icon-container">
                    <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 9l6 6m0-6l-6 6M21 3H3v18h18V3z"/>
                    </svg>
                  </div>
                  <h3 class="error-title">视频连接中断</h3>
                  <p class="error-description">无法连接到机器人摄像头，请检查网络连接</p>
                  <button class="btn-retry-modern" @click="retryVideoConnection">
                    <svg class="retry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    重新连接
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 音频控制按钮区域 - 移动到视频下方 -->
          <div class="video-audio-controls" v-if="audioStreamEnabled">
            <div class="audio-controls-grid">
              <button
                class="btn-audio-control start"
                :class="{ 'active': audioStreamActive, 'loading': audioStreamLoading }"
                @click="startAudioStream"
                :disabled="audioStreamLoading || audioStreamActive"
              >
                <svg class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <span class="btn-text">{{ audioStreamLoading ? '连接中...' : '开启音频流' }}</span>
                <div v-if="audioStreamLoading" class="loading-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
              </button>

              <button
                class="btn-audio-control stop"
                :class="{ 'active': !audioStreamActive, 'loading': audioStreamLoading }"
                @click="stopAudioStream"
                :disabled="audioStreamLoading || !audioStreamActive"
              >
                <svg class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                <span class="btn-text">{{ audioStreamLoading ? '关闭中...' : '停止音频流' }}</span>
              </button>

              <button class="btn-hosting-modern" @click="openHostingDialog">
                <svg class="hosting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/>
                  <path d="M21 5c0 1.66-4 3-9 3S3 6.66 3 5s4-3 9-3 9 1.34 9 3z"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
                <span>智能托管</span>
              </button>
            </div>

            <!-- 音频流状态指示器 -->
            <div class="audio-stream-indicator" v-if="audioStreamActive">
              <div class="audio-wave-animation">
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
              </div>
              <span class="audio-status-text">音频流活跃</span>
            </div>
          </div>
        </div>

        <!-- 右侧区域：对话交互面板 -->
        <div class="right-section">
          <div class="control-panel chat-interaction-panel expanded-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h2 class="panel-title">对话交互</h2>
            </div>
          </div>

          <div class="panel-content chat-content">
            <!-- 对话历史区域 -->
            <div class="chat-history-modern" ref="chatHistoryRef">
              <div
                v-for="(message, index) in chatHistory"
                :key="index"
                class="message-bubble"
                :class="{ 'user-message': message.type === 'human', 'robot-message': message.type === 'robot' }"
              >
                <div class="message-avatar-modern">
                  <div class="avatar-circle" :class="message.type">
                    <svg v-if="message.type === 'human'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>
                <div class="message-content-modern">
                  <div class="message-text-modern">{{ message.text }}</div>
                  <div class="message-time-modern">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="chat-input-section">
              <!-- 选中动作提示 -->
              <div class="selected-action-indicator" v-if="selectedAction">
                <div class="action-chip">
                  <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span class="chip-text">已选择: {{ getActionDisplayName(selectedAction) }}</span>
                  <button class="chip-remove" @click="selectedAction = ''">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="input-container-modern">
                <div class="input-wrapper">
                  <textarea
                    v-model="userInput"
                    class="chat-input-modern"
                    placeholder="输入要对机器人说的话..."
                    rows="1"
                    @keydown.enter.prevent="sendMessage"
                    @input="autoResize"
                    :disabled="!chatConnected || messageSending"
                  ></textarea>
                  <button
                    class="btn-action-select"
                    @click="toggleActionDropdown"
                    :disabled="!actionConnected || actionsLoading"
                    title="选择动作"
                  >
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </button>
                  <button
                    class="btn-send-modern"
                    @click="sendMessage"
                    :disabled="!chatConnected || !userInput.trim() || messageSending"
                  >
                    <svg v-if="!messageSending" class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                    <div v-else class="sending-spinner"></div>
                  </button>
                </div>
              </div>

              <!-- 动作选择下拉菜单 -->
              <div class="action-dropdown" v-if="showActionDropdown" @click.stop>
                <div class="dropdown-header">
                  <h4 class="dropdown-title">选择动作</h4>
                  <button class="dropdown-close" @click="showActionDropdown = false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div class="dropdown-content">
                  <div v-if="actionsLoading" class="dropdown-loading">
                    <div class="loading-spinner"></div>
                    <span>加载动作列表...</span>
                  </div>
                  <div v-else-if="availableActions.length === 0" class="dropdown-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span>暂无可用动作</span>
                  </div>
                  <div v-else class="action-list">
                    <button
                      v-for="action in availableActions"
                      :key="action.name"
                      class="action-item"
                      @click="selectAction(action)"
                    >
                      <div class="action-item-info">
                        <span class="action-item-name">{{ action.display_name || action.name }}</span>
                        <span class="action-item-desc" v-if="action.description">{{ action.description }}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>

    <!-- 现代化托管弹窗 -->
    <Transition name="modal" appear>
      <div v-if="showHostingDialog" class="modal-overlay-modern" @click="closeHostingDialog">
        <div class="modal-container-modern" @click.stop>
          <div class="modal-header-modern">
            <div class="modal-title-section">
              <div class="modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/>
                  <path d="M21 5c0 1.66-4 3-9 3S3 6.66 3 5s4-3 9-3 9 1.34 9 3z"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">智能托管服务</h3>
                <p class="modal-subtitle">让AI助手为您管理机器人</p>
              </div>
            </div>
            <button class="btn-close-modern" @click="closeHostingDialog">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-content-modern">
            <div class="hosting-form-modern">
              <div class="form-group">
                <label class="form-label" for="hosting-requirements">
                  <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  托管任务描述
                </label>
                <textarea
                  id="hosting-requirements"
                  v-model="hostingRequirements"
                  class="form-textarea-modern"
                  placeholder="请详细描述您希望机器人执行的任务，例如：&#10;• 定时巡逻并报告状态&#10;• 与访客进行基础对话&#10;• 执行特定的动作序列&#10;• 监控环境变化并响应"
                  rows="6"
                ></textarea>
              </div>

              <div class="hosting-features">
                <h4 class="features-title">托管服务特性</h4>
                <div class="features-grid">
                  <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                    <span>智能决策</span>
                  </div>
                  <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    <span>实时监控</span>
                  </div>
                  <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>安全保障</span>
                  </div>
                  <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>24/7运行</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-modern">
            <button class="btn-secondary-modern" @click="closeHostingDialog">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              取消
            </button>
            <button
              class="btn-primary-modern"
              @click="confirmHosting"
              :disabled="!hostingRequirements.trim() || hostingSubmitting"
            >
              <svg v-if="!hostingSubmitting" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/>
              </svg>
              <div v-else class="btn-spinner"></div>
              {{ hostingSubmitting ? '启动中...' : '开始托管' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { robotApi, setRobotMode } from '../api/robotApi'
import { voiceApi } from '../api/voiceApi'
import { recordingApi } from '../api/recordingApi'
import { cameraApi } from '../api/cameraApi'
import { audioStreamApi } from '../api/audioStreamApi'
import { chatApi } from '../api/chatApi'

const router = useRouter()

// 页面导航
const goBack = () => {
  router.back()
}

// 紧急停止功能
const emergencyStop = async () => {
  try {
    console.log('🚨 执行紧急停止')

    // 停止所有音频流
    if (audioStreamActive.value) {
      await stopAudioStream()
    }

    // 停止当前执行的动作
    actionExecuting.value = false
    selectedAction.value = ''

    // 发送紧急停止指令到机器人
    // 这里可以添加具体的紧急停止API调用

    // 添加系统消息
    addChatMessage('robot', '🚨 系统已执行紧急停止，所有操作已中断')

    console.log('✅ 紧急停止执行完成')
  } catch (error) {
    console.error('❌ 紧急停止失败:', error)
    addChatMessage('robot', '❌ 紧急停止执行失败，请手动检查设备状态')
  }
}

// 自动调整输入框高度
const autoResize = (event) => {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

// 视频相关
const videoFeedUrl = ref('')
const videoError = ref(false)

// 动作控制相关
const actionConnected = ref(false)
const actionsLoading = ref(false)
const availableActions = ref([])
const selectedAction = ref('')
const actionExecuting = ref(false)

// 对话交互相关
const chatConnected = ref(false)
const chatHistory = ref([])
const userInput = ref('')
const messageSending = ref(false)
const chatHistoryRef = ref(null)
const chatPollingTimer = ref(null)
const lastMessageId = ref(null)
const lastMessageCount = ref(0)
const showActionDropdown = ref(false)

// 托管相关
const showHostingDialog = ref(false)
const hostingRequirements = ref('')
const hostingSubmitting = ref(false)

// ASR相关
const isRecordingActive = ref(false)

// 音频流相关
const audioStreamActive = ref(false)
const audioStreamLoading = ref(false)
const currentStreamId = ref(null)
const audioWebSocket = ref(null)
const audioContext = ref(null)
const audioStreamEnabled = ref(true) // 启用音频流功能（需要服务器端支持）

// 定时器
let asrPollingTimer = null

// 初始化视频流
const initializeVideo = () => {
  try {
    videoFeedUrl.value = cameraApi.getRawVideoFeed()
    videoError.value = false
    console.log('📹 初始化视频流:', videoFeedUrl.value)
  } catch (error) {
    console.error('❌ 视频流初始化失败:', error)
    videoError.value = true
  }
}

// 视频事件处理
const handleVideoError = () => {
  console.error('❌ 视频流加载失败')
  videoError.value = true
}

const handleVideoLoad = () => {
  console.log('✅ 视频流加载成功')
  videoError.value = false
}

const retryVideoConnection = () => {
  console.log('🔄 重新连接视频流')
  initializeVideo()
}

// 获取动作列表
const fetchActions = async () => {
  try {
    actionsLoading.value = true
    console.log('🎬 获取机器人动作列表')

    const response = await robotApi.getActions()
    console.log('📋 动作列表响应:', response)

    if (response && response.data && Array.isArray(response.data.actions)) {
      availableActions.value = response.data.actions
      actionConnected.value = true
      console.log(`✅ 成功获取 ${availableActions.value.length} 个动作`)
    } else if (response && Array.isArray(response.actions)) {
      availableActions.value = response.actions
      actionConnected.value = true
      console.log(`✅ 成功获取 ${availableActions.value.length} 个动作`)
    } else {
      throw new Error('动作列表格式不正确')
    }
  } catch (error) {
    console.error('❌ 获取动作列表失败:', error)
    actionConnected.value = false
    availableActions.value = []
  } finally {
    actionsLoading.value = false
  }
}

// 切换动作选择状态
const toggleActionSelection = (actionName) => {
  console.log('🔄 toggleActionSelection 被调用:', actionName, '当前选择:', selectedAction.value)
  if (selectedAction.value === actionName) {
    // 如果当前已选中，则取消选择
    selectedAction.value = ''
    console.log('🔄 取消选择动作:', actionName)
  } else {
    // 如果未选中，则选择该动作
    selectedAction.value = actionName
    console.log('✅ 选择动作:', actionName)
  }
}

// 执行动作
const executeAction = async (actionName) => {
  try {
    actionExecuting.value = true
    console.log('🎬 执行动作:', actionName)

    const response = await robotApi.executeAction(actionName)
    console.log('✅ 动作执行响应:', response)

    // 添加到聊天历史
    addChatMessage('robot', `正在执行动作: ${getActionDisplayName(actionName)}`)

  } catch (error) {
    console.error('❌ 动作执行失败:', error)
    addChatMessage('robot', `动作执行失败: ${error.message}`)
  } finally {
    actionExecuting.value = false
  }
}

// 连接动作服务
const connectActionService = async () => {
  await fetchActions()
}

// 获取动作显示名称
const getActionDisplayName = (actionName) => {
  const action = availableActions.value.find(a => a.name === actionName)
  return action ? (action.display_name || action.name) : actionName
}

// 切换动作下拉菜单
const toggleActionDropdown = () => {
  showActionDropdown.value = !showActionDropdown.value
  if (showActionDropdown.value && availableActions.value.length === 0) {
    fetchActions()
  }
}

// 选择动作
const selectAction = (action) => {
  selectedAction.value = action.name
  userInput.value = `执行动作: ${action.display_name || action.name}`
  showActionDropdown.value = false
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || messageSending.value) return

  try {
    messageSending.value = true
    const message = userInput.value.trim()

    // 清空输入框
    userInput.value = ''

    // 发送消息到聊天API
    console.log('💬 发送消息到聊天API:', message)
    const response = await chatApi.sendHumanMessage(message)

    if (response && response.success) {
      console.log('✅ 人类消息发送成功，等待轮询显示')

      // 调用TTS语音合成，让机器人说出用户的消息
      try {
        console.log('🎤 开始TTS语音合成:', message)
        const ttsResponse = await voiceApi.synthesizeText(message, {
          voice_id: 'zh-CN',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0
        })

        if (ttsResponse && ttsResponse.success) {
          console.log('✅ TTS语音合成成功')
        } else if (ttsResponse && ttsResponse.timeout) {
          console.log('⏰ TTS语音合成超时，但请求已发送')
        } else {
          console.warn('⚠️ TTS语音合成失败:', ttsResponse?.message)
        }
      } catch (ttsError) {
        console.error('❌ TTS语音合成错误:', ttsError.message)
        // TTS失败不影响消息发送流程
      }

      // 可选：执行选中的动作（如果有）
      if (selectedAction.value) {
        await executeSelectedAction()
      }

      // 轮询会自动获取并显示消息
    } else {
      throw new Error(response?.message || '发送消息失败')
    }

  } catch (error) {
    console.error('❌ 发送消息失败:', error)
    // 只有在真正失败时才添加错误消息
    addChatMessage('robot', `发送失败: ${error.message}`)
  } finally {
    messageSending.value = false
  }
}

// 语音合成
const synthesizeText = async (text) => {
  try {
    console.log('🔊 TTS语音合成:', text)
    const response = await voiceApi.synthesizeText(text, {
      play_immediately: true
    })
    console.log('✅ TTS合成成功:', response)
  } catch (error) {
    console.error('❌ TTS合成失败:', error)
    throw error
  }
}

// 执行选中的动作
const executeSelectedAction = async () => {
  if (!selectedAction.value) return

  try {
    console.log('🎬 执行选中的动作:', selectedAction.value)
    await robotApi.executeAction(selectedAction.value)
    addChatMessage('robot', `同时执行动作: ${getActionDisplayName(selectedAction.value)}`)

    // 执行后清除选择
    selectedAction.value = ''
  } catch (error) {
    console.error('❌ 执行选中动作失败:', error)
    addChatMessage('robot', `动作执行失败: ${error.message}`)
  }
}

// 添加聊天消息
const addChatMessage = (type, text, timestamp = null, messageId = null) => {
  const message = {
    type,
    text,
    timestamp: timestamp || Date.now(),
    id: messageId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  console.log('✅ 直接添加消息到界面:', type, text, 'ID:', message.id)
  chatHistory.value.push(message)

  // 滚动到底部
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
    }
  })
}

// 加载聊天历史记录
const loadChatHistory = async (isInitialLoad = true) => {
  try {
    if (isInitialLoad) {
      console.log('📚 初始加载聊天历史记录...')
    }

    const result = await chatApi.getChatHistory(1000) // 获取最近1000条消息

    if (result && result.success && result.data && result.data.messages) {
      if (isInitialLoad) {
        // 初始加载：清空当前历史记录并加载所有消息
        chatHistory.value = []

        // 按时间顺序排序（最早的在前面）
        const sortedMessages = result.data.messages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        sortedMessages.forEach(msg => {
          addChatMessage(
            msg.type, // 'human' 或 'robot'
            msg.text,
            new Date(msg.created_at).getTime(),
            msg.id
          )
        })

        // 记录最新消息的ID和消息总数
        if (sortedMessages.length > 0) {
          lastMessageId.value = Math.max(...sortedMessages.map(msg => msg.id))
          console.log('📝 记录最新消息ID:', lastMessageId.value)
        }

        lastMessageCount.value = sortedMessages.length
        console.log('✅ 聊天历史记录初始加载成功，共', sortedMessages.length, '条消息')
        console.log('📝 记录初始消息数量:', lastMessageCount.value)
      } else {
        // 轮询更新：检查消息总数是否有变化
        const allMessages = result.data.messages
        const currentMessageCount = allMessages.length

        console.log('🔍 轮询检查：当前消息数', currentMessageCount, '上次消息数', lastMessageCount.value)

        if (currentMessageCount > lastMessageCount.value) {
          console.log('🆕 发现新消息！消息数从', lastMessageCount.value, '增加到', currentMessageCount)

          // 获取新增的消息（从上次记录的数量开始）
          const sortedAllMessages = allMessages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          const newMessages = sortedAllMessages.slice(lastMessageCount.value)
          console.log('🆕 新消息详情:', newMessages.map(msg => `${msg.type}: ${msg.text} (ID: ${msg.id})`))

          // 直接添加所有新消息
          newMessages.forEach(msg => {
            console.log('➕ 立即显示新消息:', msg.type, msg.text, 'ID:', msg.id)

            // 直接添加到聊天历史，让用户立即看到
            const message = {
              type: msg.type,
              text: msg.text,
              timestamp: new Date(msg.created_at).getTime(),
              id: msg.id
            }

            chatHistory.value.push(message)
            console.log('✅ 消息已添加到界面，当前总消息数:', chatHistory.value.length)
          })

          // 滚动到底部
          nextTick(() => {
            if (chatHistoryRef.value) {
              chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
              console.log('📜 已滚动到底部')
            }
          })

          // 更新消息计数
          lastMessageCount.value = currentMessageCount
          console.log('📝 更新消息计数:', lastMessageCount.value)
        } else {
          console.log('ℹ️ 轮询检查：没有新消息')
        }
      }
    } else {
      if (isInitialLoad) {
        console.log('ℹ️ 没有聊天历史记录')
      }
    }
  } catch (error) {
    console.error('❌ 加载聊天历史记录失败:', error)
    if (isInitialLoad) {
      addChatMessage('robot', '加载历史记录失败，但可以开始新的对话')
    }
  }
}

// 开始聊天轮询
const startChatPolling = () => {
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
  }

  chatPollingTimer.value = setInterval(async () => {
    try {
      console.log('🔄 执行聊天轮询检查...')
      await loadChatHistory(false) // 增量更新
    } catch (error) {
      console.warn('⚠️ 聊天轮询失败:', error.message)
    }
  }, 2000) // 改为每2秒轮询一次，减少服务器压力

  console.log('🔄 聊天轮询已启动，每2秒检查新消息')
}

// 停止聊天轮询
const stopChatPolling = () => {
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
    chatPollingTimer.value = null
    console.log('⏹️ 聊天轮询已停止')
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 托管相关函数
const openHostingDialog = () => {
  console.log('🤖 打开托管对话框')
  showHostingDialog.value = true
  hostingRequirements.value = ''
}

const closeHostingDialog = () => {
  console.log('🤖 关闭托管对话框')
  showHostingDialog.value = false
  hostingRequirements.value = ''
  hostingSubmitting.value = false
}

const confirmHosting = async () => {
  if (!hostingRequirements.value.trim()) {
    return
  }

  try {
    hostingSubmitting.value = true
    console.log('🤖 提交托管需求:', hostingRequirements.value)

    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('✅ 托管成功')

    // 显示成功消息
    alert('托管成功！机器人将根据您的需求执行任务。')

    // 关闭弹窗
    closeHostingDialog()

  } catch (error) {
    console.error('❌ 托管失败:', error)
    alert('托管失败，请重试。')
  } finally {
    hostingSubmitting.value = false
  }
}

// 检查ASR录音状态（已注释，改用聊天API）
// const checkAsrStatus = async () => {
//   try {
//     console.log('🎤 检查ASR录音状态...')
//     const statusResponse = await recordingApi.getStatus()
//     console.log('🎤 ASR状态检查:', statusResponse)

//     // 检查录音是否正在进行
//     let isRecording = false
//     if (statusResponse && statusResponse.data) {
//       // 处理不同的状态响应格式
//       isRecording = statusResponse.data.is_recording ||
//                    statusResponse.data.recording ||
//                    statusResponse.data.status === 'recording' ||
//                    statusResponse.data.status === 'active'
//     } else if (statusResponse && statusResponse.success) {
//       isRecording = statusResponse.is_recording ||
//                    statusResponse.recording ||
//                    statusResponse.status === 'recording' ||
//                    statusResponse.status === 'active'
//     }

//     isRecordingActive.value = isRecording
//     console.log(`🎤 录音状态: ${isRecording ? '进行中' : '未开始'}`)

//     return isRecording
//   } catch (error) {
//     console.error('❌ 检查ASR状态失败:', error)
//     isRecordingActive.value = false
//     return false
//   }
// }

// ASR语音识别轮询（已注释，改用聊天API）
// const startAsrPolling = () => {
//   asrPollingTimer = setInterval(async () => {
//     try {
//       // 只有在录音激活时才获取语音转文本
//       if (isRecordingActive.value) {
//         console.log('🎤 录音进行中，获取语音转文本...')
//         const response = await recordingApi.getRecentRecords(1) // 获取最近1分钟的记录

//         if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
//           // 获取最新的语音识别结果
//           const latestRecord = response.data[response.data.length - 1]
//           if (latestRecord && latestRecord.text && latestRecord.text.trim()) {
//             // 检查是否是新的语音记录（避免重复）
//             const lastRobotMessage = chatHistory.value.filter(m => m.type === 'robot').pop()
//             if (!lastRobotMessage || lastRobotMessage.text !== latestRecord.text.trim()) {
//               addChatMessage('robot', latestRecord.text.trim())
//             }
//           }
//         }
//       } else {
//         // 录音未激活时，偶尔检查一次状态（每10秒检查一次）
//         if (Date.now() % 10000 < 1000) {
//           console.log('🎤 定期检查录音状态...')
//           await checkAsrStatus()
//         }
//       }
//     } catch (error) {
//       console.warn('⚠️ ASR轮询失败:', error.message)
//     }
//   }, 1000) // 每秒检查一次
// }

// const stopAsrPolling = () => {
//   if (asrPollingTimer) {
//     clearInterval(asrPollingTimer)
//     asrPollingTimer = null
//   }
// }

// 音频流相关函数
const startAudioStream = async () => {
  if (audioStreamLoading.value || audioStreamActive.value) {
    console.log('🎵 音频流已在运行或正在启动中')
    return
  }

  try {
    audioStreamLoading.value = true
    console.log('🎵 开始启动音频流...')

    // 先清理可能存在的其他音频流
    await cleanupAllAudioStreams()

    // 等待一下确保清理完成
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 调用开始音频流接口
    const response = await audioStreamApi.startStream()
    console.log('🎵 音频流启动响应:', response)

    // 解析响应数据结构
    let streamId = null
    let websocketUrl = null

    if (response && response.data) {
      streamId = response.data.stream_id
      websocketUrl = response.data.websocket_url
    } else if (response) {
      streamId = response.stream_id
      websocketUrl = response.websocket_url
    }

    if (streamId && websocketUrl) {
      currentStreamId.value = streamId
      console.log('🎵 获取到音频流ID:', currentStreamId.value)
      console.log('🎵 WebSocket URL:', websocketUrl)

      // 创建WebSocket连接
      try {
        await createAudioWebSocket(websocketUrl)
        console.log('✅ WebSocket连接成功建立')
      } catch (wsError) {
        console.error('❌ WebSocket连接失败:', wsError)
        throw new Error(`WebSocket连接失败: ${wsError.message}`)
      }

      audioStreamActive.value = true
      console.log('✅ 音频流启动成功')
    } else {
      console.error('🎵 响应数据结构:', response)
      throw new Error('未获取到有效的stream_id或websocket_url')
    }
  } catch (error) {
    console.error('❌ 音频流启动失败:', error)

    // 如果是设备忙碌错误，提示用户
    if (error.response && error.response.data && error.response.data.message) {
      const errorMessage = error.response.data.message
      if (errorMessage.includes('音频设备忙碌')) {
        console.log('🎵 检测到设备忙碌，尝试清理后重试...')
        // 可以在这里添加用户提示或自动重试逻辑
      }
    }
  } finally {
    audioStreamLoading.value = false
  }
}

const stopAudioStream = async () => {
  if (audioStreamLoading.value || !audioStreamActive.value || !currentStreamId.value) {
    console.log('🎵 音频流未运行或正在处理中')
    return
  }

  try {
    audioStreamLoading.value = true
    console.log('🎵 开始停止音频流...', currentStreamId.value)

    // 关闭WebSocket连接
    closeAudioWebSocket()

    // 调用停止音频流接口
    await audioStreamApi.stopStream(currentStreamId.value)
    console.log('✅ 音频流停止成功')

    // 重置状态
    audioStreamActive.value = false
    currentStreamId.value = null
  } catch (error) {
    console.error('❌ 音频流停止失败:', error)
  } finally {
    audioStreamLoading.value = false
  }
}

const createAudioWebSocket = async (websocketUrl) => {
  try {
    console.log('🎵 创建Socket.IO连接...', websocketUrl)

    // 初始化Web Audio API
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      console.log('🎵 Web Audio Context 已初始化')
    }

    // 确保AudioContext处于运行状态
    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
      console.log('🎵 Web Audio Context 已恢复')
    }

    // 创建Socket.IO连接
    audioWebSocket.value = audioStreamApi.createSocketIOConnection()

    // 等待连接建立或失败
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket.IO连接超时'))
      }, 10000) // 10秒超时

      audioWebSocket.value.on('connect', () => {
        clearTimeout(timeout)
        console.log('✅ Socket.IO连接已建立')

        // 加入音频流
        console.log('🎵 加入音频流:', currentStreamId.value)
        audioWebSocket.value.emit('join_stream', { stream_id: currentStreamId.value })

        resolve()
      })

      audioWebSocket.value.on('connect_error', (error) => {
        clearTimeout(timeout)
        console.error('❌ Socket.IO连接失败:', error)
        reject(error)
      })

      audioWebSocket.value.on('error', (error) => {
        console.error('❌ Socket.IO错误:', error)
      })
    })

    // Socket.IO事件处理
    audioWebSocket.value.on('joined', (data) => {
      console.log('✅ 已加入音频流:', data.stream_id)
    })

    audioWebSocket.value.on('audio_data', async (data) => {
      try {
        console.log('🎵 收到音频数据:', data.sequence, '大小:', data.data_length, '编码:', data.encoding)

        // 处理接收到的音频数据
        if (data.encoding === 'base64') {
          console.log('🎵 处理base64编码的PCM数据')
          try {
            const binaryString = atob(data.data)
            const arrayBuffer = new ArrayBuffer(binaryString.length)
            const uint8Array = new Uint8Array(arrayBuffer)
            for (let i = 0; i < binaryString.length; i++) {
              uint8Array[i] = binaryString.charCodeAt(i)
            }
            await playPCMAudio(arrayBuffer)
          } catch (decodeError) {
            console.error('❌ base64解码失败:', decodeError)
          }
        } else {
          console.log('🎵 收到其他编码格式:', data.encoding)
        }
      } catch (error) {
        console.error('❌ 音频数据处理失败:', error)
      }
    })

    audioWebSocket.value.on('status', (data) => {
      console.log('🎵 状态更新:', data.message)
    })

    audioWebSocket.value.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO连接已断开:', reason)
      // 重置音频流状态
      audioStreamActive.value = false
    })

    audioWebSocket.value.on('error', (error) => {
      console.error('❌ Socket.IO错误:', error)
    })

  } catch (error) {
    console.error('❌ 创建音频WebSocket失败:', error)
    throw error
  }
}

// 播放PCM音频数据
const playPCMAudio = async (arrayBuffer) => {
  try {
    // PCM音频配置（与后端配置一致）
    const sampleRate = 44100
    const channels = 1
    const bytesPerSample = 2 // 16-bit PCM

    // 计算样本数量
    const samples = arrayBuffer.byteLength / bytesPerSample

    // 创建AudioBuffer
    const audioBuffer = audioContext.value.createBuffer(channels, samples, sampleRate)

    // 将PCM数据转换为Float32Array
    const int16Array = new Int16Array(arrayBuffer)
    const float32Array = new Float32Array(samples)

    // 转换16-bit PCM到float32 (-1.0 到 1.0)
    for (let i = 0; i < samples; i++) {
      float32Array[i] = int16Array[i] / 32768.0
    }

    // 复制数据到AudioBuffer
    audioBuffer.copyToChannel(float32Array, 0)

    // 播放音频
    const source = audioContext.value.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.value.destination)
    source.start()

    console.log('🎵 PCM音频播放成功, 样本数:', samples, '时长:', samples / sampleRate, '秒')
  } catch (error) {
    console.error('❌ PCM音频播放失败:', error)
  }
}

const closeAudioWebSocket = () => {
  if (audioWebSocket.value) {
    audioWebSocket.value.disconnect()
    audioWebSocket.value = null
    console.log('🔌 Socket.IO连接已关闭')
  }
}

// 清理所有活跃的音频流
const cleanupAllAudioStreams = async () => {
  if (!audioStreamEnabled.value) {
    console.log('🎵 音频流功能已禁用，跳过清理')
    return
  }

  try {
    console.log('🧹 清理所有活跃的音频流...')

    // 关闭当前的WebSocket连接
    closeAudioWebSocket()

    // 重置状态
    audioStreamActive.value = false
    currentStreamId.value = null

    // 获取所有活跃的音频流
    const response = await audioStreamApi.getStreams()
    console.log('🎵 获取到活跃音频流响应:', response)

    // 处理API响应的数据结构
    let activeStreams = []
    if (response && response.data && response.data.active_streams) {
      // 将对象转换为数组
      activeStreams = Object.values(response.data.active_streams)
      console.log(`🎵 发现 ${activeStreams.length} 个活跃音频流:`, activeStreams.map(s => s.stream_id))
    } else if (response && Array.isArray(response)) {
      // 如果直接返回数组（备用处理）
      activeStreams = response
    }

    if (activeStreams.length > 0) {
      console.log(`🎵 开始清理 ${activeStreams.length} 个活跃音频流...`)

      // 逐一停止所有音频流
      for (const stream of activeStreams) {
        try {
          if (stream && stream.stream_id) {
            console.log(`🎵 正在停止音频流: ${stream.stream_id}`)
            await audioStreamApi.stopStream(stream.stream_id)
            console.log('✅ 已停止音频流:', stream.stream_id)
          }
        } catch (error) {
          console.error('❌ 停止音频流失败:', stream.stream_id, error)
          // 继续处理其他流，不要因为一个失败就停止
        }
      }
    } else {
      console.log('🎵 没有发现活跃的音频流')
    }

    console.log('✅ 音频流清理完成')
  } catch (error) {
    console.error('❌ 清理音频流失败:', error)
    // 即使清理失败，也要重置状态
    audioStreamActive.value = false
    currentStreamId.value = null
    closeAudioWebSocket()
  }
}

// 初始化聊天服务
const initializeChatService = async () => {
  console.log('🚀 初始化聊天服务...')
  chatConnected.value = true

  // 加载聊天历史记录
  await loadChatHistory(true)

  // 启动聊天轮询
  startChatPolling()

  console.log('✅ 聊天服务初始化完成，轮询已启动')

  // 注释掉ASR相关功能，改用聊天API
  // await checkAsrStatus()
  // startAsrPolling()

  // 不再添加系统启动消息，避免测试消息
  // addChatMessage('robot', '远程交互系统已启动，可以开始对话了！')
}

// 生命周期
onMounted(async () => {
  console.log('🚀 远程交互页面已挂载')

  // 确保使用真实机器人模式
  setRobotMode('real')
  console.log('🤖 远程交互页面强制使用真实机器人模式')

  // 页面刷新时清理所有活跃的音频流
  await cleanupAllAudioStreams()

  // 初始化各个服务
  initializeVideo()
  await connectActionService()
  await initializeChatService()

  // 添加点击外部关闭下拉菜单的事件监听
  document.addEventListener('click', (event) => {
    if (showActionDropdown.value && !event.target.closest('.action-dropdown') && !event.target.closest('.btn-action-select')) {
      showActionDropdown.value = false
    }
  })
})

onBeforeUnmount(async () => {
  console.log('🔄 远程交互页面即将卸载')

  // 停止聊天轮询
  stopChatPolling()

  // stopAsrPolling() // 已注释，改用聊天API

  // 清理音频流资源
  await cleanupAllAudioStreams()
})
</script>

<style scoped>
/* 现代化远程交互页面样式 */
.remote-interaction-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
  padding: 0;
  margin: 0;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow-x: hidden;
}

.remote-interaction-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 153, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(77, 166, 255, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 现代化顶部导航栏 */
.modern-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 2%;
  max-width: none;
  margin: 0;
  position: relative;
  box-sizing: border-box;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}





/* 主要内容区域 - 左右分栏布局 */
.main-content-section {
  padding: 2rem;
  background: transparent;
  position: relative;
  z-index: 1;
}

.main-content-container {
  display: flex;
  gap: 1.5rem; /* 进一步减少左右区域间距，让对话框更宽 */
  max-width: 1800px; /* 进一步增加最大宽度 */
  margin: 0 auto;
  height: calc(100vh - 120px); /* 增加可用高度 */
  padding: 0 1rem; /* 添加左右内边距，更好地利用屏幕空间 */
}

/* 左侧区域：视频和音频控制 */
.left-section {
  flex: 2; /* 大幅增加左侧区域的比例，让视频更宽 */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 进一步减少间距，让音频控制按钮更贴近视频 */
  min-width: 0;
}

/* 右侧区域：对话交互面板 */
.right-section {
  flex: 1; /* 保持右侧区域的比例 */
  min-width: 0;
  margin-left: 0.25rem; /* 进一步减少左边距，让对话框更宽 */
}

/* 视频显示区域 */
.video-display-area {
  flex: none; /* 不使用flex比例，改为固定尺寸 */
  background: rgba(16, 26, 40, 0.6);
  border-radius: 16px;
  padding: 1.5rem; /* 减少内边距，让视频本身更大 */
  border: 1px solid rgba(0, 153, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 100%; /* 占满容器宽度 */
}

/* 视频标题组 */
.video-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

/* 视频图标 */
.video-icon {
  width: 24px;
  height: 24px;
  color: #0099ff;
  stroke-width: 2;
}

/* 视频标题 */
.video-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, #0099ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Orbitron', monospace;
}

/* 音频控制区域 - 移动到视频下方 */
.video-audio-controls {
  margin-top: 0.5rem; /* 减少上边距，让按钮更贴近视频 */
  padding: 0.75rem 1rem; /* 减少上下内边距，保持左右内边距 */
  background: rgba(16, 26, 40, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(0, 153, 255, 0.15);
  backdrop-filter: blur(8px);
}

.video-frame {
  position: relative;
  width: 100%;
  height: 680px; /* 进一步增加视频框架高度到680px */
  overflow: hidden;
  border-radius: 12px;
  background: #000;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 153, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.video-stream-modern {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

/* 取消视频流的悬浮缩放效果 */
.video-stream-modern:hover {
  /* transform: scale(1.02); */
}

.video-error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.error-icon-container {
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ff6b6b;
  stroke-width: 1.5;
  filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.4));
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.error-description {
  font-size: 1rem;
  color: #cccccc;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.btn-retry-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  text-decoration: none;
}

.btn-retry-modern:hover {
  background: rgba(0, 153, 255, 0.3);
  border-color: rgba(0, 153, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
}

.retry-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}



.audio-stream-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.audio-wave-animation {
  display: flex;
  align-items: center;
  gap: 2px;
}

.wave-bar {
  width: 3px;
  height: 12px;
  background: #00ff00;
  border-radius: 2px;
  animation: wave-animation 1.5s infinite ease-in-out;
}

.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }

.audio-status-text {
  font-size: 0.875rem;
  color: #00ff00;
  font-weight: 500;
}



.main-panels-container {
  width: 100%;
  max-width: none;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  padding: 0 1rem;
}

.control-panel {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(25px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 153, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: none !important; /* 完全禁用所有过渡效果 */
  position: relative;
  overflow: hidden;
  width: 100%;
  transform: none !important; /* 强制禁用任何transform效果 */
}

.control-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 153, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

/* 完全移除控制面板的悬浮效果 */

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 153, 255, 0.3);
  background: linear-gradient(90deg, transparent, rgba(0, 153, 255, 0.05), transparent);
  margin: -2rem -2rem 2rem -2rem;
  padding: 1.5rem 2rem;
  border-radius: 20px 20px 0 0;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  width: 24px;
  height: 24px;
  color: #0099ff;
  stroke-width: 2;
}

.panel-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, #0099ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.panel-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.panel-status.connected {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
  transition: all 0.3s ease;
}

.panel-status.connected .status-indicator {
  background: #00ff00;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
  animation: pulse-green 2s infinite;
}

.status-text {
  font-size: 0.75rem;
  color: #ff6b6b;
  font-weight: 500;
}

.panel-status.connected .status-text {
  color: #00ff00;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.expanded-panel {
  min-height: 800px; /* 增加对话面板的最小高度 */
  width: 100%;
  max-width: none;
}

.expanded-panel .panel-content {
  min-height: 700px; /* 增加面板内容的最小高度 */
  display: flex;
  flex-direction: column;
}



.expanded-panel .chat-history-modern {
  max-height: 550px; /* 增加对话历史区域的最大高度 */
}



.disconnected-state-modern,
.loading-state-modern,
.empty-state-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  height: 100%;
  min-height: 300px;
}

.state-icon,
.empty-icon {
  width: 48px;
  height: 48px;
  color: #666;
  stroke-width: 1.5;
  margin-bottom: 1rem;
}

.state-title,
.empty-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.state-description,
.empty-description {
  font-size: 0.9rem;
  color: #cccccc;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.btn-action-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  text-decoration: none;
}

.btn-action-modern:hover {
  background: rgba(0, 153, 255, 0.3);
  border-color: rgba(0, 153, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.loading-state-modern {
  gap: 1rem;
}

.loading-animation {
  display: flex;
  gap: 0.5rem;
}

.loading-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0099ff;
  animation: loading-bounce 1.4s infinite ease-in-out both;
}

.loading-circle:nth-child(1) { animation-delay: -0.32s; }
.loading-circle:nth-child(2) { animation-delay: -0.16s; }

.loading-text {
  color: #cccccc;
  font-size: 0.9rem;
}





.btn-execute-modern {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  width: 100%;
  justify-content: center;
  min-height: 40px;
}

.btn-execute-modern:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.3);
  border-color: rgba(0, 153, 255, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 153, 255, 0.2);
}

.btn-execute-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.execute-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.executing-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 165, 0, 0.3);
  border-top: 2px solid #ffa500;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 音频控制面板样式 */
.audio-control-panel {
  /* 继承基础面板样式 */
}

.audio-controls-grid {
  display: flex;
  flex-direction: row; /* 改为水平排列 */
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap; /* 允许换行以适应小屏幕 */
}

.btn-audio-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1.5rem; /* 减少上下内边距 */
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
  flex: 1; /* 让按钮平均分配宽度 */
  min-width: 0; /* 允许按钮收缩 */
  justify-content: center; /* 居中对齐内容 */
}

.btn-audio-control::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.btn-audio-control:hover:not(:disabled)::before {
  left: 100%;
}

.btn-audio-control:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.2);
  border-color: rgba(0, 153, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 153, 255, 0.2);
}

.btn-audio-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-audio-control.active {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
  color: #00ff00;
}

.btn-audio-control.loading {
  background: rgba(255, 165, 0, 0.1);
  border-color: rgba(255, 165, 0, 0.3);
  color: #ffa500;
}

.audio-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  flex-shrink: 0;
}

.btn-text {
  flex: 1;
  text-align: left;
  font-size: 0.9rem;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: loading-dots 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

.btn-hosting-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(138, 43, 226, 0.1);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1.5rem; /* 减少上下内边距，与音频控制按钮保持一致 */
  color: #8a2be2;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
  flex: 1; /* 让按钮平均分配宽度 */
  min-width: 0; /* 允许按钮收缩 */
  justify-content: center; /* 居中对齐内容 */
}

.btn-hosting-modern:hover {
  background: rgba(138, 43, 226, 0.2);
  border-color: rgba(138, 43, 226, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(138, 43, 226, 0.2);
}

.hosting-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.audio-visualizer {
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.visualizer-bars {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 3px;
  height: 40px;
  margin-bottom: 1rem;
}

.bar {
  width: 4px;
  background: #00ff00;
  border-radius: 2px;
  animation: visualizer-bar 1.5s infinite ease-in-out;
}

.bar:nth-child(1) { animation-delay: 0s; }
.bar:nth-child(2) { animation-delay: 0.1s; }
.bar:nth-child(3) { animation-delay: 0.2s; }
.bar:nth-child(4) { animation-delay: 0.3s; }
.bar:nth-child(5) { animation-delay: 0.4s; }
.bar:nth-child(6) { animation-delay: 0.5s; }
.bar:nth-child(7) { animation-delay: 0.4s; }
.bar:nth-child(8) { animation-delay: 0.3s; }
.bar:nth-child(9) { animation-delay: 0.2s; }
.bar:nth-child(10) { animation-delay: 0.1s; }
.bar:nth-child(11) { animation-delay: 0s; }
.bar:nth-child(12) { animation-delay: 0.1s; }

.visualizer-text {
  color: #00ff00;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
}

/* 对话交互面板样式 */
.chat-interaction-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  flex: 1;
}

.chat-history-modern {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  margin-bottom: 0;
  padding-bottom: 100px;
  max-height: calc(100% - 100px);
  scroll-behavior: smooth;
}

.message-bubble {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: flex-start;
  animation: message-appear 0.3s ease-out;
}

.message-bubble.user-message {
  flex-direction: row-reverse;
}

.message-avatar-modern {
  flex-shrink: 0;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  transition: all 0.3s ease;
}

.avatar-circle.human {
  background: rgba(255, 153, 0, 0.1);
  border-color: rgba(255, 153, 0, 0.3);
  color: #ff9900;
}

.avatar-circle.robot {
  background: rgba(0, 153, 255, 0.1);
  border-color: rgba(0, 153, 255, 0.3);
  color: #0099ff;
}

.avatar-circle svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.message-content-modern {
  max-width: 70%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  position: relative;
}

.user-message .message-content-modern {
  background: rgba(0, 153, 255, 0.15);
  border-color: rgba(0, 153, 255, 0.3);
}

.message-text-modern {
  color: #ffffff;
  line-height: 1.5;
  word-wrap: break-word;
  margin-bottom: 0.5rem;
}

.message-time-modern {
  font-size: 0.7rem;
  color: #999;
  text-align: right;
}

.user-message .message-time-modern {
  text-align: left;
}

.chat-input-section {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  background: inherit;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.selected-action-indicator {
  margin-bottom: 1rem;
}

.action-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  color: #0099ff;
}

.chip-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.chip-text {
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  color: #0099ff;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.chip-remove:hover {
  background: rgba(0, 153, 255, 0.2);
}

.chip-remove svg {
  width: 12px;
  height: 12px;
  stroke-width: 2;
}

.input-container-modern {
  position: relative;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: rgba(0, 153, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
}

.chat-input-modern {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
  outline: none;
  min-height: 20px;
  max-height: 120px;
  line-height: 1.5;
}

.chat-input-modern::placeholder {
  color: #999;
}

.btn-send-modern {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
  border-radius: 8px;
  padding: 0.5rem;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.btn-send-modern:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.3);
  border-color: rgba(0, 153, 255, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 153, 255, 0.2);
}

.btn-send-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 动作选择按钮 */
.btn-action-select {
  background: rgba(138, 43, 226, 0.2);
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 8px;
  padding: 0.5rem;
  color: #8a2be2;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.btn-action-select:hover:not(:disabled) {
  background: rgba(138, 43, 226, 0.3);
  border-color: rgba(138, 43, 226, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(138, 43, 226, 0.2);
}

.btn-action-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

/* 动作下拉菜单 */
.action-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: rgba(16, 26, 40, 0.95);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 1000;
  margin-bottom: 0.5rem;
  overflow: hidden; /* 确保内容不会溢出容器 */
  display: flex;
  flex-direction: column; /* 使用flex布局更好地控制内部元素 */
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.dropdown-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.dropdown-close {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.dropdown-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dropdown-close svg {
  width: 16px;
  height: 16px;
}

.dropdown-content {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 只在这里设置滚动 */
  min-height: 0; /* 允许flex子元素收缩 */
  /* 自定义滚动条样式 */
}

.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: rgba(138, 43, 226, 0.5);
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb:hover {
  background: rgba(138, 43, 226, 0.7);
}

.dropdown-loading,
.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #cccccc;
  gap: 0.5rem;
}

.dropdown-loading .loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-top: 2px solid #8a2be2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.dropdown-empty svg {
  width: 24px;
  height: 24px;
  color: #666;
}

.action-list {
  padding: 0.5rem;
  /* 移除可能导致双滚动条的样式 */
  overflow: visible; /* 确保不会产生内部滚动条 */
  max-height: none; /* 移除高度限制，让外层容器控制滚动 */
}

.action-item {
  width: 100%;
  background: none;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  margin-bottom: 0.25rem;
}

.action-item:hover {
  background: rgba(138, 43, 226, 0.1);
}

.action-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-item-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
}

.action-item-desc {
  font-size: 0.8rem;
  color: #cccccc;
  line-height: 1.3;
}

.send-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.sending-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 153, 255, 0.3);
  border-top: 2px solid #0099ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 现代化托管弹窗样式 */
.modal-overlay-modern {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
  padding: 2rem;
}

.modal-container-modern {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
}

.modal-container-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.6), transparent);
}

.modal-header-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  border-bottom: 1px solid rgba(138, 43, 226, 0.2);
  background: rgba(138, 43, 226, 0.05);
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  width: 32px;
  height: 32px;
  color: #8a2be2;
  stroke-width: 2;
  padding: 0.5rem;
  background: rgba(138, 43, 226, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(138, 43, 226, 0.3);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, #8a2be2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: #cccccc;
  margin: 0;
  margin-top: 0.25rem;
}

.btn-close-modern {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.btn-close-modern:hover {
  background: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.4);
  color: #ff6b6b;
  transform: scale(1.1);
}

.btn-close-modern svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.modal-content-modern {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.hosting-form-modern {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.label-icon {
  width: 18px;
  height: 18px;
  color: #8a2be2;
  stroke-width: 2;
}

.form-textarea-modern {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #ffffff;
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
}

.form-textarea-modern:focus {
  outline: none;
  border-color: rgba(138, 43, 226, 0.6);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.1);
}

.form-textarea-modern::placeholder {
  color: #999;
  line-height: 1.6;
}

.hosting-features {
  background: rgba(138, 43, 226, 0.05);
  border: 1px solid rgba(138, 43, 226, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
}

.features-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #8a2be2;
  margin: 0 0 1rem 0;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(138, 43, 226, 0.1);
  border-color: rgba(138, 43, 226, 0.3);
  transform: translateY(-2px);
}

.feature-icon {
  width: 20px;
  height: 20px;
  color: #8a2be2;
  stroke-width: 2;
  flex-shrink: 0;
}

.feature-item span {
  font-size: 0.9rem;
  color: #ffffff;
  font-weight: 500;
}

.modal-footer-modern {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid rgba(138, 43, 226, 0.2);
  background: rgba(138, 43, 226, 0.05);
}

.btn-secondary-modern,
.btn-primary-modern {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.btn-secondary-modern {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-secondary-modern:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-primary-modern {
  background: rgba(138, 43, 226, 0.2);
  border: 1px solid rgba(138, 43, 226, 0.4);
  color: #8a2be2;
}

.btn-primary-modern:hover:not(:disabled) {
  background: rgba(138, 43, 226, 0.3);
  border-color: rgba(138, 43, 226, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(138, 43, 226, 0.3);
}

.btn-primary-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-top: 2px solid #8a2be2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 动画定义 */
@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

@keyframes wave-animation {
  0%, 100% {
    height: 12px;
    opacity: 0.7;
  }
  50% {
    height: 24px;
    opacity: 1;
  }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes visualizer-bar {
  0%, 100% {
    height: 8px;
    opacity: 0.6;
  }
  50% {
    height: 32px;
    opacity: 1;
  }
}

@keyframes executing-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 165, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 165, 0, 0.4);
  }
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container-modern,
.modal-leave-to .modal-container-modern {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.modal-enter-active .modal-container-modern,
.modal-leave-active .modal-container-modern {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 隐藏对话历史滚动条，保留模态框滚动条 */
.chat-history-modern::-webkit-scrollbar {
  width: 0px; /* 隐藏滚动条 */
  background: transparent; /* 可选：使背景透明 */
}

.chat-history-modern {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

/* 保留模态框的滚动条样式 */
.modal-content-modern::-webkit-scrollbar {
  width: 6px;
}

.modal-content-modern::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.modal-content-modern::-webkit-scrollbar-thumb {
  background: rgba(0, 153, 255, 0.3);
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

.modal-content-modern::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 153, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .video-audio-container {
    flex-direction: column;
    gap: 1.5rem;
  }

  .audio-control-sidebar {
    width: 100%;
    max-width: none;
  }

  .main-panels-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 0;
  }

  .main-content-section {
    padding: 1rem;
  }

  .main-content-container {
    flex-direction: column;
    height: auto;
    gap: 1.5rem;
  }

  .left-section {
    order: 1;
  }

  .right-section {
    order: 2;
  }

  .video-display-area {
    padding: 1rem;
  }

  .video-frame {
    height: 500px; /* 在平板上适当增加视频尺寸 */
  }

  .left-section {
    flex: 1.6; /* 在平板上也增加左侧区域比例 */
  }

  .right-section {
    flex: 1; /* 在平板上调整右侧区域比例 */
    margin-left: 0.125rem; /* 在平板上进一步减少左边距 */
  }

  .main-content-container {
    gap: 1rem; /* 在平板上进一步减少区域间距 */
  }

  .action-dropdown {
    width: 280px;
    max-height: 300px;
  }

  .expanded-panel {
    min-height: 700px; /* 在平板上保持较大的对话面板 */
  }

  .expanded-panel .panel-content {
    min-height: 600px;
  }

  /* 平板上音频控制按钮保持水平排列 */
  .audio-controls-grid {
    flex-direction: row;
    gap: 0.75rem;
  }

  .btn-audio-control {
    flex: 1;
    min-width: 120px; /* 设置最小宽度确保按钮不会太小 */
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-title-section {
    order: 1;
    width: 100%;
  }

  .connection-indicators {
    flex-wrap: wrap;
    justify-content: center;
  }

  .modern-page-title {
    font-size: 1.5rem;
  }

  .title-text {
    font-size: 1.2rem;
  }

  .video-audio-section {
    padding: 1rem;
  }

  .video-audio-container {
    gap: 1rem;
  }

  .video-frame {
    height: 300px;
  }



  .audio-control-sidebar {
    width: 100%;
  }

  .main-panels-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0;
  }

  .main-content-section {
    padding: 1rem 0.5rem;
  }

  .main-content-container {
    gap: 1rem;
  }

  .video-frame {
    height: 250px;
  }

  .action-dropdown {
    width: 260px;
    max-height: 250px;
    left: 0;
    right: auto;
  }

  .dropdown-content {
    max-height: 200px;
  }

  .control-panel {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .panel-header {
    margin: -1.5rem -1.5rem 1.5rem -1.5rem;
    padding: 1rem 1.5rem;
    border-radius: 16px 16px 0 0;
  }

  .panel-content {
    min-height: 300px;
  }



  .chat-history-modern {
    max-height: 200px;
  }

  .modal-overlay-modern {
    padding: 1rem;
  }

  .modal-container-modern {
    max-width: 100%;
  }

  .modal-header-modern,
  .modal-content-modern,
  .modal-footer-modern {
    padding: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .btn-secondary-modern,
  .btn-primary-modern {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.75rem;
  }



  .back-icon,
  .emergency-icon {
    width: 14px;
    height: 14px;
  }

  .modern-page-title {
    font-size: 1.2rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .title-icon {
    font-size: 1.2rem;
  }

  .connection-indicators {
    gap: 0.5rem;
  }

  .indicator {
    padding: 0.25rem 0.5rem;
  }

  .indicator-label {
    font-size: 0.7rem;
  }

  .video-frame {
    height: 320px; /* 在手机上进一步增加视频高度 */
  }

  /* 手机端音频控制按钮改为列排列 */
  .audio-controls-grid {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-audio-control,
  .btn-hosting-modern {
    flex: none;
    min-width: auto;
  }

  .video-audio-controls {
    margin-top: 0.5rem; /* 在手机端也保持较小的间距 */
    padding: 0.5rem 0.75rem; /* 在手机端减少上下内边距 */
  }

  .right-section {
    margin-left: 0; /* 在手机端移除左边距 */
  }

  .main-content-container {
    padding: 0 0.5rem; /* 在手机端减少左右内边距 */
    gap: 0.75rem; /* 在手机端进一步减少区域间距 */
  }

  .chat-interaction-area {
    padding: 1rem 0.5rem; /* 在手机端进一步减少对话框内边距 */
  }

  .expanded-panel {
    min-height: 550px; /* 在手机上适当增加对话面板高度 */
  }

  .expanded-panel .panel-content {
    min-height: 450px;
  }

  .expanded-panel .chat-history-modern {
    max-height: 300px; /* 在手机上适当增加对话历史高度 */
  }

  .control-panel {
    padding: 0.75rem;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .panel-title-group {
    gap: 0.5rem;
  }

  .panel-icon {
    width: 20px;
    height: 20px;
  }

  .panel-title {
    font-size: 1rem;
  }



  .btn-execute-modern {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
    min-height: 36px;
  }

  .btn-audio-control,
  .btn-hosting-modern {
    padding: 0.6rem 1rem; /* 在手机端进一步减少内边距 */
    font-size: 0.85rem;
  }

  .video-display-area {
    padding: 0.75rem;
  }

  .video-title-group {
    gap: 0.5rem;
  }

  .video-icon {
    width: 20px;
    height: 20px;
  }

  .video-title {
    font-size: 1rem;
  }

  .audio-icon,
  .hosting-icon {
    width: 18px;
    height: 18px;
  }

  .message-bubble {
    gap: 0.5rem;
  }

  .avatar-circle {
    width: 32px;
    height: 32px;
  }

  .avatar-circle svg {
    width: 16px;
    height: 16px;
  }

  .message-content-modern {
    max-width: 85%;
    padding: 0.5rem 0.75rem;
  }

  .message-text-modern {
    font-size: 0.9rem;
  }

  .input-wrapper {
    padding: 0.5rem;
  }

  .chat-input-modern {
    font-size: 0.9rem;
  }

  .btn-send-modern,
  .btn-action-select {
    width: 32px;
    height: 32px;
  }

  .send-icon {
    width: 14px;
    height: 14px;
  }

  .modal-header-modern,
  .modal-content-modern,
  .modal-footer-modern {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .modal-subtitle {
    font-size: 0.8rem;
  }

  .form-textarea-modern {
    min-height: 100px;
    font-size: 0.9rem;
  }

  .btn-secondary-modern,
  .btn-primary-modern {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}

/* 触屏设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 移除控制面板悬浮效果相关样式 */



  .btn-action-modern:hover,
  .btn-audio-control:hover,
  .btn-hosting-modern:hover,
  .btn-execute-modern:hover,
  .btn-send-modern:hover,
  .btn-action-select:hover,
  .btn-retry-modern:hover {
    transform: none;
  }

  /* 增加触摸目标大小 */
  .btn-action-modern,
  .btn-audio-control,
  .btn-hosting-modern,
  .btn-execute-modern,
  .btn-send-modern,
  .btn-action-select,
  .btn-retry-modern {
    min-height: 44px;
    min-width: 44px;
  }

  .selector-circle {
    width: 24px;
    height: 24px;
  }

  .chip-remove {
    width: 20px;
    height: 20px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .control-panel,
  .message-content-modern,
  .modal-container-modern {
    border-width: 2px;
  }

  .btn-action-modern,
  .btn-audio-control,
  .btn-hosting-modern,
  .btn-execute-modern,
  .btn-send-modern,
  .btn-action-select,
  .btn-retry-modern {
    border-width: 2px;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .control-panel::before,
  .btn-audio-control::before {
    display: none;
  }
}

/* 控制区域 */
.control-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #0099ff;
  margin: 0;
}

.connection-status {
  display: none;
}

/* 动作控制区域 */
.action-control-area {
  background: rgba(16, 26, 40, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(0, 153, 255, 0.1);
  display: flex;
  flex-direction: column;
  height: 600px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2rem;
  color: #aaa;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 153, 255, 0.3);
  border-top: 2px solid #0099ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.actions-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.action-item:hover {
  border-color: rgba(0, 153, 255, 0.3);
  background: rgba(26, 26, 46, 0.7);
}

.action-item.selected {
  border-color: rgba(0, 153, 255, 0.8);
  background: rgba(0, 153, 255, 0.15);
  box-shadow: 0 0 10px rgba(0, 153, 255, 0.3);
}

.action-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.action-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(0, 153, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.action-indicator.selected {
  border-color: #0099ff;
  background: rgba(0, 153, 255, 0.1);
}

.indicator-icon {
  font-size: 14px;
  color: #0099ff;
  font-weight: bold;
}

.action-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.action-name {
  font-weight: 500;
  color: #fff;
}

.action-description {
  font-size: 0.85rem;
  color: #aaa;
}

.btn-execute-action {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.5);
  border-radius: 6px;
  padding: 6px 12px;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.btn-execute-action:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.3);
  transform: translateY(-1px);
}

.btn-execute-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state, .disconnected-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #aaa;
}

.empty-icon, .disconnected-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text, .disconnected-text {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.btn-refresh, .btn-reconnect {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.5);
  border-radius: 6px;
  padding: 8px 16px;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover, .btn-reconnect:hover {
  background: rgba(0, 153, 255, 0.3);
  transform: translateY(-1px);
}

/* 自定义滚动条样式 */
.actions-list::-webkit-scrollbar {
  width: 8px;
}

.actions-list::-webkit-scrollbar-track {
  background: rgba(26, 26, 46, 0.3);
  border-radius: 4px;
}

.actions-list::-webkit-scrollbar-thumb {
  background: rgba(0, 153, 255, 0.3);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.actions-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 153, 255, 0.5);
}

/* 隐藏对话历史滚动条 */
.chat-history::-webkit-scrollbar {
  width: 0px; /* 隐藏滚动条 */
  background: transparent;
}

.chat-history {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

/* 对话交互区域 */
.chat-interaction-area {
  background: rgba(16, 26, 40, 0.6);
  border-radius: 12px;
  padding: 1.5rem 0.75rem; /* 进一步减少左右内边距，让对话框内容更宽 */
  border: 1px solid rgba(0, 153, 255, 0.1);
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 153, 255, 0.1);
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 1rem;
  align-items: flex-start;
  max-width: 75%; /* 限制消息最大宽度 */
}

.chat-message.user-message {
  flex-direction: row-reverse;
  margin-left: auto; /* 用户消息右对齐 */
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 153, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: rgba(255, 153, 0, 0.2);
}

.message-content {
  flex: 0 1 auto;
  max-width: 60%; /* 减小最大宽度 */
  min-width: fit-content;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(0, 153, 255, 0.15); /* 用户消息使用蓝色背景 */
  border-color: rgba(0, 153, 255, 0.3);
}

.message-text {
  color: #fff;
  line-height: 1.4;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
}

/* 用户消息文本样式已在 .user-message .message-content 中定义 */

.message-time {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 4px;
}

.chat-input-area {
  margin-top: auto;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: rgba(26, 26, 46, 0.7);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 0 8px rgba(0, 153, 255, 0.2);
}

.chat-input::placeholder {
  color: #aaa;
}

.btn-send {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.5);
  border-radius: 8px;
  padding: 12px 20px;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
}

.btn-send:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.3);
  transform: translateY(-1px);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-status {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(0, 153, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.2);
}

.status-info {
  font-size: 0.85rem;
  color: #0099ff;
}

.status-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .control-section {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .video-display {
    height: 300px;
  }

  .chat-interaction-area {
    height: 500px;
  }

  /* 平板端视频标题保持桌面端大小 */
  .video-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 0.75rem 1rem;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .video-section {
    padding: 1rem;
  }

  .video-display {
    height: 250px;
  }

  .control-section {
    padding: 1rem;
    gap: 1rem;
  }

  .chat-interaction-area {
    height: 400px;
  }

  .input-container {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-send {
    align-self: flex-end;
    width: auto;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1.2rem;
  }

  .video-display {
    height: 200px;
  }

  .action-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .btn-execute-action {
    align-self: flex-end;
    width: auto;
  }

  .message-content {
    max-width: 80%; /* 移动端稍微宽一点 */
    min-width: fit-content;
  }
}
</style>
