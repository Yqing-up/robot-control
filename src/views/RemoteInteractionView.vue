<template>
  <div class="remote-interaction-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">远程交互</h1>
    </div>

    <!-- 第一层：视频画面区域 -->
    <section class="video-section">
      <div class="video-container">
        <div class="video-display">
          <img
            v-if="!videoError"
            :src="videoFeedUrl"
            class="video-stream"
            @error="handleVideoError"
            @load="handleVideoLoad"
            alt="机器人视频流"
          />
          <div v-else class="video-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">📹</div>
              <div class="placeholder-text">视频连接失败</div>
              <button class="btn-retry" @click="retryVideoConnection">重新连接</button>
            </div>
          </div>
        </div>
        <div class="video-status">
          <span class="status-indicator" :class="{ 'connected': !videoError, 'disconnected': videoError }"></span>
          <span class="status-text">{{ videoError ? '视频连接失败' : '视频连接正常' }}</span>
        </div>
      </div>
    </section>

    <!-- 第二层：左右两个区域 -->
    <section class="control-section">
      <!-- 左侧：动作控制区域 -->
      <div class="action-control-area">
        <div class="section-header">
          <h2 class="section-title">动作控制</h2>
          <div class="connection-status" :class="{ 'connected': actionConnected, 'disconnected': !actionConnected }">
            <span class="status-dot"></span>
            <span>{{ actionConnected ? '已连接' : '未连接' }}</span>
          </div>
        </div>

        <div class="actions-list" v-if="actionConnected">
          <div class="loading-state" v-if="actionsLoading">
            <div class="loading-spinner"></div>
            <span>加载动作列表...</span>
          </div>

          <div v-else-if="availableActions.length > 0" class="actions-grid">
            <div
              v-for="action in availableActions"
              :key="action.name"
              class="action-item"
              :class="{ 'selected': selectedAction === action.name }"
              @click="toggleActionSelection(action.name)"
            >
              <div class="action-checkbox">
                <div class="action-indicator" :class="{ 'selected': selectedAction === action.name }">
                  <span class="indicator-icon">{{ selectedAction === action.name ? '✓' : '○' }}</span>
                </div>
                <div class="action-label">
                  <span class="action-name">{{ action.display_name || action.name }}</span>
                  <span class="action-description" v-if="action.description">{{ action.description }}</span>
                </div>
              </div>
              <button
                class="btn-execute-action"
                @click.stop="executeAction(action.name)"
                :disabled="actionExecuting"
              >
                {{ actionExecuting ? '执行中...' : '执行动作' }}
              </button>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">🤖</div>
            <div class="empty-text">暂无可用动作</div>
            <button class="btn-refresh" @click="fetchActions">刷新列表</button>
          </div>
        </div>

        <div v-else class="disconnected-state">
          <div class="disconnected-icon">⚠️</div>
          <div class="disconnected-text">动作控制服务未连接</div>
          <button class="btn-reconnect" @click="connectActionService">重新连接</button>
        </div>
      </div>

      <!-- 右侧：对话交互区域 -->
      <div class="chat-interaction-area">
        <div class="section-header">
          <h2 class="section-title">对话交互</h2>
          <div class="connection-status" :class="{ 'connected': chatConnected, 'disconnected': !chatConnected }">
            <span class="status-dot"></span>
            <span>{{ chatConnected ? '已连接' : '未连接' }}</span>
          </div>
        </div>

        <!-- 对话历史 -->
        <div class="chat-history" ref="chatHistoryRef">
          <div
            v-for="(message, index) in chatHistory"
            :key="index"
            class="chat-message"
            :class="{ 'user-message': message.type === 'user', 'robot-message': message.type === 'robot' }"
          >
            <div class="message-avatar">
              <span v-if="message.type === 'user'">👤</span>
              <span v-else>🤖</span>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="input-container">
            <textarea
              v-model="userInput"
              class="chat-input"
              placeholder="输入要对机器人说的话..."
              rows="2"
              @keydown.enter.prevent="sendMessage"
              :disabled="!chatConnected || messageSending"
            ></textarea>
            <button
              class="btn-send"
              @click="sendMessage"
              :disabled="!chatConnected || !userInput.trim() || messageSending"
            >
              {{ messageSending ? '发送中...' : '发送' }}
            </button>
          </div>

          <div class="input-status" v-if="selectedAction">
            <span class="status-info">
              ✓ 已选择动作: {{ getActionDisplayName(selectedAction) }}
            </span>
            <span class="status-hint">
              (再次点击可取消选择)
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { robotApi, setRobotMode } from '../api/robotApi'
import { voiceApi } from '../api/voiceApi'
import { recordingApi } from '../api/recordingApi'
import { cameraApi } from '../api/cameraApi'

const router = useRouter()

