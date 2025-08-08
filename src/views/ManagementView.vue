<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">机器人综合管理中心</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small" @click="handleRefreshAllStatus">刷新状态</button>
          <button class="btn btn-small" @click="handleEmergencyStopAll">紧急停止</button>
          <button class="btn btn-small" @click="handleExportAllData">导出数据</button>
        </div>
      </div>
    </header>

    <main class="management-main">
      <!-- 第一层：机器人画面区域 -->
      <section class="camera-layer">
        <div class="camera-section-row" style="display: flex; gap: 32px; align-items: flex-start;">
          <!-- 视频显示区域 -->
          <div class="camera-section" style="flex: 1; min-width: 0;">
            <div class="video-display" style="height: 500px !important; max-width: 900px !important; width: 100% !important; margin: 0 auto !important;">
              <!-- 视频模式 -->
              <video
                v-if="!useFallbackImage"
                ref="cameraVideo"
                class="camera-stream"
                style="object-fit: contain !important; width: 100% !important; height: 100% !important;"
                :src="cameraStreamUrl"
                autoplay
                muted
                playsinline
                controls
                preload="none"
                @loadstart="onVideoLoadStart"
                @loadeddata="onVideoLoaded"
                @play="onVideoPlay"
                @pause="onVideoPause"
                @ended="onVideoEnded"
                @error="onVideoError"
                @canplay="onVideoCanPlay"
                @waiting="onVideoWaiting"
              >
                <div class="video-placeholder">
                  <div class="placeholder-icon">📹</div>
                  <div class="placeholder-text">摄像头画面</div>
                  <div class="placeholder-status">{{ cameraStatus }}</div>
                </div>
              </video>
              <!-- 图片模式（MJPEG流备用方案） -->
              <img
                v-else
                ref="cameraImage"
                class="camera-stream"
                style="object-fit: contain !important; width: 100% !important; height: 100% !important;"
                :src="cameraStreamUrl"
                @load="onImageLoad"
                @error="onImageError"
                alt="摄像头画面"
              />
              <div v-if="!cameraConnected && !cameraStreamUrl" class="video-overlay">
                <div class="overlay-content">
                  <div class="overlay-icon">📹</div>
                  <div class="overlay-text">摄像头画面</div>
                  <div class="overlay-status">{{ cameraStatus }}</div>
                </div>
              </div>
            </div>
            <!-- 摄像头控制按钮 -->
            <div class="camera-controls">
              <button class="camera-btn" @click="handleInitializeCamera" :disabled="cameraLoading">
                {{ cameraLoading ? '连接中...' : '刷新摄像头' }}
              </button>
              <button class="camera-btn" @click="handleToggleCamera" :disabled="cameraLoading">
                {{ cameraConnected ? '断开摄像头' : '连接摄像头' }}
              </button>
              <button class="camera-btn" @click="handleToggleFullscreen" :disabled="!cameraConnected">
                {{ isFullscreen ? '🔍 退出全屏' : '🔍 全屏' }}
              </button>
            </div>
          </div>
          <!-- 头部控制操作盘 -->
          <div class="head-control-section">
            <div class="section-header">
              <h3>头部控制操作盘</h3>
            </div>
            <div class="direction-section">
              <div class="direction-pad">
                <div></div>
                <button class="direction-btn" @click="moveHead('up')">
                  <span class="arrow">▲</span>
                  <span class="label">上</span>
                </button>
                <div></div>
                <button class="direction-btn" @click="moveHead('left')">
                  <span class="arrow">◀</span>
                  <span class="label">左</span>
                </button>
                <button class="direction-btn" @click="moveHead('reset')">
                  <span class="arrow">●</span>
                  <span class="label">复位</span>
                </button>
                <button class="direction-btn" @click="moveHead('right')">
                  <span class="arrow">▶</span>
                  <span class="label">右</span>
                </button>
                <div></div>
                <button class="direction-btn" @click="moveHead('down')">
                  <span class="arrow">▼</span>
                  <span class="label">下</span>
                </button>
                <div></div>
              </div>
              <div class="func-btn-row">
                <button class="direction-btn emergency" @click="moveHead('stop')">
                  <span class="stop-icon">■</span>
                  <span class="label">停止</span>
                </button>
                <button class="direction-btn" @click="fetchHeadStatus">
                  <span class="arrow">ℹ️</span>
                  <span class="label">状态</span>
                </button>
              </div>
              <div class="head-status-text">{{ headStatusText }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 第二层：三个功能模块水平排列 -->
      <section class="modules-layer">
        <div class="modules-grid">

          <!-- 左侧模块：语音库管理 -->
          <div class="module-section voice-module">
            <div class="module-header">
              <h3>🎤 语音库管理</h3>
              <div class="module-status" :class="voiceStatus">{{ voiceStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 语音库统计 -->
              <div class="library-stats">
                <span>共 {{ voiceLibrary.length }} 条语音</span>
                <button class="btn btn-small btn-secondary" @click="handleOpenChatDialog">💬 交互</button>
                <button class="btn btn-small btn-primary" @click="handleShowAddDialog">+ 添加语音</button>
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
                </div>
              </div>

              <!-- 语音列表 -->
              <div class="voice-list scrollable-list">
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
                      </div>
                    </div>
                    <div class="voice-actions">
                      <button
                        class="btn btn-mini btn-play"
                        @click="handlePlayVoiceText(voice)"
                        :disabled="isSpeaking"
                      >
                        {{ playingVoiceId === voice.id ? '暂停' : '播放' }}
                      </button>
                      <button
                        class="btn btn-mini btn-edit"
                        @click="handleEditVoiceText(voice)"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                  <div class="voice-content">{{ voice.content }}</div>
                </div>
              </div>
            </div>
          </div>



          <!-- 中间模块：上肢动作库管理 -->
          <div class="module-section arm-module">
            <div class="module-header">
              <h3>🦾 上肢动作库</h3>
              <div class="module-status" :class="armStatus">{{ armStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 动作库统计 -->
              <div class="library-stats">
                <span>共 {{ actionLibrary.length }} 个动作</span>
                <div class="library-actions">
                  <button class="btn btn-small btn-primary" @click="handleExecuteTaiji" :disabled="isExecutingTaiji">
                    {{ isExecutingTaiji ? '太极中...' : '太极' }}
                  </button>
                  <button class="btn btn-small btn-secondary" @click="handleLoadActionLibrary" :disabled="isLoadingActions">
                    {{ isLoadingActions ? '刷新中...' : '刷新' }}
                  </button>
                </div>
              </div>

              <!-- 搜索和筛选 -->
              <div class="action-controls">
                <div class="search-box">
                  <input
                    type="text"
                    v-model="actionSearchText"
                    placeholder="搜索动作名称..."
                    class="search-input"
                  >
                </div>
                <div class="filter-controls">
                  <select v-model="selectedActionCategory" class="filter-select">
                    <option value="">所有分类</option>
                    <option value="basic">基础动作</option>
                    <option value="gesture">手势动作</option>
                    <option value="manipulation">操作动作</option>
                    <option value="expression">表达动作</option>
                  </select>
                </div>
              </div>

              <!-- 动作列表 -->
              <div class="action-list scrollable-list">
                <div
                  class="action-item"
                  v-for="action in filteredActionLibrary"
                  :key="action.id"
                  :class="{ executing: executingActionId === action.id }"
                >
                  <div class="action-header">
                    <div class="action-info">
                      <span class="action-name">{{ action.name }}</span>
                      <div class="action-meta">
                        <span class="action-category">{{ getActionCategoryName(action.category) }}</span>
                        <span class="action-duration">{{ action.duration }}s</span>
                      </div>
                    </div>
                    <div class="action-actions">
                      <button
                        class="btn btn-mini btn-execute"
                        @click="handleExecuteAction(action)"
                        :disabled="isExecutingArmAction"
                      >
                        {{ executingActionId === action.id ? '执行中' : '执行' }}
                      </button>
                    </div>
                  </div>
                  <div class="action-description">{{ action.description }}</div>
                  <div v-if="executingActionId === action.id" class="action-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: armProgress + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ armProgress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧模块：下肢移动控制 -->
          <div class="module-section leg-module">
            <div class="module-header">
              <h3>🦵 下肢移动控制</h3>
              <div class="module-status" :class="legStatus">{{ legStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 方向控制 -->
              <div class="direction-control-panel">
                <h4>方向控制</h4>
                <div class="direction-pad-extended">
                  <!-- 左移按钮 -->
                  <button
                    class="direction-btn side-btn left-move"
                    :class="{ active: currentDirection === 'left-move' }"
                    :disabled="isExecutingMovement"
                    @click="handleExecuteMovement('left-move')"
                  >
                    <span class="direction-icon">←</span>
                    <span class="direction-label">左移</span>
                  </button>

                  <!-- 中央控制区域 -->
                  <div class="center-controls">
                    <button
                      class="direction-btn forward"
                      :class="{ active: currentDirection === 'forward' }"
                      @click="handleExecuteMovement('forward')"
                      :disabled="isExecutingMovement"
                    >
                      <span class="direction-icon">↑</span>
                      <span class="direction-label">前进</span>
                    </button>
                    <div class="direction-middle-row">
                      <button
                        class="direction-btn left"
                        :class="{ active: currentDirection === 'left' }"
                        @click="handleExecuteMovement('left')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↺</span>
                        <span class="direction-label">左转</span>
                      </button>
                      <button
                        class="direction-btn stop emergency"
                        :class="{ active: currentDirection === 'stop' }"
                        @click="handleExecuteMovement('stop')"
                      >
                        <span class="direction-icon">■</span>
                        <span class="direction-label">紧急停止</span>
                      </button>
                      <button
                        class="direction-btn right"
                        :class="{ active: currentDirection === 'right' }"
                        @click="handleExecuteMovement('right')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↻</span>
                        <span class="direction-label">右转</span>
                      </button>
                    </div>
                    <div class="direction-bottom-row">
                      <button
                        class="direction-btn march"
                        :class="{ active: currentDirection === 'march' }"
                        @click="handleExecuteMovement('march')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">⬆⬇</span>
                        <span class="direction-label">踏步</span>
                      </button>
                      <button
                        class="direction-btn backward"
                        :class="{ active: currentDirection === 'backward' }"
                        @click="handleExecuteMovement('backward')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↓</span>
                        <span class="direction-label">后退</span>
                      </button>
                    </div>
                  </div>

                  <!-- 右移按钮 -->
                  <button
                    class="direction-btn side-btn right-move"
                    :class="{ active: currentDirection === 'right-move' }"
                    :disabled="isExecutingMovement"
                    @click="handleExecuteMovement('right-move')"
                  >
                    <span class="direction-icon">→</span>
                    <span class="direction-label">右移</span>
                  </button>
                </div>
              </div>

              <!-- 单步移动控制 -->
              <div class="single-step-panel">
                <h4>单步移动控制</h4>
                <div class="single-step-buttons">
                  <button
                    class="btn btn-step forward-step"
                    @click="executeSingleStep('forward')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↑</span>
                    <span class="step-label">前进一步</span>
                  </button>
                  <button
                    class="btn btn-step backward-step"
                    @click="executeSingleStep('backward')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↓</span>
                    <span class="step-label">后退一步</span>
                  </button>
                  <button
                    class="btn btn-step left-turn-step"
                    @click="executeSingleStep('turn_left')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↺</span>
                    <span class="step-label">左转一下</span>
                  </button>
                  <button
                    class="btn btn-step right-turn-step"
                    @click="executeSingleStep('turn_right')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↻</span>
                    <span class="step-label">右转一下</span>
                  </button>
                  <button
                    class="btn btn-step left-move-step"
                    @click="executeSingleStep('left')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">←</span>
                    <span class="step-label">左移一步</span>
                  </button>
                  <button
                    class="btn btn-step right-move-step"
                    @click="executeSingleStep('right')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">→</span>
                    <span class="step-label">右移一步</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- 调试信息面板 -->
      <section class="debug-panel" style="background: rgba(0, 20, 40, 0.6); border: 1px solid rgba(255, 255, 0, 0.3); border-radius: 8px; padding: 15px; margin-top: 20px;">
        <h4 style="color: #ffeb3b; margin: 0 0 10px 0;">🔧 系统状态监控</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; font-size: 13px;">
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🎵 语音系统</div>
            <div style="color: #ffffff;">状态: {{ isSpeaking ? '播放中' : '空闲' }}</div>
            <div style="color: #ffffff;">语音库: {{ voiceLibrary.length }} 条</div>
            <div style="color: #ffffff;">当前播放: {{ playingVoiceId ? `ID ${playingVoiceId}` : '无' }}</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🦾 上肢系统</div>
            <div style="color: #ffffff;">状态: {{ isExecutingArmAction ? '执行中' : '空闲' }}</div>
            <div style="color: #ffffff;">动作库: {{ actionLibrary.length }} 个</div>
            <div style="color: #ffffff;">执行进度: {{ armProgress }}%</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🦵 下肢系统</div>
            <div style="color: #ffffff;">状态: {{ isExecutingMovement ? '执行中' : '空闲' }}</div>
            <div style="color: #ffffff;">当前动作: {{ currentMovement }}</div>
            <div style="color: #ffffff;">位置: X{{ position.x }}, Y{{ position.y }}</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">📹 摄像头</div>
            <div style="color: #ffffff;">状态: {{ cameraConnected ? '已连接' : '未连接' }}</div>
            <div style="color: #ffffff;">{{ cameraStatus }}</div>
            <div style="color: #ffffff;">全屏: {{ isFullscreen ? '是' : '否' }}</div>
          </div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 4px; font-size: 11px; color: #cccccc;">
          <strong>API端点:</strong> TTS: /api/tts/* | 机器人: /api/robot/* | 移动: /api/robot_movement/* | 摄像头: /api/video/*
        </div>
      </section>
    </main>

    <!-- 添加/编辑语音对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="handleCloseDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加语音' : '编辑语音' }}</h3>
          <button class="dialog-close" @click="handleCloseDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="dialogData.title" placeholder="输入语音标题">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="dialogData.content" placeholder="输入语音内容" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="dialogData.category">
              <option value="greeting">问候语</option>
              <option value="response">回应语</option>
              <option value="notification">通知语</option>
              <option value="emotion">情感表达</option>
              <option value="system">系统提示</option>
            </select>
          </div>
          <div class="form-group">
            <label>语言</label>
            <select v-model="dialogData.language">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCloseDialog">取消</button>
          <button class="btn btn-primary" @click="handleSaveVoiceData">保存</button>
        </div>
      </div>
    </div>

    <!-- 聊天对话框 -->
    <div v-if="showChatDialog" class="dialog-overlay" @click="handleCloseChatDialog">
      <div class="chat-dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>💬 机器人交互聊天</h3>
          <button class="dialog-close" @click="handleCloseChatDialog">×</button>
        </div>
        <div class="chat-dialog-body">
          <!-- 聊天消息区域 -->
          <div class="chat-messages" ref="chatMessagesContainer">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="chat-message"
              :class="{ 'user-message': message.type === 'human', 'robot-message': message.type === 'robot' }"
            >
              <div class="message-avatar">
                {{ message.type === 'human' ? '👤' : '🤖' }}
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.text }}</div>
                <div class="message-time">{{ formatTime(message.created_at) }}</div>
              </div>
            </div>
            <div v-if="chatLoading" class="chat-message robot-message">
              <div class="message-avatar">🤖</div>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { voiceApi } from '../api/voiceApi.js'
import { movementApi } from '../api/movementApi.js'
import { cameraApi } from '../api/cameraApi.js'
import { realRobotApi } from '../api/realRobotApi.js'
import { chatApi } from '../api/chatApi.js'
import { moveHeadUp, moveHeadDown, moveHeadLeft, moveHeadRight, resetHead, stopHead, getHeadStatus } from '../api/simulationHeadApi'
// 其它API如有需要可继续补充

const router = useRouter()

// 摄像头相关数据
const cameraConnected = ref(false)
const cameraLoading = ref(false)
const cameraStatus = ref('摄像头未连接')
const cameraStreamUrl = ref('')
const cameraVideo = ref(null)
const cameraImage = ref(null)
const useFallbackImage = ref(true) // 默认使用图片模式显示MJPEG流
const isFullscreen = ref(false) // 全屏状态

// 语音控制相关
const voiceStatus = ref('online')
const voiceStatusText = ref('语音系统就绪')
const isSpeaking = ref(false)
const playingVoiceId = ref(null)

// 语音库数据和搜索筛选
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
  },
  {
    id: 6,
    title: '情感表达-开心',
    content: '太好了！我感到非常开心！',
    category: 'emotion',
    language: 'zh-CN',
    duration: 2.5,
    volume: 85,
    speed: 1.2,
    pitch: 1.2,
    showSettings: false
  },
  {
    id: 7,
    title: '情感表达-关心',
    content: '您还好吗？需要我为您做些什么吗？',
    category: 'emotion',
    language: 'zh-CN',
    duration: 3.8,
    volume: 80,
    speed: 0.9,
    pitch: 1.0,
    showSettings: false
  },
  {
    id: 8,
    title: '系统提示-连接',
    content: '系统连接正常，所有功能已就绪。',
    category: 'system',
    language: 'zh-CN',
    duration: 3.0,
    volume: 75,
    speed: 1.0,
    pitch: 1.0,
    showSettings: false
  }
])
const searchText = ref('')
const selectedCategory = ref('')

// 聊天相关数据
const showChatDialog = ref(false)
const chatMessages = ref([])
const chatInputText = ref('')
const chatLoading = ref(false)
const chatMessagesContainer = ref(null)
const chatPollingTimer = ref(null)
const lastMessageId = ref(null)



// 语音库过滤
const filteredVoiceLibrary = computed(() => {
  return voiceLibrary.value.filter(voice => {
    const matchesSearch = !searchText.value ||
      voice.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
      voice.content.toLowerCase().includes(searchText.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || voice.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// 语音相关方法
const fetchVoiceTexts = async () => {
  try {
    console.log('🔄 开始获取语音文本...')
    console.log('🌐 API端点:', '/api/tts/text')
    voiceStatusText.value = '正在加载语音库...'

    const result = await voiceApi.getVoiceTexts()
    console.log('📚 API返回的原始数据:', result)
    console.log('📊 返回数据类型:', typeof result, '是否为对象:', typeof result === 'object')

    // 正确处理嵌套的数据结构
    if (result && result.success && result.data && result.data.texts) {
      console.log('📝 开始转换服务器数据格式...')
      const texts = result.data.texts
      console.log('📝 提取的texts数组:', texts)
      console.log('📊 texts数组长度:', texts.length)

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
        console.log(`📝 转换第${index + 1}条:`, {
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
      voiceStatusText.value = `语音库已加载，共 ${serverTexts.length} 条`
      console.log('✅ 语音文本加载完成，数量:', serverTexts.length)
    } else {
      console.log('ℹ️ 服务器返回空的语音文本列表或数据结构不正确')
      console.log('ℹ️ 返回的数据结构:', result)
      voiceLibrary.value = []
      voiceStatusText.value = '语音库为空或数据格式错误'
    }
  } catch (error) {
    console.error('❌ 获取语音文本失败:', error)
    console.error('❌ 错误详情:', error.message, error.stack)
    voiceStatusText.value = `获取语音库失败: ${error.message}`
  }
}



const handlePlayVoiceText = async (voice) => {
  if (isSpeaking.value) {
    console.log('🎵 语音正在播放中，忽略新的播放请求')
    return
  }

  try {
    console.log('🎵 开始播放语音:', voice.content)
    playingVoiceId.value = voice.id
    isSpeaking.value = true
    voiceStatusText.value = '正在合成语音...'

    const result = await voiceApi.synthesizeText(voice.content)
    console.log('🎵 语音合成API响应:', result)

    if (result && result.success) {
      console.log('✅ 语音合成成功，机器人开始说话')
      voiceStatusText.value = `正在播放: ${voice.title || voice.content.substring(0, 10)}...`

      // 模拟播放时间（根据文本长度估算）
      const estimatedDuration = Math.max(2000, voice.content.length * 200)

      setTimeout(() => {
        isSpeaking.value = false
        playingVoiceId.value = null
        voiceStatusText.value = '语音播放完成'
        console.log('✅ 语音播放完成')

        setTimeout(() => {
          voiceStatusText.value = `语音库已加载，共 ${voiceLibrary.value.length} 条`
        }, 2000)
      }, estimatedDuration)

    } else {
      throw new Error(result?.message || '语音合成失败')
    }
  } catch (error) {
    console.error('❌ 语音播放失败:', error)
    isSpeaking.value = false
    playingVoiceId.value = null
    voiceStatusText.value = `播放失败: ${error.message}`
    alert(`语音播放失败: ${error.message}`)
  }
}

// 对话框相关
const showDialog = ref(false)
const dialogMode = ref('add') // 'add' 或 'edit'
const dialogData = reactive({
  id: null,
  title: '',
  content: '',
  category: 'greeting',
  language: 'zh-CN'
})

// 上肢控制相关
const armStatus = ref('online')
const armStatusText = ref('上肢系统就绪')
const isExecutingArmAction = ref(false)
const executingActionId = ref(null)
const armProgress = ref(0)
const isLoadingActions = ref(false)

// 太极动作相关
const isExecutingTaiji = ref(false)

// 动作库数据和搜索筛选
const actionLibrary = ref([])
const actionSearchText = ref('')
const selectedActionCategory = ref('')

// 动作库过滤
const filteredActionLibrary = computed(() => {
  return actionLibrary.value.filter(action => {
    const matchesSearch = !actionSearchText.value ||
      action.name.toLowerCase().includes(actionSearchText.value.toLowerCase()) ||
      action.description.toLowerCase().includes(actionSearchText.value.toLowerCase())
    const matchesCategory = !selectedActionCategory.value || action.category === selectedActionCategory.value
    return matchesSearch && matchesCategory
  })
})

// 动作库相关方法
const handleLoadActionLibrary = async () => {
  isLoadingActions.value = true
  try {
    console.log('📚 正在从API加载动作库...')
    armStatusText.value = '正在加载动作库...'

    // 临时修改：如果真实机器人服务器不可用，尝试使用仿真机器人服务器
    let response
    try {
      console.log('📚 尝试从真实机器人服务器加载动作库...')
      response = await movementApi.getRobotActions()
      console.log('真实机器人动作列表API响应:', response)
    } catch (error) {
      console.warn('❌ 真实机器人服务器不可用，尝试仿真机器人服务器:', error.message)
      console.log('📚 尝试从仿真机器人服务器加载动作库...')
      response = await movementApi.getSimulationActions()
      console.log('仿真机器人动作列表API响应:', response)
    }

    if (response.success) {
      // 服务器返回格式: { success: true, data: { success: true, actions: [...] } }
      console.log('API调用成功，解析动作数据...')
      console.log('完整响应数据:', JSON.stringify(response, null, 2))

      let actionsData = null

      // 根据实际的服务器响应结构解析数据
      // 服务器返回: { success: true, data: { success: true, message: "...", data: { success: true, actions: [...] } } }

      if (response.data && response.data.data && response.data.data.actions && Array.isArray(response.data.data.actions)) {
        // 实际格式: response.data.data.actions
        actionsData = response.data.data.actions
        console.log('✅ 找到动作数据（三层嵌套），数量:', actionsData.length)
      } else if (response.data && response.data.actions && Array.isArray(response.data.actions)) {
        // 备用格式: response.data.actions
        actionsData = response.data.actions
        console.log('✅ 找到动作数据（二层嵌套），数量:', actionsData.length)
      } else if (Array.isArray(response.data)) {
        // 备用格式: response.data 直接是数组
        actionsData = response.data
        console.log('✅ 找到动作数据（直接数组），数量:', actionsData.length)
      } else {
        console.error('❌ 未找到actions数组')
        console.error('response.data结构:', response.data)
        if (response.data && response.data.data) {
          console.error('response.data.data结构:', response.data.data)
          console.error('response.data.data的keys:', Object.keys(response.data.data))
        }
      }

      if (actionsData && Array.isArray(actionsData) && actionsData.length > 0) {
        const apiActions = parseApiActions(actionsData)
        actionLibrary.value = apiActions
        armStatusText.value = `动作库已加载，共 ${apiActions.length} 个动作`
        console.log('✅ 动作库加载完成，解析后动作数量:', apiActions.length)
      } else {
        console.warn('❌ 动作数据为空或格式不正确')
        console.warn('actionsData:', actionsData)
        actionLibrary.value = [...defaultActions]
        armStatusText.value = '动作数据为空，使用默认动作'
      }
    } else {
      // API调用失败，使用默认动作
      const errorMessage = response.error || response.message || '未知错误'
      console.warn('API获取动作列表失败，使用默认动作:', errorMessage)
      actionLibrary.value = [...defaultActions]
      armStatusText.value = `加载动作库失败: ${errorMessage}`
    }
  } catch (error) {
    console.error('❌ 加载动作库失败:', error)
    actionLibrary.value = [...defaultActions]
    armStatusText.value = `加载动作库失败: ${error.message}`
  } finally {
    isLoadingActions.value = false
  }
}

// 解析API返回的动作数据
const parseApiActions = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) {
    console.warn('API返回的动作数据格式不正确:', apiData)
    return defaultActions
  }

  return apiData.map((action, index) => {
    // 处理API返回的动作对象格式
    if (typeof action === 'object' && action.name) {
      return {
        id: Date.now() + index,
        name: action.name,
        description: `动作文件: ${action.file_name}`,
        category: 'basic', // 默认分类，可以根据需要调整
        difficulty: 'medium', // 默认难度
        duration: 3.0, // 默认持续时间
        showSteps: false,
        steps: [
          { description: '准备动作', duration: 1.0 },
          { description: '执行动作', duration: 1.5 },
          { description: '完成动作', duration: 0.5 }
        ],
        fileName: action.file_name, // 保存文件名用于API调用
        filePath: action.file_path,
        fileSize: action.file_size,
        modifiedTime: action.modified_time,
        modifiedTimeStr: action.modified_time_str
      }
    }

    // 如果API返回的是字符串（文件名）
    if (typeof action === 'string' && action.endsWith('.tact')) {
      return {
        id: Date.now() + index,
        name: action.replace('.tact', ''),
        description: `从文件 ${action} 加载的动作`,
        category: 'basic',
        difficulty: 'easy',
        duration: 2.0,
        showSteps: false,
        steps: [
          { description: '准备动作', duration: 0.6 },
          { description: '执行动作', duration: 0.8 },
          { description: '完成动作', duration: 0.6 }
        ],
        fileName: action
      }
    }

    // 其他情况，创建默认动作
    return {
      id: Date.now() + index,
      name: `动作${index + 1}`,
      description: '未知动作',
      category: 'basic',
      difficulty: 'easy',
      duration: 2.0,
      showSteps: false,
      steps: [
        { description: '准备动作', duration: 0.6 },
        { description: '执行动作', duration: 0.8 },
        { description: '完成动作', duration: 0.6 }
      ]
    }
  })
}

// 默认动作列表
const defaultActions = [
  {
    id: 1,
    name: '挥手',
    description: '机器人挥手动作',
    category: 'gesture',
    difficulty: 'easy',
    duration: 2.0,
    showSteps: false,
    steps: [
      { description: '准备挥手', duration: 0.5 },
      { description: '执行挥手', duration: 1.0 },
      { description: '完成挥手', duration: 0.5 }
    ]
  },
  {
    id: 2,
    name: '点头',
    description: '机器人点头动作',
    category: 'gesture',
    difficulty: 'easy',
    duration: 1.5,
    showSteps: false,
    steps: [
      { description: '准备点头', duration: 0.3 },
      { description: '执行点头', duration: 0.9 },
      { description: '完成点头', duration: 0.3 }
    ]
  }
]

const handleExecuteAction = async (action) => {
  if (isExecutingArmAction.value) return

  isExecutingArmAction.value = true
  executingActionId.value = action.id
  armProgress.value = 0

  console.log('🦾 开始执行上肢动作:', action.name)

  // 启动进度条动画
  const progressInterval = setInterval(() => {
    if (armProgress.value < 90) {
      armProgress.value += 5
    }
  }, (action.duration * 1000) / 18)

  try {
    const result = await movementApi.executeAction(action)

    if (result.success) {
      console.log('✅ 机器人动作执行成功')
      armProgress.value = 100

      setTimeout(() => {
        clearInterval(progressInterval)
        isExecutingArmAction.value = false
        executingActionId.value = null
        armProgress.value = 0
        console.log('🦾 上肢动作执行完成:', action.name)
      }, 500)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('❌ 上肢动作执行异常:', error)
    clearInterval(progressInterval)
    isExecutingArmAction.value = false
    executingActionId.value = null
    armProgress.value = 0
    alert(`动作执行失败: ${error.message}`)
  }
}

// 太极动作执行方法
const handleExecuteTaiji = async () => {
  if (isExecutingTaiji.value) return

  isExecutingTaiji.value = true
  console.log('🥋 开始执行太极动作')

  try {
    const result = await realRobotApi.executeTaijiAction({
      duration: 30.0 // 太极动作通常需要较长时间
    })

    if (result && result.success !== false) {
      console.log('✅ 太极动作执行成功')
      armStatusText.value = '太极动作执行中...'

      // 模拟太极动作执行时间（30秒）
      setTimeout(() => {
        isExecutingTaiji.value = false
        armStatusText.value = '太极动作执行完成'
        console.log('🥋 太极动作执行完成')

        // 3秒后恢复状态文本
        setTimeout(() => {
          armStatusText.value = '上肢系统就绪'
        }, 3000)
      }, 30000)
    } else {
      throw new Error(result?.error || '太极动作执行失败')
    }
  } catch (error) {
    console.error('❌ 太极动作执行异常:', error)
    isExecutingTaiji.value = false
    armStatusText.value = '上肢系统就绪'

    // 提供更友好的错误信息
    let errorMessage = '太极动作执行失败'
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    if (error.response?.status === 404) {
      errorMessage = '太极接口不存在，请检查服务器配置'
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请检查机器人状态'
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络连接'
    }

    alert(errorMessage)
  }
}

// 下肢控制相关
const legStatus = ref('online')
const legStatusText = ref('下肢系统就绪')
const isExecutingMovement = ref(false)
const currentMovement = ref('静止')
const currentDirection = ref('stop')
const position = reactive({ x: 0, y: 0 })

// 单步移动控制相关
const isExecutingSingleStep = ref(false)

// 头部控制相关
const headStatusText = ref('')
const moveHead = async (direction) => {
  headStatusText.value = '操作中...'
  try {
    if (direction === 'up') await moveHeadUp()
    else if (direction === 'down') await moveHeadDown()
    else if (direction === 'left') await moveHeadLeft()
    else if (direction === 'right') await moveHeadRight()
    else if (direction === 'reset') await resetHead()
    else if (direction === 'stop') await stopHead()
    headStatusText.value = '操作成功'
  } catch (e) {
    headStatusText.value = '操作失败'
  }
}
const fetchHeadStatus = async () => {
  headStatusText.value = '获取中...'
  try {
    const res = await getHeadStatus()
    headStatusText.value = res?.data ? JSON.stringify(res.data) : '无数据'
  } catch (e) {
    headStatusText.value = '获取失败'
  }
}

// 基础方法
const goBack = () => {
  router.push('/')
}

// 系统控制方法
const handleRefreshAllStatus = async () => {
  try {
    console.log('🔄 开始刷新所有系统状态...')

    // 更新状态文本
    voiceStatusText.value = '正在刷新语音库...'
    armStatusText.value = '正在刷新动作库...'
    cameraStatus.value = '正在刷新摄像头...'

    const result = await movementApi.refreshAllStatus()

    if (result.success) {
      // 更新数据
      voiceLibrary.value = result.data.voiceTexts
      actionLibrary.value = result.data.actionList
      cameraConnected.value = result.data.cameraStatus.connected

      // 更新状态文本
      voiceStatusText.value = `语音库已加载，共 ${result.data.voiceTexts.length} 条`
      armStatusText.value = `动作库已加载，共 ${result.data.actionList.length} 个动作`
      cameraStatus.value = result.data.cameraStatus.connected ? '摄像头已连接' : '摄像头未连接'

      console.log('✅ 所有系统状态刷新完成')
    }
  } catch (error) {
    console.error('❌ 刷新系统状态时出现错误:', error)
    alert(`刷新失败: ${error.message}`)
  }
}

const handleEmergencyStopAll = async () => {
  try {
    console.log('🚨 执行紧急停止所有系统')

    // 本地状态重置
    isSpeaking.value = false
    playingVoiceId.value = null
    isExecutingArmAction.value = false
    executingActionId.value = null
    isExecutingMovement.value = false
    currentMovement.value = '紧急停止'
    currentDirection.value = 'stop'

    // 调用系统API
    await movementApi.emergencyStopAll()

    alert('所有系统已紧急停止')
  } catch (error) {
    console.error('❌ 紧急停止失败:', error)
    alert(`紧急停止失败: ${error.message}`)
  }
}

const handleExportAllData = async () => {
  try {
    await movementApi.exportAllData()
    alert('数据导出成功')
  } catch (error) {
    console.error('❌ 导出数据失败:', error)
    alert(`导出失败: ${error.message}`)
  }
}

// 对话框相关方法
const handleShowAddDialog = () => {
  dialogMode.value = 'add'
  dialogData.id = null
  dialogData.title = ''
  dialogData.content = ''
  dialogData.category = 'greeting'
  dialogData.language = 'zh-CN'
  showDialog.value = true
}

const handleEditVoiceText = (voice) => {
  dialogMode.value = 'edit'
  dialogData.id = voice.id
  dialogData.title = voice.title
  dialogData.content = voice.content
  dialogData.category = voice.category
  dialogData.language = voice.language
  showDialog.value = true
}

const handleCloseDialog = () => {
  showDialog.value = false
}

const handleSaveVoiceData = async () => {
  try {
    await voiceApi.saveVoiceText(dialogData)
    console.log('✅ 语音文本保存成功')
    await fetchVoiceTexts()
    handleCloseDialog()
    alert(dialogMode.value === 'add' ? '语音文本添加成功' : '语音文本更新成功')
  } catch (error) {
    console.error('❌ 保存语音文本失败:', error)
    alert(`保存失败: ${error.message}`)
  }
}

// 聊天相关方法
const handleOpenChatDialog = async () => {
  console.log('💬 打开聊天对话框')
  showChatDialog.value = true
  await loadChatHistory(true) // 初始加载
  startChatPolling() // 启动轮询
}

const handleCloseChatDialog = () => {
  console.log('💬 关闭聊天对话框')
  showChatDialog.value = false
  stopChatPolling() // 停止轮询
}

const loadChatHistory = async (isInitialLoad = true) => {
  try {
    if (isInitialLoad) {
      console.log('📚 初始加载聊天历史记录...')
    }

    const result = await chatApi.getChatHistory()

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
        // 轮询更新：只添加新消息
        const allMessages = result.data.messages
        const newMessages = allMessages.filter(msg =>
          !lastMessageId.value || msg.id > lastMessageId.value
        )

        if (newMessages.length > 0) {
          console.log('🆕 发现', newMessages.length, '条新消息')

          // 按时间顺序排序新消息
          const sortedNewMessages = newMessages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          // 直接添加所有新消息，不做复杂检查
          sortedNewMessages.forEach(msg => {
            console.log('➕ 立即显示新消息到管理页面:', msg.type, msg.text, 'ID:', msg.id)

            // 直接添加，让用户立即看到
            chatMessages.value.push({
              id: msg.id,
              message_id: msg.message_id,
              text: msg.text,
              type: msg.type,
              created_at: msg.created_at
            })
          })

          // 更新最新消息ID
          lastMessageId.value = Math.max(...newMessages.map(msg => msg.id))
          console.log('📝 更新最新消息ID:', lastMessageId.value)
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

    // 使用robot/send接口，这个接口会同时记录人类消息和生成机器人回复
    const result = await chatApi.sendMessage(userMessage)

    if (result && result.success) {
      console.log('✅ 消息发送成功，等待轮询显示')
      // 轮询会自动获取并显示消息
    } else {
      throw new Error(result?.message || '发送消息失败')
    }
  } catch (error) {
    console.error('❌ 发送消息失败:', error)

    // 只有在真正失败时才添加错误消息
    const errorMsg = {
      id: Date.now(),
      text: `抱歉，发送消息失败：${error.message}`,
      type: 'robot',
      created_at: new Date().toISOString()
    }
    chatMessages.value.push(errorMsg)

    // 滚动到底部
    setTimeout(() => {
      scrollToBottom()
    }, 50)
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
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
  }

  chatPollingTimer.value = setInterval(async () => {
    try {
      await loadChatHistory(false) // 增量更新
    } catch (error) {
      console.warn('⚠️ 聊天轮询失败:', error.message)
    }
  }, 1000) // 每秒轮询一次

  console.log('🔄 聊天轮询已启动，每秒检查新消息')
}

// 停止聊天轮询
const stopChatPolling = () => {
  if (chatPollingTimer.value) {
    clearInterval(chatPollingTimer.value)
    chatPollingTimer.value = null
    console.log('⏹️ 聊天轮询已停止')
  }
}

// 移动控制相关方法
const handleExecuteMovement = async (direction) => {
  if (isExecutingMovement.value && direction !== 'stop') return

  isExecutingMovement.value = true
  currentDirection.value = direction
  currentMovement.value = movementApi.getMovementLabel(direction)

  console.log('🦵 开始执行移动动作:', direction)

  try {
    const result = await movementApi.executeMovement(direction)

    if (result.success) {
      console.log(`✅ ${result.actionName}指令发送成功`)
      currentMovement.value = `${movementApi.getMovementLabel(direction)}中...`

      // 根据不同动作类型设置不同的执行时间
      let executionTime = 2000
      if (direction === 'stop') {
        executionTime = 500
      } else if (direction === 'left' || direction === 'right') {
        executionTime = 1500
      }
      // 踏步动作和其他移动动作一样，使用默认的2000ms执行时间

      setTimeout(() => {
        isExecutingMovement.value = false
        currentDirection.value = 'stop'
        currentMovement.value = '静止'

        if (direction !== 'stop') {
          updatePosition(direction)
        }

        console.log(`🦵 ${result.actionName}动作执行完成`)
      }, executionTime)

    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('❌ 移动动作执行异常:', error)
    currentMovement.value = '执行异常'
    alert(`移动控制失败: ${error.message}`)

    setTimeout(() => {
      isExecutingMovement.value = false
      currentDirection.value = 'stop'
      currentMovement.value = '静止'
    }, 1500)
  }
}

const updatePosition = (direction) => {
  const step = 10
  switch (direction) {
    case 'forward':
      position.y += step
      break
    case 'backward':
      position.y -= step
      break
    case 'left-move':
      position.x -= step
      break
    case 'right-move':
      position.x += step
      break
  }
}

// 执行单步移动
const executeSingleStep = async (stepType) => {
  if (isExecutingSingleStep.value) {
    console.log('⚠️ 单步移动正在执行中，请等待完成')
    return
  }

  isExecutingSingleStep.value = true

  try {
    console.log(`🦵 执行单步移动: ${stepType}`)

    // 构建API URL - 使用Vite代理
    const baseUrl = '/api-move'  // 使用Vite代理，避免CORS问题
    let endpoint = ''

    switch (stepType) {
      case 'forward':
        endpoint = '/robot_movement/forward'
        break
      case 'backward':
        endpoint = '/robot_movement/backward'
        break
      case 'turn_left':
        endpoint = '/robot_movement/turn_left'
        break
      case 'turn_right':
        endpoint = '/robot_movement/turn_right'
        break
      case 'left':
        endpoint = '/robot_movement/left'
        break
      case 'right':
        endpoint = '/robot_movement/right'
        break
      default:
        throw new Error(`未知的移动类型: ${stepType}`)
    }

    const url = baseUrl + endpoint
    console.log(`📡 发送单步移动请求到: ${url}`)

    // 发送HTTP请求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`✅ 单步移动 ${stepType} 执行成功:`, result)

    // 显示成功消息
    const actionNames = {
      'forward': '前进一步',
      'backward': '后退一步',
      'turn_left': '左转一下',
      'turn_right': '右转一下',
      'left': '左移一步',
      'right': '右移一步'
    }

    alert(`${actionNames[stepType]} 执行成功！`)

  } catch (error) {
    console.error(`❌ 单步移动 ${stepType} 执行失败:`, error)

    let errorMessage = `单步移动失败: ${error.message}`
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = '网络连接失败，请检查机器人是否在线'
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接'
    }

    alert(errorMessage)
  } finally {
    isExecutingSingleStep.value = false
  }
}

// 摄像头相关方法
const handleInitializeCamera = async () => {
  cameraLoading.value = true
  cameraStatus.value = '正在连接摄像头...'

  try {
    const response = await cameraApi.testConnection()
    console.log('📹 摄像头连接测试响应:', response)

    // 从Axios响应对象中提取数据
    const result = response.data || response
    console.log('📹 提取的摄像头状态数据:', result)

    if (result && result.connected) {
      cameraConnected.value = true
      cameraStatus.value = '摄像头已连接'
      cameraStreamUrl.value = cameraApi.getStreamUrl()
      console.log('✅ 摄像头连接成功')
    } else {
      cameraConnected.value = false
      cameraStatus.value = result?.error || '摄像头连接失败'
      console.log('❌ 摄像头连接失败:', result?.error)
    }
  } catch (error) {
    console.error('❌ 摄像头初始化异常:', error)
    cameraConnected.value = false
    cameraStatus.value = `连接异常: ${error.message}`
  } finally {
    cameraLoading.value = false
  }
}

const handleToggleCamera = async () => {
  if (cameraConnected.value) {
    // 断开摄像头
    cameraConnected.value = false
    cameraStatus.value = '摄像头已断开'
    cameraStreamUrl.value = ''
  } else {
    // 连接摄像头
    await handleInitializeCamera()
  }
}

const handleToggleFullscreen = () => {
  if (!cameraConnected.value) return

  const videoElement = cameraVideo.value || cameraImage.value
  if (!videoElement) return

  if (!isFullscreen.value) {
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen()
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen()
    } else if (videoElement.mozRequestFullScreen) {
      videoElement.mozRequestFullScreen()
    }
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
    isFullscreen.value = false
  }
}

// 视频事件处理方法
const onVideoLoadStart = () => {
  console.log('📹 视频开始加载')
}

const onVideoLoaded = () => {
  console.log('📹 视频数据加载完成')
}

const onVideoPlay = () => {
  console.log('📹 视频开始播放')
}

const onVideoPause = () => {
  console.log('📹 视频暂停')
}

const onVideoEnded = () => {
  console.log('📹 视频播放结束')
}

const onVideoError = (event) => {
  console.error('📹 视频播放错误:', event)
  cameraStatus.value = '视频播放错误'
}

const onVideoCanPlay = () => {
  console.log('📹 视频可以播放')
}

const onVideoWaiting = () => {
  console.log('📹 视频缓冲中')
}

const onImageLoad = () => {
  console.log('📹 图片加载成功')
}

const onImageError = () => {
  console.error('📹 图片加载失败')
  cameraStatus.value = '图片加载失败'
}

// 工具方法
const getCategoryName = (category) => {
  return movementApi.getCategoryName(category)
}

const getActionCategoryName = (category) => {
  return movementApi.getActionCategoryName(category)
}

// 生命周期钩子
onMounted(async () => {
  console.log('🚀 综合管理页面已加载，开始初始化...')
  console.log('📊 初始数据状态:')
  console.log('- voiceLibrary length:', voiceLibrary.value.length)
  console.log('- cameraStreamUrl:', cameraStreamUrl.value)

  try {
    // 初始化摄像头
    console.log('📹 开始初始化摄像头...')
    cameraStreamUrl.value = cameraApi.getStreamUrl()
    console.log('📹 摄像头流URL:', cameraStreamUrl.value)
    await handleInitializeCamera()

    // 获取语音库数据
    console.log('📚 开始获取语音库数据...')
    await fetchVoiceTexts()
    console.log('📚 语音库数据加载完成，数量:', voiceLibrary.value.length)

    // 加载动作库
    console.log('🦾 开始加载动作库...')
    await handleLoadActionLibrary()

    console.log('✅ 所有系统初始化完成')

    // 延迟1秒后检查数据状态
    setTimeout(() => {
      console.log('🔍 初始化后数据检查:')
      console.log('- 语音库数量:', voiceLibrary.value.length)
      console.log('- 动作库数量:', actionLibrary.value.length)
      console.log('- 摄像头状态:', cameraConnected.value)
    }, 1000)

  } catch (error) {
    console.error('❌ 页面初始化过程中出现错误:', error)
  }
})

onUnmounted(() => {
  // 停止所有语音播放
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }

  // 停止聊天轮询
  stopChatPolling()

  console.log('综合管理页面已卸载')
})
</script>

<style scoped>
@import '../assets/management.css';
.direction-btn {
  background: linear-gradient(145deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 102, 255, 0.08) 100%);
  border: 2px solid rgba(0, 102, 255, 0.4);
  border-radius: 16px;
  color: #4da6ff;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-height: 55px;
  min-width: 70px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 102, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  font-size: 18px;
}
.direction-btn .arrow {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px currentColor;
}
.direction-btn .label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-align: center;
}
.direction-btn.emergency {
  background: linear-gradient(145deg, rgba(255, 0, 0, 0.25) 0%, rgba(255, 0, 0, 0.15) 100%);
  border-color: rgba(255, 0, 0, 0.6);
  color: #ff6666;
}
.direction-btn .stop-icon {
  font-size: 20px;
  color: #ff6666;
  text-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
}
.head-control-section {
  width: 340px;
  min-width: 260px;
  height: 500px;
  background: linear-gradient(135deg, #232b3a 60%, #1a2233 100%);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1.5px 0 #1976d2 inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #1976d2;
  margin: 0;
  padding: 0 10px;
  transition: box-shadow 0.3s;
}
.head-control-section:hover {
  box-shadow: 0 8px 32px rgba(0,102,255,0.22), 0 2px 0 #1976d2 inset;
}
.section-header {
  margin-bottom: 12px;
}
.section-header h3 {
  color: #4da6ff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.2);
  margin: 0;
}
.direction-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.direction-pad {
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: repeat(3, 70px);
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}
.func-btn-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 10px;
}
.head-status-text {
  margin-top: 8px;
  color: #ffeb3b;
  font-size: 14px;
  min-height: 20px;
}
@media (max-width: 900px) {
  .camera-section-row {
    flex-direction: column;
    gap: 18px;
    align-items: stretch;
  }
  .head-control-section {
    width: 100%;
    min-width: 0;
    height: 340px;
    margin: 0 auto;
    margin-bottom: 12px;
    padding: 0 4vw;
  }
  .direction-pad {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 6px;
  }
}
@media (max-width: 600px) {
  .head-control-section {
    min-height: 160px;
    height: auto;
    border-radius: 8px;
    padding: 0 1vw 10px 1vw;
    min-width: 0;
    width: 100%;
  }
  .section-header h3 {
    font-size: 15px;
  }
  .direction-section {
    padding: 0 2vw;
  }
  .direction-pad {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2vw;
    margin-bottom: 4px;
    min-height: 90px;
    height: auto;
    padding: 6px 0;
  }
  .direction-btn {
    min-width: 10vw;
    min-height: 10vw;
    max-width: 16vw;
    max-height: 16vw;
    font-size: 4vw;
    border-radius: 5vw;
    padding: 0;
    box-sizing: border-box;
  }
  .func-btn-row {
    gap: 4vw;
    margin-top: 2vw;
  }
  .head-status-text {
    font-size: 12px;
    min-height: 14px;
    margin-top: 2px;
  }
}
</style>
