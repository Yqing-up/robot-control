<template>
  <div class="chat-interaction-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回管理页面</button>
        <h1 class="title">机器人聊天交互</h1>
        <button
          class="btn btn-mode-switch"
          @click="toggleChatMode"
          :class="{ 'active': isHumanRobotMode }"
        >
          {{ currentModeDisplayName }}
        </button>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="chat-main">
      <div class="chat-container">
        <!-- 聊天消息区域 -->
        <div class="chat-messages" ref="chatMessagesContainer">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="chat-message"
            :class="{ 'user-message': message.type === 'human', 'robot-message': message.type === 'robot' }"
          >
            <div class="message-avatar">
              <svg v-if="message.type === 'human'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                <path d="M12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" stroke-width="1"/>
                <circle cx="12" cy="12" r="6" stroke-width="0.5"/>
                <circle cx="12" cy="12" r="3" stroke-width="0.5"/>
                <path d="M12 3v2m0 14v2m9-9h-2m-14 0h2"/>
                <path d="M18.36 5.64l-1.41 1.41m-9.9 9.9l-1.41 1.41m12.72 0l-1.41-1.41m-9.9-9.9l-1.41-1.41"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
                <circle cx="15" cy="15" r="1" fill="currentColor"/>
                <path d="M12 8v8m-4-4h8"/>
                <polygon points="12,6 14,8 12,10 10,8" fill="currentColor"/>
                <polygon points="12,14 14,16 12,18 10,16" fill="currentColor"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>
          <div v-if="chatLoading" class="chat-message robot-message">
            <div class="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" stroke-width="1"/>
                <circle cx="12" cy="12" r="6" stroke-width="0.5"/>
                <circle cx="12" cy="12" r="3" stroke-width="0.5"/>
                <path d="M12 3v2m0 14v2m9-9h-2m-14 0h2"/>
                <path d="M18.36 5.64l-1.41 1.41m-9.9 9.9l-1.41 1.41m12.72 0l-1.41-1.41m-9.9-9.9l-1.41-1.41"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
                <circle cx="15" cy="15" r="1" fill="currentColor"/>
                <path d="M12 8v8m-4-4h8"/>
                <polygon points="12,6 14,8 12,10 10,8" fill="currentColor"/>
                <polygon points="12,14 14,16 12,18 10,16" fill="currentColor"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="chat-input-container">
            <input
              type="text"
              v-model="chatInputText"
              placeholder="输入消息与机器人聊天..."
              class="chat-input"
              @keyup.enter="handleSendMessage"
              :disabled="chatLoading"
            >
            <button
              class="btn btn-primary chat-send-btn"
              @click="handleSendMessage"
              :disabled="chatLoading || !chatInputText.trim()"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="chat-status">
        <div class="status-item">
          <span class="status-label">连接状态:</span>
          <span class="status-value" :class="{ 'online': chatConnected, 'offline': !chatConnected }">
            {{ chatConnected ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">消息数量:</span>
          <span class="status-value">{{ chatMessages.length }} 条</span>
        </div>
        <div class="status-item">
          <span class="status-label">轮询状态:</span>
          <span class="status-value" :class="{ 'active': chatPollingTimer, 'inactive': !chatPollingTimer }">
            {{ chatPollingTimer ? '运行中' : '已停止' }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { chatApi } from '../api/chatApi.js'
// 移除跨页面同步导入

const router = useRouter()
const route = useRoute()

// 聊天相关数据
const chatMessages = ref([])
const chatInputText = ref('')
const chatLoading = ref(false)
const chatMessagesContainer = ref(null)
const chatPollingTimer = ref(null)

// 移除模式变化监听器

// 聊天模式状态（本地独立状态）
const isHumanRobotMode = ref(false) // false: 人机交互模式, true: 机器人管理模式
const currentModeDisplayName = computed(() => {
  // 显示当前模式的名称
  return isHumanRobotMode.value ? '机器人管理模式' : '人机交互模式'
})
const lastMessageId = ref(null)
const chatConnected = ref(false)

// 基础方法
const goBack = () => {
  router.push('/management')
}

// 切换聊天模式
const toggleChatMode = async () => {
  console.log('🔄 切换聊天模式，当前模式:', currentModeDisplayName.value)

  // 停止当前轮询
  stopChatPolling()

  // 切换模式（本地状态）
  isHumanRobotMode.value = !isHumanRobotMode.value

  console.log('✅ 已切换到:', currentModeDisplayName.value)

  // 清空当前消息
  chatMessages.value = []
  lastMessageId.value = null

  // 重新加载聊天历史记录
  await loadChatHistory(true)

  // 重新启动轮询
  startChatPolling()
}

// 聊天相关方法
const loadChatHistory = async (isInitialLoad = true) => {
  console.log(`--- loadChatHistory called. isInitialLoad: ${isInitialLoad} ---`);
  try {
    if (isInitialLoad) {
      console.log('📚 初始加载聊天历史记录...')
    }

    // 根据当前模式调用不同的API
    const result = isHumanRobotMode.value
      ? await chatApi.getHumanRobotChatHistory()
      : await chatApi.getChatHistory()

    if (result && result.success && result.data && result.data.messages) {
      if (isInitialLoad) {
        // 初始加载：清空当前历史记录并加载所有消息
        chatMessages.value = []

        // 按时间顺序排序（最早的在前面）
        const sortedMessages = result.data.messages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        chatMessages.value = sortedMessages.map(msg => ({
          id: msg.id,
          message_id: msg.message_id,
          text: msg.text,
          type: msg.type, // 'human' 或 'robot'
          created_at: msg.created_at
        }))

        // 记录最新消息的ID
        if (sortedMessages.length > 0) {
          lastMessageId.value = Math.max(...sortedMessages.map(msg => msg.id))
          console.log('📝 记录最新消息ID:', lastMessageId.value)
        }

        console.log('✅ 聊天历史记录初始加载成功，共', chatMessages.value.length, '条消息')
      } else {
        // 轮询更新：检查消息总数变化
        const allMessages = result.data.messages
        const currentMessageCount = allMessages.length
        const currentDisplayCount = chatMessages.value.length

        console.log('🔍 轮询检查：API返回', currentMessageCount, '条消息，当前显示', currentDisplayCount, '条消息')

        if (currentMessageCount > currentDisplayCount) {
          console.log('🆕 发现新消息！需要同步', currentMessageCount - currentDisplayCount, '条消息')

          // 重新加载所有消息以确保同步
          chatMessages.value = []

          // 按时间顺序排序所有消息
          const sortedMessages = allMessages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          chatMessages.value = sortedMessages.map(msg => ({
            id: msg.id,
            message_id: msg.message_id,
            text: msg.text,
            type: msg.type,
            created_at: msg.created_at
          }))

          // 更新最新消息ID
          if (sortedMessages.length > 0) {
            lastMessageId.value = Math.max(...sortedMessages.map(msg => msg.id))
            console.log('📝 更新最新消息ID:', lastMessageId.value)
          }

          console.log('✅ 消息同步完成，当前显示', chatMessages.value.length, '条消息')
        } else {
          console.log('ℹ️ 轮询检查：没有新消息')
        }
      }

      // 滚动到底部
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } else {
      if (isInitialLoad) {
        console.log('ℹ️ 没有聊天历史记录')
        chatMessages.value = []
      }
    }
  } catch (error) {
    console.error('❌ 加载聊天历史记录失败:', error)
    if (isInitialLoad) {
      chatMessages.value = []
    }
  }
}

const handleSendMessage = async () => {
  if (!chatInputText.value.trim() || chatLoading.value) {
    return
  }

  const userMessage = chatInputText.value.trim()
  chatInputText.value = ''

  try {
    chatLoading.value = true
    console.log('💬 发送消息给机器人:', userMessage)

    // 根据当前模式调用不同的API
    const result = isHumanRobotMode.value
      ? await chatApi.sendRobotMessageToHumanRobotChat(userMessage)
      : await chatApi.sendMessage(userMessage)

    if (result && result.success) {
      console.log('✅ 消息发送成功，等待轮询显示新消息')

      // 不立即显示任何消息，让轮询机制处理
      // 这样可以确保消息的显示与后端数据保持一致
    } else {
      throw new Error(result?.message || '发送消息失败')
    }
  } catch (error) {
    console.error('❌ 发送消息失败:', error)

    // 显示错误提示
    alert(`发送消息失败：${error.message}`)
  } finally {
    chatLoading.value = false
  }
}

const scrollToBottom = () => {
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
  }
}

const formatTime = (timeString) => {
  try {
    const date = new Date(timeString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

// 开始聊天轮询
const startChatPolling = () => {
  console.log('--- startChatPolling called ---');
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
  }

  chatPollingTimer.value = setInterval(async () => {
    try {
      await loadChatHistory(false) // 增量更新
    } catch (error) {
      console.warn('⚠️ 聊天轮询失败:', error.message)
    }
  }, 2000) // 每2秒轮询一次，减少服务器负担

  console.log('🔄 聊天轮询已启动，每2秒检查新消息')
}

// 停止聊天轮询
const stopChatPolling = () => {
  console.log('--- stopChatPolling called ---');
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
    chatPollingTimer.value = null
    console.log('⏹️ 聊天轮询已停止')
  }
}

// 生命周期
onMounted(async () => {
  console.log('--- ChatInteractionView: onMounted hook triggered ---');
  try {
    console.log('Setting chatConnected to true.');
    chatConnected.value = true;

    console.log('Calling loadChatHistory...');
    await loadChatHistory(true); // 初始加载
    console.log('loadChatHistory finished.');

    console.log('Calling startChatPolling...');
    startChatPolling(); // 启动轮询
    console.log('startChatPolling finished.');
  } catch (error) {
    console.error('Error in onMounted hook:', error);
  }
  // 移除跨页面模式监听
})

onBeforeUnmount(() => {
  console.log('--- ChatInteractionView: onBeforeUnmount hook triggered ---');
  console.log('💬 聊天交互页面即将卸载')
  stopChatPolling() // 停止轮询

  // 移除模式变化监听器清理
})
</script>

<style scoped>
.chat-interaction-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0f1c 0%, #1a2332 50%, #0f1419 100%);
  color: #ffffff;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航栏 */
.header {
  background: rgba(16, 26, 40, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.3);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
  width: 100%;
}

.btn-back {
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.3);
  color: #4da6ff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-back:hover {
  background: rgba(0, 153, 255, 0.2);
  border-color: rgba(0, 153, 255, 0.5);
  transform: translateY(-1px);
}

/* 模式切换按钮 */
.btn-mode-switch {
  background: rgba(255, 165, 0, 0.1);
  color: #ffa500;
  border: 1px solid rgba(255, 165, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-mode-switch:hover {
  background: rgba(255, 165, 0, 0.2);
  border-color: rgba(255, 165, 0, 0.5);
  transform: translateY(-1px);
}

.btn-mode-switch.active {
  background: rgba(0, 255, 127, 0.1);
  color: #00ff7f;
  border-color: rgba(0, 255, 127, 0.3);
}

.btn-mode-switch.active:hover {
  background: rgba(0, 255, 127, 0.2);
  border-color: rgba(0, 255, 127, 0.5);
}

.title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 153, 255, 0.3);
}

/* 主要内容区域 */
.chat-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: calc(100vh - 120px); /* 增加高度以避免被header遮挡 */
  padding-top: 3rem; /* 增加顶部内边距，确保内容不被sticky header遮挡 */
}

.chat-container {
  background: rgba(16, 26, 40, 0.6);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px; /* 减少最小高度，为状态区域留出空间 */
  max-height: calc(100vh - 250px); /* 限制最大高度，确保状态区域可见 */
}

/* 聊天消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  max-height: calc(100vh - 350px); /* 动态计算高度，确保输入框可见 */
  min-height: 300px; /* 设置最小高度 */
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 1rem;
  align-items: flex-start;
  animation: messageAppear 0.3s ease-out;
}

