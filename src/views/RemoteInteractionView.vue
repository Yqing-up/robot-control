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

        <!-- 右侧音频流控制按钮 -->
        <div class="audio-control-right" v-if="audioStreamEnabled">
          <button
            class="btn-audio-stream start"
            :class="{ 'active': audioStreamActive, 'loading': audioStreamLoading }"
            @click="startAudioStream"
            :disabled="audioStreamLoading"
          >
            <span class="btn-text">{{ audioStreamLoading ? '连接中...' : '连接音频' }}</span>
          </button>

          <button
            class="btn-audio-stream stop"
            :class="{ 'active': audioStreamActive, 'loading': audioStreamLoading }"
            @click="stopAudioStream"
            :disabled="!audioStreamActive || audioStreamLoading"
          >
            <span class="btn-text">{{ audioStreamLoading ? '关闭中...' : '关闭音频' }}</span>
          </button>

          <!-- 托管按钮 -->
          <button
            class="btn-hosting"
            @click="openHostingDialog"
          >
            托管
          </button>
        </div>

        <div class="video-status">
          <!-- 音频流状态指示器 -->
          <div class="audio-stream-status" v-if="audioStreamActive">
            <span class="audio-status-indicator active"></span>
            <span class="audio-status-text">音频流活跃</span>
          </div>
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
            :class="{ 'user-message': message.type === 'human', 'robot-message': message.type === 'robot' }"
          >
            <div class="message-avatar">
              <span v-if="message.type === 'human'">👤</span>
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

    <!-- 托管弹窗 -->
    <div v-if="showHostingDialog" class="hosting-dialog-overlay" @click="closeHostingDialog">
      <div class="hosting-dialog" @click.stop>
        <div class="hosting-dialog-header">
          <h3>机器人托管</h3>
          <button class="close-btn" @click="closeHostingDialog">×</button>
        </div>

        <div class="hosting-dialog-content">
          <div class="hosting-form">
            <label for="hosting-requirements">请输入托管需求：</label>
            <textarea
              id="hosting-requirements"
              v-model="hostingRequirements"
              placeholder="请详细描述您希望机器人执行的任务..."
              rows="6"
              class="hosting-textarea"
            ></textarea>
          </div>
        </div>

        <div class="hosting-dialog-footer">
          <button class="btn-cancel" @click="closeHostingDialog">取消</button>
          <button
            class="btn-confirm"
            @click="confirmHosting"
            :disabled="!hostingRequirements.trim() || hostingSubmitting"
          >
            {{ hostingSubmitting ? '提交中...' : '确定托管' }}
          </button>
        </div>
      </div>
    </div>
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
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.video-display {
  position: relative;
  flex: 1;
  height: 400px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0, 153, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 153, 255, 0.1);
}

/* 音频流控制按钮 */
.audio-control-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 120px;
}

.btn-audio-stream {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 153, 255, 0.1);
  border: 2px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  color: #0099ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  font-weight: 500;
  width: 100%;
  min-height: 45px;
}

.btn-audio-stream:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.2);
  border-color: rgba(0, 153, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 153, 255, 0.2);
}

.btn-audio-stream:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-audio-stream.active {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
  color: #00ff00;
}

.btn-audio-stream.loading {
  background: rgba(255, 165, 0, 0.1);
  border-color: rgba(255, 165, 0, 0.3);
  color: #ffa500;
}

.btn-audio-stream .btn-text {
  font-size: 0.9rem;
  text-align: center;
  line-height: 1.2;
}

/* 托管按钮样式 */
.btn-hosting {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: rgba(138, 43, 226, 0.1);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 8px;
  color: #8a2be2;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
  min-height: 45px;
  margin-top: 0.5rem;
}

.btn-hosting:hover {
  background: rgba(138, 43, 226, 0.2);
  border-color: rgba(138, 43, 226, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(138, 43, 226, 0.2);
}

/* 托管弹窗样式 */
.hosting-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.hosting-dialog {
  background: #1a1a2e;
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.hosting-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(138, 43, 226, 0.2);
  background: rgba(138, 43, 226, 0.1);
}

.hosting-dialog-header h3 {
  margin: 0;
  color: #8a2be2;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #8a2be2;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(138, 43, 226, 0.2);
}

.hosting-dialog-content {
  padding: 1.5rem;
}

.hosting-form label {
  display: block;
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.hosting-textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
}

.hosting-textarea:focus {
  outline: none;
  border-color: rgba(138, 43, 226, 0.6);
  background: rgba(255, 255, 255, 0.08);
}

.hosting-textarea::placeholder {
  color: rgba(224, 224, 224, 0.5);
}

.hosting-dialog-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(138, 43, 226, 0.2);
  background: rgba(138, 43, 226, 0.05);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 2px solid;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: transparent;
  border-color: rgba(224, 224, 224, 0.3);
  color: #e0e0e0;
}

.btn-cancel:hover {
  background: rgba(224, 224, 224, 0.1);
  border-color: rgba(224, 224, 224, 0.5);
}

.btn-confirm {
  background: rgba(138, 43, 226, 0.2);
  border-color: rgba(138, 43, 226, 0.5);
  color: #8a2be2;
}

.btn-confirm:hover:not(:disabled) {
  background: rgba(138, 43, 226, 0.3);
  border-color: rgba(138, 43, 226, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(138, 43, 226, 0.2);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
}

.audio-stream-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 26, 40, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.1);
}

.audio-status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ff00;
}

.audio-status-indicator.active {
  animation: pulse-green 1.5s infinite;
}

.audio-status-text {
  font-size: 0.8rem;
  color: #00ff00;
}

@keyframes pulse-green {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
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