// 页面导航
const goBack = () => {
  router.back()
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

// ASR相关
const isRecordingActive = ref(false)

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

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || messageSending.value) return

  try {
    messageSending.value = true
    const message = userInput.value.trim()

    // 添加用户消息到历史
    addChatMessage('user', message)

    // 清空输入框
    userInput.value = ''

    // 同时执行TTS和动作（如果选中了动作）
    const promises = []

    // 1. TTS语音合成
    promises.push(synthesizeText(message))

    // 2. 执行选中的动作（如果有）
    if (selectedAction.value) {
      promises.push(executeSelectedAction())
    }

    await Promise.all(promises)

  } catch (error) {
    console.error('❌ 发送消息失败:', error)
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
const addChatMessage = (type, text) => {
  chatHistory.value.push({
    type,
    text,
    timestamp: Date.now()
  })

  // 滚动到底部
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 检查ASR录音状态（只在页面加载时调用一次）
const checkAsrStatus = async () => {
  try {
    console.log('🎤 检查ASR录音状态...')
    const statusResponse = await recordingApi.getStatus()
    console.log('🎤 ASR状态检查:', statusResponse)

    // 检查录音是否正在进行
    let isRecording = false
    if (statusResponse && statusResponse.data) {
      // 处理不同的状态响应格式
      isRecording = statusResponse.data.is_recording ||
                   statusResponse.data.recording ||
                   statusResponse.data.status === 'recording' ||
                   statusResponse.data.status === 'active'
    } else if (statusResponse && statusResponse.success) {
      isRecording = statusResponse.is_recording ||
                   statusResponse.recording ||
                   statusResponse.status === 'recording' ||
                   statusResponse.status === 'active'
    }

    isRecordingActive.value = isRecording
    console.log(`🎤 录音状态: ${isRecording ? '进行中' : '未开始'}`)

    return isRecording
  } catch (error) {
    console.error('❌ 检查ASR状态失败:', error)
    isRecordingActive.value = false
    return false
  }
}

// ASR语音识别轮询（简化版，只获取语音转文本）
const startAsrPolling = () => {
  asrPollingTimer = setInterval(async () => {
    try {
      // 只有在录音激活时才获取语音转文本
      if (isRecordingActive.value) {
        console.log('🎤 录音进行中，获取语音转文本...')
        const response = await recordingApi.getRecentRecords(1) // 获取最近1分钟的记录

        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // 获取最新的语音识别结果
          const latestRecord = response.data[response.data.length - 1]
          if (latestRecord && latestRecord.text && latestRecord.text.trim()) {
            // 检查是否是新的语音记录（避免重复）
            const lastRobotMessage = chatHistory.value.filter(m => m.type === 'robot').pop()
            if (!lastRobotMessage || lastRobotMessage.text !== latestRecord.text.trim()) {
              addChatMessage('robot', latestRecord.text.trim())
            }
          }
        }
      } else {
        // 录音未激活时，偶尔检查一次状态（每10秒检查一次）
        if (Date.now() % 10000 < 1000) {
          console.log('🎤 定期检查录音状态...')
          await checkAsrStatus()
        }
      }
    } catch (error) {
      console.warn('⚠️ ASR轮询失败:', error.message)
    }
  }, 1000) // 每秒检查一次
}

const stopAsrPolling = () => {
  if (asrPollingTimer) {
    clearInterval(asrPollingTimer)
    asrPollingTimer = null
  }
}

// 初始化聊天服务
const initializeChatService = async () => {
  chatConnected.value = true

  // 页面加载时检查一次ASR状态
  await checkAsrStatus()

  // 启动ASR轮询
  startAsrPolling()

  addChatMessage('robot', '远程交互系统已启动，可以开始对话了！')
}

// 生命周期
onMounted(async () => {
  console.log('🚀 远程交互页面已挂载')

  // 确保使用真实机器人模式
  setRobotMode('real')
  console.log('🤖 远程交互页面强制使用真实机器人模式')

  // 初始化各个服务
  initializeVideo()
  await connectActionService()
  await initializeChatService()
})

onBeforeUnmount(() => {
  console.log('🔄 远程交互页面即将卸载')
  stopAsrPolling()
})
</script>

<style scoped>
.remote-interaction-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
  padding: 0;
  margin: 0;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 2px solid rgba(0, 153, 255, 0.2);
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.btn-back {
  background: rgba(108, 117, 125, 0.3);
  border: 1px solid rgba(108, 117, 125, 0.5);
  border-radius: 6px;
  padding: 8px 16px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-back:hover {
  background: rgba(108, 117, 125, 0.5);
  border-color: rgba(108, 117, 125, 0.7);
  transform: translateY(-1px);
}

.page-title {
  color: #0099ff;
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ccff, #0099ff, #ffffff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.4);
  margin: 0;
}

/* 视频区域 */
.video-section {
  padding: 2rem;
  background: rgba(16, 26, 40, 0.8);
  border-bottom: 1px solid rgba(0, 153, 255, 0.1);
}

.video-container {
  max-width: 1200px;
  margin: 0 auto;
}

.video-display {
  position: relative;
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0, 153, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 153, 255, 0.1);
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #1a1a2e, #16213e);
}

.placeholder-content {
  text-align: center;
  color: #aaa;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.btn-retry {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.5);
  border-radius: 6px;
  padding: 8px 16px;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: rgba(0, 153, 255, 0.3);
  transform: translateY(-1px);
}

.video-status {
  display: none;
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
.actions-list::-webkit-scrollbar,
.chat-history::-webkit-scrollbar {
  width: 8px;
}

.actions-list::-webkit-scrollbar-track,
.chat-history::-webkit-scrollbar-track {
  background: rgba(26, 26, 46, 0.3);
  border-radius: 4px;
}

.actions-list::-webkit-scrollbar-thumb,
.chat-history::-webkit-scrollbar-thumb {
  background: rgba(0, 153, 255, 0.3);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.actions-list::-webkit-scrollbar-thumb:hover,
.chat-history::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 153, 255, 0.5);
}

/* 对话交互区域 */
.chat-interaction-area {
  background: rgba(16, 26, 40, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
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
}

.chat-message.user-message {
  flex-direction: row-reverse;
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
  max-width: 70%;
  min-width: fit-content;
}

.user-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  background: rgba(26, 26, 46, 0.7);
  padding: 12px 16px;
  border-radius: 12px;
  color: #fff;
  line-height: 1.4;
  word-wrap: break-word;
  display: inline-block;
  max-width: 100%;
  width: fit-content;
}

.user-message .message-text {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.3);
}

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
    max-width: 85%;
    min-width: fit-content;
  }
}
</style>