/* 用户消息显示在右边，机器人消息显示在左边 */
.chat-message.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.3);
  flex-shrink: 0;
  color: #0099ff;
}

.message-avatar svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.user-message .message-avatar {
  background: rgba(255, 153, 0, 0.2);
  border-color: rgba(255, 153, 0, 0.3);
  color: #ff9900;
}

.message-content {
  max-width: 70%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.user-message .message-content {
  background: rgba(0, 153, 255, 0.15);
  border-color: rgba(0, 153, 255, 0.3);
}

.message-text {
  color: #ffffff;
  line-height: 1.5;
  word-wrap: break-word;
  margin-bottom: 0.25rem;
}

.message-time {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
}

/* 用户消息时间左对齐，因为用户消息在右边显示 */
.user-message .message-time {
  text-align: left;
}

/* 输入区域 */
.chat-input-area {
  border-top: 1px solid rgba(0, 153, 255, 0.2);
  padding-top: 1rem;
}

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.chat-input {
  flex: 1;
  background: rgba(26, 26, 46, 0.7);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.chat-input:focus {
  outline: none;
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 153, 255, 0.2);
}

.chat-input::placeholder {
  color: #aaa;
}

.chat-send-btn {
  background: linear-gradient(135deg, #0099ff, #0066cc);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 80px;
}

.chat-send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0088ee, #0055bb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 状态信息 */
.chat-status {
  background: rgba(16, 26, 40, 0.6);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  color: #aaa;
  font-size: 0.9rem;
}

.status-value {
  color: #ffffff;
  font-weight: 600;
}

.status-value.online,
.status-value.active {
  color: #4caf50;
}

.status-value.offline,
.status-value.inactive {
  color: #f44336;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4da6ff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* 动画 */
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 153, 255, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 153, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .chat-main {
    padding: 1rem;
    padding-top: 2rem; /* 移动端减少顶部内边距 */
  }

  .chat-container {
    padding: 1rem;
    min-height: 400px; /* 移动端减少最小高度 */
    max-height: calc(100vh - 200px); /* 移动端调整最大高度 */
  }

  .chat-messages {
    max-height: calc(100vh - 280px); /* 移动端调整消息区域高度 */
    min-height: 250px;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-status {
    flex-direction: column;
    gap: 1rem;
  }

  .title {
    font-size: 1.2rem;
  }
}
</style>
